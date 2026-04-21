// routes/water.js — Daily Water Intake
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const auth    = require('../middleware/auth');

// GET /api/water?date=YYYY-MM-DD
router.get('/', auth, (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const log  = db.prepare('SELECT * FROM water_log WHERE user_id = ? AND date = ?').get(req.user.id, date);
  res.json({ date, glasses: log?.glasses || 0 });
});

// POST /api/water — Set glasses count
router.post('/', auth, (req, res) => {
  const { date, glasses } = req.body;
  const logDate = date || new Date().toISOString().split('T')[0];

  const existing = db.prepare('SELECT id FROM water_log WHERE user_id = ? AND date = ?').get(req.user.id, logDate);
  if (existing) {
    db.prepare('UPDATE water_log SET glasses = ?, updated_at = datetime("now") WHERE id = ?').run(glasses, existing.id);
  } else {
    db.prepare('INSERT INTO water_log (user_id, date, glasses) VALUES (?, ?, ?)').run(req.user.id, logDate, glasses);
  }

  res.json({ message: 'Water updated!', date: logDate, glasses });
});

module.exports = router;
