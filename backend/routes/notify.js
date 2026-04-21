// routes/notify.js — Email Notifications via Nodemailer
const express    = require('express');
const router     = express.Router();
const nodemailer = require('nodemailer');
const db         = require('../db');
const auth       = require('../middleware/auth');

// Create transporter (Gmail)
function getTransporter() {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS   // Use Gmail App Password!
    }
  });
}

// ─────────────────────────────────────────
// POST /api/notify/meal-reminder
// Send meal reminder email
// ─────────────────────────────────────────
router.post('/meal-reminder', auth, async (req, res) => {
  const { meal_name, meal_time } = req.body;

  const user    = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user.id);
  const date    = new Date().toISOString().split('T')[0];

  // Get today's meal totals
  const mealItems = db.prepare(`
    SELECT * FROM meals WHERE user_id = ? AND date = ? AND meal_name = ?
  `).all(req.user.id, date, meal_name);

  const consumed = mealItems.reduce((s, m) => s + m.calories, 0);
  const target   = Math.round((profile?.cal_target || 2000) / (profile?.meal_count || 3));
  const remaining = Math.max(0, target - consumed);

  try {
    const transporter = getTransporter();

    await transporter.sendMail({
      from:    `"FitAI 🔥" <${process.env.EMAIL_USER}>`,
      to:      user.email,
      subject: `⏰ Time for ${meal_name}! — FitAI`,
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:auto;background:#0e0e0e;color:#fff;border-radius:12px;overflow:hidden;">
          <div style="background:#E8000D;padding:20px;text-align:center;">
            <h1 style="margin:0;font-size:28px;letter-spacing:2px;">FITAI</h1>
            <p style="margin:4px 0 0;opacity:0.85;">Meal Reminder</p>
          </div>
          <div style="padding:24px;">
            <h2 style="color:#E8000D;">Hey ${user.name}! 👋</h2>
            <p style="font-size:16px;">It's time for your <strong>${meal_name}</strong>!</p>
            <div style="background:#1c1c1c;border-radius:8px;padding:16px;margin:16px 0;">
              <p style="margin:4px 0;">🕐 <strong>Time:</strong> ${meal_time}</p>
              <p style="margin:4px 0;">🍽 <strong>Meal:</strong> ${meal_name}</p>
              <p style="margin:4px 0;">🔥 <strong>Consumed:</strong> ${consumed} kcal</p>
              <p style="margin:4px 0;">🎯 <strong>Target:</strong> ${target} kcal</p>
              <p style="margin:4px 0;">⚡ <strong>Remaining:</strong> ${remaining} kcal</p>
            </div>
            <p style="color:#999;font-size:12px;text-align:center;margin-top:24px;">
              FitAI: IRONPULSE AI — Fuel Your Goals 💪
            </p>
          </div>
        </div>
      `
    });

    res.json({ message: 'Reminder email sent!' });
  } catch (err) {
    console.error('Email error:', err.message);
    res.status(500).json({ error: 'Failed to send email. Check your EMAIL_USER and EMAIL_PASS in .env' });
  }
});

// ─────────────────────────────────────────
// POST /api/notify/daily-summary
// Send end-of-day summary email
// ─────────────────────────────────────────
router.post('/daily-summary', auth, async (req, res) => {
  const user    = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user.id);
  const date    = req.body.date || new Date().toISOString().split('T')[0];

  const meals = db.prepare(`
    SELECT * FROM meals WHERE user_id = ? AND date = ?
  `).all(req.user.id, date);

  const totals = meals.reduce((a, m) => ({
    cal: a.cal + m.calories, protein: a.protein + m.protein,
    carbs: a.carbs + m.carbs, fat: a.fat + m.fat
  }), { cal: 0, protein: 0, carbs: 0, fat: 0 });

  const target = profile?.cal_target || 2000;
  const over   = Math.round(totals.cal - target);
  const overMsg = over > 0
    ? `⚠️ You went over by <strong style="color:#E8000D;">${over} kcal</strong>. It will be deducted over the next ${over > 300 ? 3 : 2} days.`
    : `✅ Great job! You were <strong style="color:#4CAF50;">${Math.abs(over)} kcal</strong> under target.`;

  try {
    const transporter = getTransporter();

    await transporter.sendMail({
      from:    `"FitAI 🔥" <${process.env.EMAIL_USER}>`,
      to:      user.email,
      subject: `📊 Your Daily Summary — ${date}`,
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:auto;background:#0e0e0e;color:#fff;border-radius:12px;overflow:hidden;">
          <div style="background:#E8000D;padding:20px;text-align:center;">
            <h1 style="margin:0;font-size:28px;letter-spacing:2px;">FITAI</h1>
            <p style="margin:4px 0 0;opacity:0.85;">Daily Summary — ${date}</p>
          </div>
          <div style="padding:24px;">
            <h2>Hey ${user.name}! Here's your day:</h2>
            <div style="background:#1c1c1c;border-radius:8px;padding:16px;margin:16px 0;">
              <p style="margin:4px 0;">🔥 <strong>Calories:</strong> ${Math.round(totals.cal)} / ${target} kcal</p>
              <p style="margin:4px 0;">💪 <strong>Protein:</strong> ${Math.round(totals.protein)}g</p>
              <p style="margin:4px 0;">🍚 <strong>Carbs:</strong> ${Math.round(totals.carbs)}g</p>
              <p style="margin:4px 0;">🥑 <strong>Fat:</strong> ${Math.round(totals.fat)}g</p>
            </div>
            <p style="font-size:15px;">${overMsg}</p>
            <p style="color:#999;font-size:12px;text-align:center;margin-top:24px;">
              FitAI: IRONPULSE AI — Fuel Your Goals 💪
            </p>
          </div>
        </div>
      `
    });

    res.json({ message: 'Daily summary sent!' });
  } catch (err) {
    console.error('Email error:', err.message);
    res.status(500).json({ error: 'Failed to send email.' });
  }
});

module.exports = router;
