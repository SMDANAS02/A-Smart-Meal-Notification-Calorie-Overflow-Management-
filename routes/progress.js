// routes/progress.js — Weight & Measurements Tracking
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const auth    = require('../middleware/auth');

// GET /api/progress?limit=30
router.get('/', auth, (req, res) => {
  const limit = parseInt(req.query.limit) || 30;
  const rows = db.prepare(`
    SELECT * FROM progress WHERE user_id = ?
    ORDER BY date DESC LIMIT ?
  `).all(req.user.id, limit);
  res.json({ progress: rows.reverse() }); // oldest first for charts
});

// POST /api/progress — Log today's measurements
router.post('/', auth, (req, res) => {
  const { date, weight_kg, chest_cm, waist_cm, hips_cm, arms_cm, thighs_cm, note } = req.body;
  const logDate = date || new Date().toISOString().split('T')[0];

  // Upsert — one entry per day
  const existing = db.prepare(`
    SELECT id FROM progress WHERE user_id = ? AND date = ?
  `).get(req.user.id, logDate);

  if (existing) {
    db.prepare(`
      UPDATE progress SET
        weight_kg = COALESCE(?, weight_kg),
        chest_cm  = COALESCE(?, chest_cm),
        waist_cm  = COALESCE(?, waist_cm),
        hips_cm   = COALESCE(?, hips_cm),
        arms_cm   = COALESCE(?, arms_cm),
        thighs_cm = COALESCE(?, thighs_cm),
        note      = COALESCE(?, note)
      WHERE id = ?
    `).run(weight_kg, chest_cm, waist_cm, hips_cm, arms_cm, thighs_cm, note, existing.id);
  } else {
    db.prepare(`
      INSERT INTO progress (user_id, date, weight_kg, chest_cm, waist_cm, hips_cm, arms_cm, thighs_cm, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.user.id, logDate, weight_kg, chest_cm, waist_cm, hips_cm, arms_cm, thighs_cm, note);
  }

  const saved = db.prepare('SELECT * FROM progress WHERE user_id = ? AND date = ?').get(req.user.id, logDate);
  res.json({ message: 'Progress logged!', progress: saved });
});

// GET /api/progress/stats — Summary stats
router.get('/stats', auth, (req, res) => {
  const all = db.prepare(`
    SELECT * FROM progress WHERE user_id = ? ORDER BY date ASC
  `).all(req.user.id);

  if (all.length === 0) return res.json({ stats: null });

  const weights = all.filter(r => r.weight_kg).map(r => r.weight_kg);
  const first   = all[0];
  const last    = all[all.length - 1];

  res.json({
    stats: {
      totalEntries:  all.length,
      startWeight:   first.weight_kg,
      currentWeight: last.weight_kg,
      weightChange:  last.weight_kg && first.weight_kg
                       ? +(last.weight_kg - first.weight_kg).toFixed(1)
                       : null,
      minWeight: weights.length ? Math.min(...weights) : null,
      maxWeight: weights.length ? Math.max(...weights) : null,
      firstDate: first.date,
      lastDate:  last.date
    }
  });
});

module.exports = router;
