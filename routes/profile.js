// routes/profile.js — User Profile & Targets
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const auth    = require('../middleware/auth');

// GET /api/profile
router.get('/', auth, (req, res) => {
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user.id);
  const user    = db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?').get(req.user.id);
  res.json({ user, profile });
});

// PUT /api/profile — Save onboarding data / update targets
router.put('/', auth, (req, res) => {
  const {
    age, gender, height_cm, weight_kg, goal, activity_level,
    cal_target, protein_target, carbs_target, fat_target,
    water_target, meal_count
  } = req.body;

  db.prepare(`
    UPDATE profiles SET
      age = COALESCE(?, age),
      gender = COALESCE(?, gender),
      height_cm = COALESCE(?, height_cm),
      weight_kg = COALESCE(?, weight_kg),
      goal = COALESCE(?, goal),
      activity_level = COALESCE(?, activity_level),
      cal_target = COALESCE(?, cal_target),
      protein_target = COALESCE(?, protein_target),
      carbs_target = COALESCE(?, carbs_target),
      fat_target = COALESCE(?, fat_target),
      water_target = COALESCE(?, water_target),
      meal_count = COALESCE(?, meal_count),
      updated_at = datetime('now')
    WHERE user_id = ?
  `).run(
    age, gender, height_cm, weight_kg, goal, activity_level,
    cal_target, protein_target, carbs_target, fat_target,
    water_target, meal_count,
    req.user.id
  );

  const updated = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user.id);
  res.json({ message: 'Profile updated!', profile: updated });
});

module.exports = router;
