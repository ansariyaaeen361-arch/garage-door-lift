const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');

const SECRET_PATH = path.join(__dirname, 'data', 'jwt-secret.txt');

function loadOrCreateSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (fs.existsSync(SECRET_PATH)) return fs.readFileSync(SECRET_PATH, 'utf8').trim();
  const secret = crypto.randomBytes(48).toString('hex');
  fs.mkdirSync(path.dirname(SECRET_PATH), { recursive: true });
  fs.writeFileSync(SECRET_PATH, secret, { mode: 0o600 });
  return secret;
}

const JWT_SECRET = loadOrCreateSecret();
const COOKIE_NAME = 'gdl_session';
const TOKEN_TTL = '30d';

function signToken(user) {
  return jwt.sign({ sub: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function setSessionCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
}

function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME);
}

function requireAuth(req, res, next) {
  const token = req.cookies[COOKIE_NAME];
  const payload = token && verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Not signed in.' });
  req.user = payload;
  next();
}

// Attaches req.user if a valid session cookie is present, but doesn't reject the request otherwise.
function attachUserIfPresent(req, _res, next) {
  const token = req.cookies[COOKIE_NAME];
  const payload = token && verifyToken(token);
  if (payload) req.user = payload;
  next();
}

module.exports = {
  COOKIE_NAME,
  signToken,
  verifyToken,
  setSessionCookie,
  clearSessionCookie,
  requireAuth,
  attachUserIfPresent
};
