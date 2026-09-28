const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const db = require('../db');

const router = express.Router();

// A stopgap way for the Garage Door Lift team to see quote submissions until
// real email notifications are wired up (needs SMTP/API credentials we don't
// have yet — see server/mailer.js). This is NOT a customer-facing login
// system (that was intentionally removed) — just one unlisted URL, protected
// by a random key generated once and stored on the server, that the team
// bookmarks. Never linked from any public page.
const KEY_PATH = path.join(__dirname, '..', 'data', 'admin-key.txt');
function loadOrCreateKey() {
  if (fs.existsSync(KEY_PATH)) return fs.readFileSync(KEY_PATH, 'utf8').trim();
  const key = crypto.randomBytes(24).toString('hex');
  fs.mkdirSync(path.dirname(KEY_PATH), { recursive: true });
  fs.writeFileSync(KEY_PATH, key, { mode: 0o600 });
  return key;
}
const ADMIN_KEY = loadOrCreateKey();

function escapeHtml(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

router.get('/quotes', (req, res) => {
  if (req.query.key !== ADMIN_KEY) return res.status(404).send('Not found');

  const contactQuotes = db.prepare('SELECT * FROM quotes ORDER BY created_at DESC LIMIT 100').all();
  const builderQuotes = db.prepare('SELECT * FROM builder_quotes ORDER BY created_at DESC LIMIT 100').all();

  const row = (cells) => `<tr>${cells.map((c) => `<td style="padding:8px 12px;border-bottom:1px solid #333;vertical-align:top;">${c}</td>`).join('')}</tr>`;

  const contactRows = contactQuotes.map((q) => row([
    escapeHtml(q.created_at), escapeHtml(q.name), escapeHtml(q.phone), escapeHtml(q.email || '—'),
    escapeHtml(q.product || '—'), escapeHtml(q.city || '—'), escapeHtml(q.message || '—')
  ])).join('');

  const builderRows = builderQuotes.map((q) => {
    let cfg = {};
    try { cfg = JSON.parse(q.config_json); } catch { /* ignore */ }
    const cfgSummary = [cfg.lineLabel, cfg.sizeLabel, cfg.modelLabel, cfg.styleLabel, cfg.colorLabel, cfg.windowLabel]
      .filter(Boolean).join(' · ');
    return row([
      escapeHtml(q.created_at), escapeHtml(q.name), escapeHtml(q.phone), escapeHtml(q.email || '—'),
      escapeHtml(cfgSummary), escapeHtml(q.quantity),
      `<a href="/api/builder/quote/${escapeHtml(q.public_id)}/pdf" style="color:#FEC400;">PDF</a>`
    ]);
  }).join('');

  res.send(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Quote Submissions</title>
<style>
  body{font-family:system-ui,sans-serif;background:#0B0B0B;color:#F5F3EE;padding:24px;}
  h1{font-size:20px;} h2{font-size:16px;margin-top:40px;color:#FEC400;}
  table{border-collapse:collapse;width:100%;font-size:13px;}
  th{text-align:left;padding:8px 12px;border-bottom:2px solid #FEC400;color:#FEC400;}
  .muted{color:#8A8A8A;font-size:13px;}
</style></head><body>
  <h1>Garage Door Lift — Quote Submissions</h1>
  <p class="muted">Stopgap viewer — no email notifications are configured yet. Bookmark this exact URL (it includes your access key) rather than sharing it.</p>

  <h2>Contact form requests (${contactQuotes.length})</h2>
  <table><tr><th>Date</th><th>Name</th><th>Phone</th><th>Email</th><th>Product</th><th>City</th><th>Message</th></tr>${contactRows || '<tr><td colspan="7" class="muted" style="padding:8px 12px;">None yet.</td></tr>'}</table>

  <h2>Door Builder requests (${builderQuotes.length})</h2>
  <table><tr><th>Date</th><th>Name</th><th>Phone</th><th>Email</th><th>Configuration</th><th>Qty</th><th>PDF</th></tr>${builderRows || '<tr><td colspan="7" class="muted" style="padding:8px 12px;">None yet.</td></tr>'}</table>
</body></html>`);
});

module.exports = router;
