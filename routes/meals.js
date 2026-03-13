// routes/meals.js — Meal Logging + Daily Summary
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const auth    = require('../middleware/auth');

// ─────────────────────────────────────────
// GET /api/meals?date=YYYY-MM-DD
// Returns all meals for a day + daily summary
// ─────────────────────────────────────────
router.get('/', auth, (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];

  const meals = db.prepare(`
    SELECT * FROM meals WHERE user_id = ? AND date = ? ORDER BY created_at ASC
  `).all(req.user.id, date);

  // Group by meal_name
  const grouped = {};
  meals.forEach(m => {
    if (!grouped[m.meal_name]) grouped[m.meal_name] = [];
    grouped[m.meal_name].push(m);
  });

  // Daily totals
  const totals = meals.reduce((acc, m) => ({
    calories: acc.calories + m.calories,
    protein:  acc.protein  + m.protein,
    carbs:    acc.carbs    + m.carbs,
    fat:      acc.fat      + m.fat
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  // Get adjusted target (applying calorie debt if any)
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user.id);
  const adjustedTarget = getAdjustedCalTarget(req.user.id, date, profile?.cal_target || 2000);

  res.json({ date, meals, grouped, totals, adjustedTarget, profile });
});

// ─────────────────────────────────────────
// POST /api/meals — Add a food item
// ─────────────────────────────────────────
router.post('/', auth, (req, res) => {
  const { date, meal_name, food_name, calories, protein, carbs, fat, quantity, unit } = req.body;

  if (!meal_name || !food_name || calories === undefined)
    return res.status(400).json({ error: 'meal_name, food_name, and calories are required.' });

  const mealDate = date || new Date().toISOString().split('T')[0];

  const result = db.prepare(`
    INSERT INTO meals (user_id, date, meal_name, food_name, calories, protein, carbs, fat, quantity, unit)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.user.id, mealDate, meal_name, food_name,
    calories, protein || 0, carbs || 0, fat || 0,
    quantity || 1, unit || 'serving'
  );

  const inserted = db.prepare('SELECT * FROM meals WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ message: 'Food added!', meal: inserted });
});

// ─────────────────────────────────────────
// DELETE /api/meals/:id — Remove a food item
// ─────────────────────────────────────────
router.delete('/:id', auth, (req, res) => {
  const meal = db.prepare('SELECT * FROM meals WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!meal) return res.status(404).json({ error: 'Meal not found.' });

  db.prepare('DELETE FROM meals WHERE id = ?').run(req.params.id);
  res.json({ message: 'Food removed!' });
});

// ─────────────────────────────────────────
// POST /api/meals/close-day — Called at end of day
// Calculates overflow and creates calorie debt
// ─────────────────────────────────────────
router.post('/close-day', auth, (req, res) => {
  const date = req.body.date || new Date().toISOString().split('T')[0];
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user.id);
  const calTarget = profile?.cal_target || 2000;

  // Total calories eaten today
  const row = db.prepare(`
    SELECT SUM(calories) as total FROM meals WHERE user_id = ? AND date = ?
  `).get(req.user.id, date);
  const total = row?.total || 0;

  const over = Math.round(total - calTarget);

  if (over <= 0) {
    // Under or at target — clear any existing debt for today
    db.prepare(`
      UPDATE calorie_debt SET cleared = 1 WHERE user_id = ? AND debt_date = ?
    `).run(req.user.id, date);
    return res.json({ message: 'Great job! You stayed within your calorie target.', over: 0 });
  }

  // Over target — create debt
  const splitDays = over > 300 ? 3 : 2;
  const perDay = Math.round(over / splitDays);

  // Upsert debt for today
  const existing = db.prepare(`
    SELECT id FROM calorie_debt WHERE user_id = ? AND debt_date = ? AND cleared = 0
  `).get(req.user.id, date);

  if (existing) {
    db.prepare(`
      UPDATE calorie_debt SET over_cal = ?, split_days = ?, per_day = ? WHERE id = ?
    `).run(over, splitDays, perDay, existing.id);
  } else {
    db.prepare(`
      INSERT INTO calorie_debt (user_id, debt_date, over_cal, split_days, per_day)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.user.id, date, over, splitDays, perDay);
  }

  res.json({
    message: `You went over by ${over} kcal. Deducting ${perDay} kcal/day for ${splitDays} days.`,
    over, splitDays, perDay
  });
});

// ─────────────────────────────────────────
// Helper: Get adjusted calorie target for a date
// Deducts per_day from active debts
// ─────────────────────────────────────────
function getAdjustedCalTarget(userId, date, baseTarget) {
  const debts = db.prepare(`
    SELECT * FROM calorie_debt
    WHERE user_id = ? AND cleared = 0 AND debt_date < ?
    ORDER BY debt_date ASC
  `).all(userId, date);

  let deduction = 0;
  for (const debt of debts) {
    const debtDate  = new Date(debt.debt_date);
    const checkDate = new Date(date);
    const diffDays  = Math.floor((checkDate - debtDate) / (1000 * 60 * 60 * 24));

    if (diffDays >= 1 && diffDays <= debt.split_days) {
      deduction += debt.per_day;
    }

    // Auto-clear expired debts
    if (diffDays > debt.split_days) {
      db.prepare('UPDATE calorie_debt SET cleared = 1 WHERE id = ?').run(debt.id);
    }
  }

  return Math.max(1200, baseTarget - deduction);
}

module.exports = router;
