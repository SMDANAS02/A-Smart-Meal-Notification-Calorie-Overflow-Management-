// server.js — FitAI Backend Entry Point
require('dotenv').config();

const path    = require('path');
const express = require('express');
const cors    = require('cors');
const app     = express();
const PORT    = process.env.PORT || 3000;
const whatsappRoutes = require('./routes/whatsapp');

// MIDDLEWARE
app.use(cors());
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'frontend')));

// ROUTES — routes folder-ல இருக்கற files
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/profile',    require('./routes/profile'));
app.use('/api/meals',      require('./routes/meals'));
app.use('/api/progress',   require('./routes/progress'));
app.use('/api/diet',       require('./routes/diet'));
app.use('/api/water',      require('./routes/water'));
app.use('/api/notify',     require('./routes/notify'));
app.use('/api/whatsapp',   express.urlencoded({ extended: false }), whatsappRoutes);
app.use('/api/auth',       require('./routes/google-auth'));

// Scheduler
require('./scheduler');

// HEALTH CHECK
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: '🔥 FitAI Backend is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ error: 'Internal server error.' });
});

// START
app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════╗
  ║   🔥 FitAI Backend Running!       ║
  ║   http://localhost:${PORT}           ║
  ╚═══════════════════════════════════╝
  `);
});