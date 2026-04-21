// routes/diet.js — Diet Plan Storage
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const auth    = require('../middleware/auth');

// GET /api/diet
router.get('/', auth, (req, res) => {
  const plan = db.prepare('SELECT * FROM diet_plans WHERE user_id = ?').get(req.user.id);
  if (!plan) return res.json({ plan: null });
  res.json({ plan: { ...plan, plan_data: JSON.parse(plan.plan_data) } });
});

// POST /api/diet — Save or update diet plan
router.post('/', auth, (req, res) => {
  const { plan_data } = req.body;
  if (!plan_data) return res.status(400).json({ error: 'plan_data is required.' });

  const json = JSON.stringify(plan_data);
  const existing = db.prepare('SELECT id FROM diet_plans WHERE user_id = ?').get(req.user.id);

  if (existing) {
    db.prepare(`
      UPDATE diet_plans SET plan_data = ?, generated_at = datetime('now') WHERE user_id = ?
    `).run(json, req.user.id);
  } else {
    db.prepare(`
      INSERT INTO diet_plans (user_id, plan_data) VALUES (?, ?)
    `).run(req.user.id, json);
  }

  res.json({ message: 'Diet plan saved!' });
});

module.exports = router;
