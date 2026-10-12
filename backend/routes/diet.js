// routes/diet.js — Diet Plan Storage
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const auth    = require('../middleware/auth');

// GET /api/diet
router.get('/', auth, async (req, res) => {
  try {
    const plan = await db.prepare('SELECT * FROM diet_plans WHERE user_id = ?').get(req.user.id);
    if (!plan) return res.json({ plan: null });
    res.json({ plan: { ...plan, plan_data: typeof plan.plan_data === 'string' ? JSON.parse(plan.plan_data) : plan.plan_data } });
  } catch (err) {
    console.error('Fetch diet error:', err);
    res.status(500).json({ error: 'Failed to fetch diet plan' });
  }
});

// POST /api/diet — Save or update diet plan
router.post('/', auth, async (req, res) => {
  const { plan_data } = req.body;
  if (!plan_data) return res.status(400).json({ error: 'plan_data is required.' });

  try {
    const json = typeof plan_data === 'string' ? plan_data : JSON.stringify(plan_data);
    const existing = await db.prepare('SELECT id FROM diet_plans WHERE user_id = ?').get(req.user.id);

    if (existing) {
      await db.prepare(`
        UPDATE diet_plans SET plan_data = ?, generated_at = datetime('now') WHERE user_id = ?
      `).run(json, req.user.id);
    } else {
      await db.prepare(`
        INSERT INTO diet_plans (user_id, plan_data) VALUES (?, ?)
      `).run(req.user.id, json);
    }

    res.json({ message: 'Diet plan saved!' });
  } catch (err) {
    console.error('Save diet error:', err);
    res.status(500).json({ error: 'Failed to save diet plan' });
  }
});

module.exports = router;
