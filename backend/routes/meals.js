// routes/meals.js — Meal Logging + Daily Summary
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const auth    = require('../middleware/auth');
const twilio  = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const FROM   = process.env.TWILIO_WHATSAPP_FROM;

async function sendWhatsApp(to, message) {
  try {
    await client.messages.create({ from: FROM, to: `whatsapp:${to}`, body: message });
  } catch (err) {
    console.error('WhatsApp send error:', err);
  }
}

// ─────────────────────────────────────────
// GET /api/meals?date=YYYY-MM-DD
// Returns all meals for a day + daily summary
// ─────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const date = req.query.date || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    const meals = await db.prepare(`
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
      calories: acc.calories + (m.calories || 0),
      protein:  acc.protein  + (m.protein || 0),
      carbs:    acc.carbs    + (m.carbs || 0),
      fat:      acc.fat      + (m.fat || 0)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

    // Get adjusted target (applying calorie debt if any)
    const profile = await db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user.id);
    const adjustedTarget = await getAdjustedCalTarget(req.user.id, date, profile?.cal_target || 2000);

    res.json({ date, meals, grouped, totals, adjustedTarget, profile });
  } catch (err) {
    console.error('Fetch meals error:', err);
    res.status(500).json({ error: 'Failed to fetch meals' });
  }
});

// ─────────────────────────────────────────
// POST /api/meals — Add a food item
// ─────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  const { date, meal_name, food_name, calories, protein, carbs, fat, quantity, unit } = req.body;

  if (!meal_name || !food_name || calories === undefined)
    return res.status(400).json({ error: 'meal_name, food_name, and calories are required.' });

  try {
    const mealDate = date || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    const result = await db.prepare(`
      INSERT INTO meals (user_id, date, meal_name, food_name, calories, protein, carbs, fat, quantity, unit)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id, mealDate, meal_name, food_name,
      calories, protein || 0, carbs || 0, fat || 0,
      quantity || 1, unit || 'serving'
    );

    const inserted = await db.prepare('SELECT * FROM meals WHERE id = ?').get(result.lastInsertRowid);

    // Calculate updated totals for the day
    const meals = await db.prepare(`
      SELECT * FROM meals WHERE user_id = ? AND date = ? ORDER BY created_at ASC
    `).all(req.user.id, mealDate);

    const totals = meals.reduce((acc, m) => ({
      calories: acc.calories + (m.calories || 0),
      protein:  acc.protein  + (m.protein || 0),
      carbs:    acc.carbs    + (m.carbs || 0),
      fat:      acc.fat      + (m.fat || 0)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

    // Get adjusted target
    const profile = await db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user.id);
    const adjustedTarget = await getAdjustedCalTarget(req.user.id, mealDate, profile?.cal_target || 2000);

    const remaining = adjustedTarget - totals.calories;
    const overflow = totals.calories > adjustedTarget ? totals.calories - adjustedTarget : 0;

    let message = 'Food added!';
    if (overflow > 0) {
      message += ` ⚠️ You've exceeded your target by ${overflow} kcal today.`;
      // Send WhatsApp notification
      const user = await db.prepare('SELECT phone FROM users WHERE id = ?').get(req.user.id);
      if (user?.phone) {
        sendWhatsApp(user.phone, `⚠️ Calorie Overflow Alert!\n\nYou added ${food_name} (${calories} kcal) and exceeded your daily target by ${overflow} kcal.\n\nTotal today: ${totals.calories}/${adjustedTarget} kcal\n\nStay disciplined! 💪`);
      }
    } else {
      message += ` ✅ ${remaining} kcal remaining for today.`;
    }

    res.status(201).json({
      message,
      meal: inserted,
      totals,
      adjustedTarget,
      remaining,
      overflow
    });
  } catch (err) {
    console.error('Add meal error:', err);
    res.status(500).json({ error: 'Failed to add meal' });
  }
});

// ─────────────────────────────────────────
// DELETE /api/meals/:id — Remove a food item
// ─────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const meal = await db.prepare('SELECT * FROM meals WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!meal) return res.status(404).json({ error: 'Meal not found.' });

    await db.prepare('DELETE FROM meals WHERE id = ?').run(req.params.id);
    res.json({ message: 'Food removed!' });
  } catch (err) {
    console.error('Delete meal error:', err);
    res.status(500).json({ error: 'Failed to delete meal' });
  }
});

// ─────────────────────────────────────────
// POST /api/meals/close-day — Called at end of day
// Calculates overflow and creates calorie debt
// ─────────────────────────────────────────
router.post('/close-day', auth, async (req, res) => {
  try {
    const date = req.body.date || new Date().toISOString().split('T')[0];
    const profile = await db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user.id);
    const calTarget = profile?.cal_target || 2000;

    // Total calories eaten today
    const row = await db.prepare(`
      SELECT SUM(calories) as total FROM meals WHERE user_id = ? AND date = ?
    `).get(req.user.id, date);
    const total = row?.total || 0;

    const over = Math.round(total - calTarget);

    if (over <= 0) {
      // Under or at target — clear any existing debt for today
      await db.prepare(`
        UPDATE calorie_debt SET cleared = 1 WHERE user_id = ? AND debt_date = ?
      `).run(req.user.id, date);
      return res.json({ message: 'Great job! You stayed within your calorie target.', over: 0 });
    }

    // Over target — create debt
    const splitDays = over > 300 ? 3 : 2;
    const perDay = Math.round(over / splitDays);

    // Upsert debt for today
    const existing = await db.prepare(`
      SELECT id FROM calorie_debt WHERE user_id = ? AND debt_date = ? AND cleared = 0
    `).get(req.user.id, date);

    if (existing) {
      await db.prepare(`
        UPDATE calorie_debt SET over_cal = ?, split_days = ?, per_day = ? WHERE id = ?
      `).run(over, splitDays, perDay, existing.id);
    } else {
      await db.prepare(`
        INSERT INTO calorie_debt (user_id, debt_date, over_cal, split_days, per_day)
        VALUES (?, ?, ?, ?, ?)
      `).run(req.user.id, date, over, splitDays, perDay);
    }

    res.json({
      message: `You went over by ${over} kcal. Deducting ${perDay} kcal/day for ${splitDays} days.`,
      over, splitDays, perDay
    });
  } catch (err) {
    console.error('Close day error:', err);
    res.status(500).json({ error: 'Failed to close day' });
  }
});

// ─────────────────────────────────────────
// Helper: Get adjusted calorie target for a date
// Deducts per_day from active debts
// ─────────────────────────────────────────
async function getAdjustedCalTarget(userId, date, baseTarget) {
  try {
    const debts = await db.prepare(`
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
        await db.prepare('UPDATE calorie_debt SET cleared = 1 WHERE id = ?').run(debt.id);
      }
    }

    return Math.max(1200, baseTarget - deduction);
  } catch (err) {
    console.error('getAdjustedCalTarget error:', err);
    return baseTarget;
  }
}

module.exports = router;
