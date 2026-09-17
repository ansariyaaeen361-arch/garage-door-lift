const express = require('express');
const db = require('../db');

const router = express.Router();

router.post('/', (req, res) => {
  const { name, phone, email, product, city, message, website } = req.body || {};

  // Honeypot: a hidden field real visitors never see or fill in, but bots that
  // blindly fill every form field do. Pretend success without actually saving
  // anything, so the bot doesn't learn to look for a different signal.
  if (website) return res.status(201).json({ id: 0 });

  if (!name || !String(name).trim()) return res.status(400).json({ error: 'Full name is required.' });
  if (!phone || !String(phone).trim()) return res.status(400).json({ error: 'Phone is required.' });

  const info = db.prepare(`
    INSERT INTO quotes (name, phone, email, product, city, message)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    String(name).trim(),
    String(phone).trim(),
    email ? String(email).trim() : null,
    product ? String(product).trim() : null,
    city ? String(city).trim() : null,
    message ? String(message).trim() : null
  );

  res.status(201).json({ id: Number(info.lastInsertRowid) });
});

module.exports = router;
