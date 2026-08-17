const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { signToken, setSessionCookie, clearSessionCookie, requireAuth } = require('../auth-utils');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicUser(row) {
  return { id: row.id, name: row.name, email: row.email };
}

router.post('/signup', (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || !String(name).trim()) return res.status(400).json({ error: 'Name is required.' });
  if (!email || !EMAIL_RE.test(String(email).trim())) return res.status(400).json({ error: 'A valid email is required.' });
  if (!password || String(password).length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });

  const cleanEmail = String(email).trim().toLowerCase();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
  if (existing) return res.status(409).json({ error: 'An account with this email already exists.' });

  const passwordHash = bcrypt.hashSync(String(password), 10);
  const info = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
    .run(String(name).trim(), cleanEmail, passwordHash);

  const user = { id: Number(info.lastInsertRowid), name: String(name).trim(), email: cleanEmail };
  setSessionCookie(res, signToken(user));
  res.status(201).json({ user: publicUser(user) });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

  const cleanEmail = String(email).trim().toLowerCase();
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);
  if (!row || !bcrypt.compareSync(String(password), row.password_hash)) {
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }

  setSessionCookie(res, signToken(row));
  res.json({ user: publicUser(row) });
});

router.post('/logout', (req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  const row = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(req.user.sub);
  if (!row) return res.status(401).json({ error: 'Not signed in.' });
  res.json({ user: publicUser(row) });
});

module.exports = router;
