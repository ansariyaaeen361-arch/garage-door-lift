const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const PDFDocument = require('pdfkit');
const db = require('../db');
const { attachUserIfPresent } = require('../auth-utils');
const { sendQuoteEmail } = require('../mailer');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PDF_DIR = path.join(__dirname, '..', 'data', 'builder-pdfs');
fs.mkdirSync(PDF_DIR, { recursive: true });

const YELLOW = '#FEC400';
const INK = '#0B0B0B';
const MUTED = '#5C5A55';

function generatePdf({ filePath, publicId, config, contact }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(filePath);
    stream.on('finish', resolve);
    stream.on('error', reject);
    doc.pipe(stream);

    // Header band
    doc.rect(0, 0, doc.page.width, 90).fill(INK);
    doc.fillColor(YELLOW).font('Helvetica-Bold').fontSize(20).text('GARAGE DOOR LIFT', 50, 32);
    doc.fillColor('#ffffff').font('Helvetica').fontSize(10).text('Custom Door Configuration — Quote Request', 50, 58);

    doc.moveDown(3);
    doc.fillColor(INK).font('Helvetica-Bold').fontSize(14).text(`Reference: ${publicId}`, 50, 110);
    doc.font('Helvetica').fontSize(9).fillColor(MUTED).text(`Generated ${new Date().toLocaleString()}`);

    let y = 150;
    const section = (title, rows) => {
      const visible = rows.filter(([, v]) => v);
      doc.moveTo(50, y).lineTo(545, y).strokeColor('#D8D5CC').stroke();
      y += 12;
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#8A7A3A').text(title, 50, y);
      y += 18;
      visible.forEach(([k, v]) => {
        doc.font('Helvetica').fontSize(10).fillColor(MUTED).text(k, 60, y, { continued: true, width: 200 });
        doc.font('Helvetica-Bold').fillColor(INK).text(String(v || '—'), { align: 'left' });
        y += 16;
      });
      y += 10;
    };

    // Model/Style/Windows are blank for product lines that don't have that step
    // (e.g. Aluminum Grille has no model/style/windows choice) — section() drops
    // any row with an empty value instead of printing a bare "—" line for it.
    section('Door Configuration', [
      ['Product Line', config.lineLabel],
      ['Size', config.sizeLabel],
      ['Door Style', config.modelLabel],
      ['Style', config.styleLabel],
      ['Color', config.colorLabel],
      [config.secondaryLabel || 'Windows', config.windowLabel],
      ['Quantity', contact.quantity]
    ]);

    section('Contact Information', [
      ['Name', contact.name],
      ['Phone', contact.phone],
      ['Email', contact.email],
      ['Address', contact.address],
      ['City', contact.city],
      ['State', contact.state],
      ['Country', contact.country],
      ['Postal Code', contact.postalCode]
    ]);

    doc.fontSize(8).fillColor(MUTED).text(
      'This document is a record of your online door configuration and is not a price quote or order confirmation. A member of our team will follow up with pricing and availability.',
      50, 740, { width: 495 }
    );

    doc.end();
  });
}

router.post('/quote', attachUserIfPresent, async (req, res) => {
  const body = req.body || {};
  const { config, contact } = body;

  if (!config || typeof config !== 'object') {
    return res.status(400).json({ error: 'Missing door configuration.' });
  }
  if (!contact || typeof contact !== 'object') {
    return res.status(400).json({ error: 'Missing contact information.' });
  }

  const name = contact.name && String(contact.name).trim();
  const phone = contact.phone && String(contact.phone).trim();
  const email = contact.email ? String(contact.email).trim() : '';
  const quantity = Number.parseInt(contact.quantity, 10);

  if (!name) return res.status(400).json({ error: 'Full name is required.' });
  if (!phone) return res.status(400).json({ error: 'Phone number is required.' });
  if (email && !EMAIL_RE.test(email)) return res.status(400).json({ error: 'That email address does not look valid.' });
  if (!Number.isInteger(quantity) || quantity < 1) return res.status(400).json({ error: 'Quantity must be at least 1.' });
  // Model/Style aren't universal — some lines (Grille, Overlay, Flush) skip one or
  // both of those steps entirely, so only Line/Size/Color are required across the
  // board.
  if (!config.lineLabel || !config.sizeLabel || !config.colorLabel) {
    return res.status(400).json({ error: 'Your door configuration is incomplete. Please complete every step.' });
  }

  const publicId = crypto.randomBytes(8).toString('hex');
  const pdfPath = path.join(PDF_DIR, `${publicId}.pdf`);
  const cleanContact = {
    quantity,
    name,
    phone,
    email,
    address: contact.address ? String(contact.address).trim() : '',
    city: contact.city ? String(contact.city).trim() : '',
    state: contact.state ? String(contact.state).trim() : '',
    country: contact.country ? String(contact.country).trim() : '',
    postalCode: contact.postalCode ? String(contact.postalCode).trim() : ''
  };

  try {
    await generatePdf({ filePath: pdfPath, publicId, config, contact: cleanContact });
  } catch (err) {
    console.error('[builder] PDF generation failed:', err);
    return res.status(500).json({ error: 'Could not generate your quote PDF. Please try again.' });
  }

  let info;
  try {
    const userId = req.user ? req.user.sub : null;
    info = db.prepare(`
      INSERT INTO builder_quotes
        (public_id, user_id, config_json, quantity, name, phone, email, address, city, state, country, postal_code, pdf_path)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      publicId, userId, JSON.stringify(config), cleanContact.quantity, cleanContact.name, cleanContact.phone,
      cleanContact.email || null, cleanContact.address || null, cleanContact.city || null,
      cleanContact.state || null, cleanContact.country || null, cleanContact.postalCode || null, pdfPath
    );
  } catch (err) {
    console.error('[builder] Database insert failed:', err);
    return res.status(500).json({ error: 'Something went wrong saving your request. Please try again.' });
  }

  sendQuoteEmail({ to: cleanContact.email, name: cleanContact.name, pdfPath, publicId }).catch((err) => {
    console.error('[builder] Email send failed (non-fatal):', err);
  });

  res.status(201).json({
    id: Number(info.lastInsertRowid),
    publicId,
    pdfUrl: `/api/builder/quote/${publicId}/pdf`
  });
});

router.get('/quote/:publicId/pdf', (req, res) => {
  const row = db.prepare('SELECT pdf_path, name FROM builder_quotes WHERE public_id = ?').get(req.params.publicId);
  if (!row) return res.status(404).json({ error: 'Quote not found.' });
  if (!fs.existsSync(row.pdf_path)) return res.status(404).json({ error: 'PDF file is no longer available.' });
  res.download(row.pdf_path, `garage-door-lift-quote-${req.params.publicId}.pdf`);
});

module.exports = router;
