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

app.use(express.static(SITE_ROOT));

app.listen(PORT, () => {
  console.log(`Garage Door Lift server running at http://localhost:${PORT}`);
});
