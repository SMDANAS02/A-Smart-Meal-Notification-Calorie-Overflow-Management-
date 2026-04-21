// routes/profile.js — User Profile & Targets
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const auth    = require('../middleware/auth');

// ── Welcome WhatsApp message
async function sendWelcomeMessage(phone, name) {
  try {
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    const welcomeMessage = `Hey ${name}! Welcome to FitAI! 🔥

I am your personal fitness WhatsApp bot!

Here's what I can do:

📊 status — Today's calories & water
🍽️ log 2 idli — Log a meal
🔍 id — Search food (type partial name)
🔥 calories — Today's meal breakdown

💧 water 6 — Update water intake
⚖️ weight 74.5 — Log your weight
💪 motivate — Get motivated!
🍱 foods — See food list
❓ help — Show all commands

💡 Tip: Just type part of food name to search!
Example: Type "id" → suggests idli

Start your fitness journey now! 💪`;

    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to:   `whatsapp:${phone}`,
      body: welcomeMessage
    });
    console.log(`✅ Welcome message sent to ${phone}`);
  } catch (err) {
    console.log('⚠️ Welcome message failed:', err.message);
  }
}

// GET /api/profile
router.get('/', auth, (req, res) => {
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user.id);
  const user    = db.prepare('SELECT id, name, email, phone, created_at FROM users WHERE id = ?').get(req.user.id);
  res.json({ user, profile });
});

// PUT /api/profile — Save onboarding data / update targets
router.put('/', auth, (req, res) => {
  const {
    age, gender, height_cm, weight_kg, goal, activity_level,
    cal_target, protein_target, carbs_target, fat_target,
    water_target, meal_count, phone
  } = req.body;

  db.prepare(`
    UPDATE profiles SET
      age            = COALESCE(?, age),
      gender         = COALESCE(?, gender),
      height_cm      = COALESCE(?, height_cm),
      weight_kg      = COALESCE(?, weight_kg),
      goal           = COALESCE(?, goal),
      activity_level = COALESCE(?, activity_level),
      cal_target     = COALESCE(?, cal_target),
      protein_target = COALESCE(?, protein_target),
      carbs_target   = COALESCE(?, carbs_target),
      fat_target     = COALESCE(?, fat_target),
      water_target   = COALESCE(?, water_target),
      meal_count     = COALESCE(?, meal_count),
      updated_at     = datetime('now')
    WHERE user_id = ?
  `).run(
    age, gender, height_cm, weight_kg, goal, activity_level,
    cal_target, protein_target, carbs_target, fat_target,
    water_target, meal_count,
    req.user.id
  );

  // ── Phone update + Welcome message
  if (phone) {
    const existingUser = db.prepare('SELECT phone, name FROM users WHERE id = ?').get(req.user.id);
    const isNewPhone   = !existingUser.phone || existingUser.phone !== phone;
    db.prepare('UPDATE users SET phone = ? WHERE id = ?').run(phone, req.user.id);
    if (isNewPhone) {
      sendWelcomeMessage(phone, existingUser.name);
    }
  }

  const updated = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user.id);
  res.json({ message: 'Profile updated!', profile: updated });
});

module.exports = router;