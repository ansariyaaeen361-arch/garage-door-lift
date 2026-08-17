const express = require('express');
const db = require('../db');
const { requireAuth, attachUserIfPresent } = require('../auth-utils');

const router = express.Router();

// Anyone can submit a quote request; if they're signed in, it's linked to their account.
router.post('/', attachUserIfPresent, (req, res) => {
  const { name, phone, email, product, city, message } = req.body || {};

  if (!name || !String(name).trim()) return res.status(400).json({ error: 'Full name is required.' });
  if (!phone || !String(phone).trim()) return res.status(400).json({ error: 'Phone is required.' });

  const userId = req.user ? req.user.sub : null;
  const info = db.prepare(`
    INSERT INTO quotes (user_id, name, phone, email, product, city, message)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId,
    String(name).trim(),
    String(phone).trim(),
    email ? String(email).trim() : null,
    product ? String(product).trim() : null,
    city ? String(city).trim() : null,
    message ? String(message).trim() : null
  );

  res.status(201).json({ id: Number(info.lastInsertRowid) });
});

// Signed-in users only: their own quote history.
router.get('/mine', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT id, name, phone, email, product, city, message, created_at
    FROM quotes WHERE user_id = ? ORDER BY created_at DESC
  `).all(req.user.sub);
  res.json({ quotes: rows });
});

module.exports = router;
