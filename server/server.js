const path = require('node:path');
const express = require('express');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth');
const quoteRoutes = require('./routes/quotes');
const builderRoutes = require('./routes/builder');

const app = express();
const PORT = process.env.PORT || 3000;
const SITE_ROOT = path.join(__dirname, '..');

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/builder', builderRoutes);

// Canonicalize: /page.html -> /page (redirect), so links/bookmarks settle on the clean URL.
app.use((req, res, next) => {
  if (req.path.endsWith('.html')) {
    const clean = req.path === '/index.html' ? '/' : req.path.slice(0, -'.html'.length);
    const query = req.url.slice(req.path.length);
    return res.redirect(301, clean + query);
  }
  next();
});

app.use(express.static(SITE_ROOT, { extensions: ['html'] }));

app.listen(PORT, () => {
  console.log(`Garage Door Lift server running at http://localhost:${PORT}`);
});
