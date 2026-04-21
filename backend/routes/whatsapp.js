// routes/whatsapp.js — FitAI WhatsApp Bot (Smart Food Search)
const express = require('express');
const router  = express.Router();
const twilio  = require('twilio');
const db = require('../db');

const BOT_NAME = 'FitAI';
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const FROM   = process.env.TWILIO_WHATSAPP_FROM;

async function sendWhatsApp(to, message) {
  return client.messages.create({ from: FROM, to: `whatsapp:${to}`, body: message });
}

// ── FOOD DATABASE
const FOOD_DB = {
  'idli':          { cal: 39,  p: 2,  c: 8,  f: 0.2, unit: 'piece' },
  'dosa':          { cal: 120, p: 3,  c: 20, f: 3,   unit: 'piece' },
  'sambar':        { cal: 50,  p: 3,  c: 8,  f: 1,   unit: '100ml' },
  'chutney':       { cal: 45,  p: 1,  c: 5,  f: 2,   unit: 'tbsp' },
  'vada':          { cal: 97,  p: 3,  c: 12, f: 4,   unit: 'piece' },
  'upma':          { cal: 150, p: 4,  c: 25, f: 4,   unit: 'cup' },
  'pongal':        { cal: 180, p: 5,  c: 30, f: 5,   unit: 'cup' },
  'rasam':         { cal: 30,  p: 1,  c: 5,  f: 0.5, unit: '100ml' },
  'rice':          { cal: 130, p: 3,  c: 28, f: 0.3, unit: 'cup' },
  'biryani':       { cal: 290, p: 12, c: 40, f: 8,   unit: 'cup' },
  'parotta':       { cal: 260, p: 5,  c: 38, f: 10,  unit: 'piece' },
  'chapati':       { cal: 70,  p: 3,  c: 13, f: 1,   unit: 'piece' },
  'roti':          { cal: 70,  p: 3,  c: 13, f: 1,   unit: 'piece' },
  'naan':          { cal: 262, p: 9,  c: 45, f: 5,   unit: 'piece' },
  'egg':           { cal: 78,  p: 6,  c: 0.6,f: 5,   unit: 'piece' },
  'chicken':       { cal: 165, p: 31, c: 0,  f: 4,   unit: '100g' },
  'fish':          { cal: 140, p: 25, c: 0,  f: 4,   unit: '100g' },
  'paneer':        { cal: 265, p: 18, c: 3,  f: 20,  unit: '100g' },
  'dal':           { cal: 115, p: 9,  c: 20, f: 1,   unit: 'cup' },
  'rajma':         { cal: 127, p: 9,  c: 22, f: 0.5, unit: 'cup' },
  'banana':        { cal: 89,  p: 1,  c: 23, f: 0.3, unit: 'piece' },
  'apple':         { cal: 52,  p: 0.3,c: 14, f: 0.2, unit: 'piece' },
  'mango':         { cal: 60,  p: 0.8,c: 15, f: 0.4, unit: '100g' },
  'orange':        { cal: 47,  p: 0.9,c: 12, f: 0.1, unit: 'piece' },
  'milk':          { cal: 42,  p: 3.4,c: 5,  f: 1,   unit: '100ml' },
  'tea':           { cal: 30,  p: 0.5,c: 3,  f: 1.5, unit: 'cup' },
  'coffee':        { cal: 35,  p: 0.5,c: 3,  f: 2,   unit: 'cup' },
  'juice':         { cal: 45,  p: 0.5,c: 11, f: 0.2, unit: '100ml' },
  'biscuit':       { cal: 50,  p: 0.7,c: 7,  f: 2,   unit: 'piece' },
  'bread':         { cal: 79,  p: 3,  c: 15, f: 1,   unit: 'slice' },
  'oats':          { cal: 150, p: 5,  c: 27, f: 3,   unit: 'cup' },
  'poha':          { cal: 158, p: 3,  c: 32, f: 2,   unit: 'cup' },
  'sandwich':      { cal: 250, p: 10, c: 35, f: 8,   unit: 'piece' },
  'burger':        { cal: 295, p: 15, c: 35, f: 10,  unit: 'piece' },
  'pizza':         { cal: 266, p: 11, c: 33, f: 10,  unit: 'slice' },
  'salad':         { cal: 80,  p: 3,  c: 10, f: 3,   unit: 'bowl' },
  'curd':          { cal: 60,  p: 3.5,c: 5,  f: 3,   unit: '100g' },
  'yogurt':        { cal: 60,  p: 3.5,c: 5,  f: 3,   unit: '100g' },
  'butter':        { cal: 102, p: 0.1,c: 0,  f: 11,  unit: 'tbsp' },
  'ghee':          { cal: 112, p: 0,  c: 0,  f: 12.5,unit: 'tbsp' },
  'sugar':         { cal: 48,  p: 0,  c: 12, f: 0,   unit: 'tsp' },
  'chocolate':     { cal: 155, p: 2,  c: 17, f: 9,   unit: '30g' },
  'corn':          { cal: 86,  p: 3,  c: 19, f: 1,   unit: '100g' },
  'potato':        { cal: 77,  p: 2,  c: 17, f: 0.1, unit: '100g' },
  'tomato':        { cal: 18,  p: 0.9,c: 4,  f: 0.2, unit: '100g' },
  'onion':         { cal: 40,  p: 1,  c: 9,  f: 0.1, unit: '100g' },
  'pasta':         { cal: 158, p: 6,  c: 31, f: 1,   unit: 'cup' },
  'noodles':       { cal: 138, p: 4,  c: 25, f: 2,   unit: 'cup' },
  'soup':          { cal: 70,  p: 3,  c: 10, f: 2,   unit: 'bowl' },
  'fried rice':    { cal: 250, p: 8,  c: 40, f: 7,   unit: 'cup' },
  'puri':          { cal: 110, p: 2,  c: 14, f: 5,   unit: 'piece' },
  'halwa':         { cal: 200, p: 3,  c: 30, f: 8,   unit: '100g' },
  'ladoo':         { cal: 175, p: 3,  c: 25, f: 7,   unit: 'piece' },
  'payasam':       { cal: 180, p: 4,  c: 30, f: 5,   unit: 'cup' },
  'watermelon':    { cal: 30,  p: 0.6,c: 8,  f: 0.2, unit: '100g' },
  'grapes':        { cal: 69,  p: 0.7,c: 18, f: 0.2, unit: '100g' },
  'almonds':       { cal: 164, p: 6,  c: 6,  f: 14,  unit: '28g' },
  'peanuts':       { cal: 161, p: 7,  c: 5,  f: 14,  unit: '28g' },
  'protein shake': { cal: 130, p: 25, c: 5,  f: 2,   unit: 'scoop' },
  'whey protein':  { cal: 130, p: 25, c: 5,  f: 2,   unit: 'scoop' },
};

function searchFoods(query) {
  const q = query.toLowerCase().trim();
  return Object.keys(FOOD_DB).filter(food =>
    food.startsWith(q) || food.includes(q)
  ).slice(0, 5);
}
// Smart meal name based on time
function getCurrentMealName() {
  const hour = new Date().getHours();
  if (hour >= 5  && hour < 10) return 'BREAKFAST';
  if (hour >= 10 && hour < 15) return 'LUNCH';
  if (hour >= 15 && hour < 18) return 'SNACK';
  if (hour >= 18 && hour < 22) return 'DINNER';
  return 'GENERAL';
}

const pendingSessions = {};

function calculateNutrition(foodText, qty = 1) {
  const text = foodText.toLowerCase();
  let totalCal = 0, totalP = 0, totalC = 0, totalF = 0;
  let foundFoods = [];
  const numMatch = text.match(/^(\d+\.?\d*)/);
  const q = numMatch ? parseFloat(numMatch[1]) : qty;
  for (const [foodName, data] of Object.entries(FOOD_DB)) {
    if (text.includes(foodName)) {
      totalCal += data.cal * q;
      totalP   += data.p   * q;
      totalC   += data.c   * q;
      totalF   += data.f   * q;
      foundFoods.push(`${q} ${foodName}`);
    }
  }
  if (foundFoods.length === 0) return null;
  return {
    food_name: foundFoods.join(' + '),
    calories:  Math.round(totalCal),
    protein:   Math.round(totalP * 10) / 10,
    carbs:     Math.round(totalC * 10) / 10,
    fat:       Math.round(totalF * 10) / 10,
    quantity:  q + ' serving'
  };
}

// ── WEBHOOK
router.post('/webhook', async (req, res) => {
  console.log('Webhook body:', JSON.stringify(req.body));
  const from = req.body?.From?.replace('whatsapp:', '') || req.body?.from?.replace('whatsapp:', '');
  const body = req.body?.Body?.trim() || req.body?.body?.trim();
  if (!from || !body) return res.sendStatus(200);

  const lower = body.toLowerCase().trim();
  const user  = db.prepare('SELECT * FROM users WHERE phone = ?').get(from);
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

  if (!user) {
    await sendWhatsApp(from, '👋 You are not registered in FitAI!\nPlease register in the app first.');
    return res.sendStatus(200);
  }

  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(user.id);

  try {
    if (pendingSessions[from]) {
      const session = pendingSessions[from];
      const num = parseInt(lower);
      if (!isNaN(num) && num >= 1 && num <= session.suggestions.length) {
        const selectedFood = session.suggestions[num - 1];
        const qty          = session.qty || 1;
        const nutrition    = calculateNutrition(`${qty} ${selectedFood}`, qty);
        delete pendingSessions[from];
        if (nutrition) {
          db.prepare(`INSERT INTO meals (user_id, date, meal_name, food_name, calories, protein, carbs, fat, quantity, unit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
            .run(user.id, today, 'getCurrentMealName()', nutrition.food_name, nutrition.calories, nutrition.protein, nutrition.carbs, nutrition.fat, nutrition.quantity, 'serving');
          const todayTotal = db.prepare('SELECT SUM(calories) as total FROM meals WHERE user_id = ? AND date = ?').get(user.id, today);
          const target = profile?.cal_target || 2000;
          const total  = todayTotal?.total || 0;
          await sendWhatsApp(from,
            `✅ *Meal Logged!*\n\n🍽️ ${nutrition.food_name}\n📊 ${nutrition.calories} kcal | P:${nutrition.protein}g C:${nutrition.carbs}g F:${nutrition.fat}g\n\n*Today: ${total}/${target} kcal*\n${total <= target ? `✅ ${target - total} kcal remaining` : `⚠️ ${total - target} kcal over!`}`
          );
        }
        return res.sendStatus(200);
      }
      if (lower === 'cancel' || lower === 'c') {
        delete pendingSessions[from];
        await sendWhatsApp(from, '❌ Cancelled. Type *help* for commands.');
        return res.sendStatus(200);
      }
    }

    if (lower === 'help' || lower === 'h') {
      await sendWhatsApp(from,
        `🤖 *FitAI WhatsApp Bot*\n\n📊 *status* — Today's progress\n🍽️ *log 2 idli* — Log a meal\n🔍 *id* — Search food\n🔥 *calories* — Today's meals\n💧 *water 6* — Update water\n⚖️ *weight 74.5* — Log weight\n💪 *motivate* — Get motivated!\n🍱 *foods* — See food list\n❓ *help* — Show this menu\n\n_💡 Tip: Just type part of a food name to search!_`
      );
    }
    else if (lower === 'status' || lower === 's') {
      const meals  = db.prepare('SELECT SUM(calories) as total FROM meals WHERE user_id = ? AND date = ?').get(user.id, today);
      const water  = db.prepare('SELECT glasses FROM water_log WHERE user_id = ? AND date = ?').get(user.id, today);
      const cal    = meals?.total || 0;
      const target = profile?.cal_target || 2000;
      await sendWhatsApp(from,
        `📊 *Today's Status*\n\n🔥 Calories: ${cal}/${target} kcal\n${cal <= target ? `✅ ${target - cal} kcal remaining` : `⚠️ ${cal - target} kcal over!`}\n💧 Water: ${water?.glasses || 0}/${profile?.water_target || 8} glasses\n\n_Reply *calories* for meal breakdown_`
      );
    }
    else if (lower.startsWith('log ')) {
      const foodText  = body.slice(4).trim();
      const nutrition = calculateNutrition(foodText);
      if (nutrition) {
        db.prepare(`INSERT INTO meals (user_id, date, meal_name, food_name, calories, protein, carbs, fat, quantity, unit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .run(user.id, today, getCurrentMealName(), nutrition.food_name, nutrition.calories, nutrition.protein, nutrition.carbs, nutrition.fat, nutrition.quantity, 'serving');
        const todayTotal = db.prepare('SELECT SUM(calories) as total FROM meals WHERE user_id = ? AND date = ?').get(user.id, today);
        const target = profile?.cal_target || 2000;
        const total  = todayTotal?.total || 0;
        await sendWhatsApp(from,
          `✅ *Meal Logged!*\n\n🍽️ ${nutrition.food_name}\n📊 ${nutrition.calories} kcal | P:${nutrition.protein}g C:${nutrition.carbs}g F:${nutrition.fat}g\n\n*Today: ${total}/${target} kcal*\n${total <= target ? `✅ ${target - total} kcal remaining` : `⚠️ ${total - target} kcal over!`}`
        );
      } else {
        const numMatch  = foodText.match(/^(\d+\.?\d*)\s*/);
        const qty       = numMatch ? parseFloat(numMatch[1]) : 1;
        const searchStr = foodText.replace(/^\d+\.?\d*\s*/, '').trim();
        const matches   = searchFoods(searchStr);
        if (matches.length > 0) {
          pendingSessions[from] = { suggestions: matches, qty };
          let msg = `🔍 *Did you mean?*\n\n`;
          matches.forEach((m, i) => { msg += `${i + 1}. *${m}* — ${Math.round(FOOD_DB[m].cal * qty)} kcal\n`; });
          msg += `\n_Reply 1-${matches.length} to select_\n_Reply *cancel* to cancel_`;
          await sendWhatsApp(from, msg);
        } else {
          await sendWhatsApp(from, `❌ Food not found: "${foodText}"\n\nTry: *log 2 idli* or *log chicken*\nReply *foods* to see full list!`);
        }
      }
    }
    else if (lower === 'calories' || lower === 'cal') {
      const meals  = db.prepare('SELECT food_name, calories FROM meals WHERE user_id = ? AND date = ? ORDER BY id DESC LIMIT 6').all(user.id, today);
      const total  = meals.reduce((s, m) => s + (m.calories || 0), 0);
      const target = profile?.cal_target || 2000;
      let msg = `🔥 *Today's Meals*\n\n`;
      if (meals.length === 0) { msg += `No meals logged yet!\nType *log 2 idli* to log.`; }
      else { meals.forEach(m => { msg += `• ${m.food_name} — ${m.calories} kcal\n`; }); msg += `\n*Total: ${total}/${target} kcal*`; }
      await sendWhatsApp(from, msg);
    }
    else if (lower.startsWith('water ')) {
      const glasses = parseInt(lower.split(' ')[1]);
      if (isNaN(glasses)) { await sendWhatsApp(from, '💧 Usage: *water 6*'); }
      else {
        const ex = db.prepare('SELECT * FROM water_log WHERE user_id = ? AND date = ?').get(user.id, today);
        if (ex) db.prepare('UPDATE water_log SET glasses = ? WHERE user_id = ? AND date = ?').run(glasses, user.id, today);
        else db.prepare('INSERT INTO water_log (user_id, date, glasses) VALUES (?, ?, ?)').run(user.id, today, glasses);
        const target = profile?.water_target || 8;
        await sendWhatsApp(from, `💧 *Water Updated!*\n\n${glasses}/${target} glasses ✅\n${glasses >= target ? '🎯 Goal reached!' : `${target - glasses} more to go!`}`);
      }
    }
    else if (lower.startsWith('weight ')) {
      const weight = parseFloat(lower.split(' ')[1]);
      if (isNaN(weight)) { await sendWhatsApp(from, '⚖️ Usage: *weight 74.5*'); }
      else {
        db.prepare('INSERT INTO progress (user_id, date, weight_kg) VALUES (?, ?, ?)').run(user.id, today, weight);
        db.prepare('UPDATE profiles SET weight_kg = ? WHERE user_id = ?').run(weight, user.id);
        await sendWhatsApp(from, `⚖️ *Weight Logged!*\n\n${weight} kg recorded ✅\nKeep tracking! 💪`);
      }
    }
    else if (lower === 'motivate' || lower === 'm') {
      const quotes = [
        `💪 The body achieves what the mind believes! Keep going ${user.name}!`,
        `🔥 You didn't come this far to only come this far! Push harder ${user.name}!`,
        `⚡ Your only competition is who you were yesterday! Let's go ${user.name}!`,
        `🎯 Discipline is doing it even when you don't feel like it! Stay strong ${user.name}!`,
        `🏆 Champions are made from deep inside — that's you ${user.name}!`
      ];
      await sendWhatsApp(from, quotes[Math.floor(Math.random() * quotes.length)]);
    }
    else if (lower === 'foods' || lower === 'food list') {
      await sendWhatsApp(from,
        `🍱 *Food List*\n\n🟢 *South Indian:*\nidli, dosa, sambar, vada, upma, pongal, rice, biryani, parotta, rasam\n\n🟡 *North Indian:*\nchapati, roti, naan, dal, rajma, paneer, puri\n\n🔴 *Proteins:*\negg, chicken, fish\n\n🔵 *Fruits:*\nbanana, apple, mango, orange, watermelon, grapes\n\n⚪ *Snacks:*\nbread, oats, poha, biscuit, sandwich, burger, pizza\n\n_💡 Just type part of food name to search!_`
      );
    }
    else if (!['calories', 'cal', 'motivate', 'm', 'foods', 'food list'].includes(lower) &&
             !lower.startsWith('water ') && !lower.startsWith('weight ') &&
             lower.length >= 2 && lower.length <= 20 && !lower.includes(' ')) {
      const matches = searchFoods(lower);
      if (matches.length > 0) {
        const qty = 1;
        pendingSessions[from] = { suggestions: matches, qty };
        let msg = `🔍 *Food Search: "${lower}"*\n\n`;
        matches.forEach((m, i) => { msg += `${i + 1}. *${m}* — ${FOOD_DB[m].cal} kcal per ${FOOD_DB[m].unit}\n`; });
        msg += `\n_Reply 1-${matches.length} to log 1 serving_\n_Or type *log 2 ${matches[0]}* for custom qty_\n_Reply *cancel* to cancel_`;
        await sendWhatsApp(from, msg);
      } else {
        await sendWhatsApp(from, `❓ "*${body}*" not recognized.\n\n💡 Try:\n• *log 2 idli sambar*\n• Type *id* to search idli\n• Reply *help* for all commands!`);
      }
    }
  } catch (err) {
    console.error('Bot error:', err);
    await sendWhatsApp(from, '⚠️ Something went wrong. Try again!');
  }
  res.sendStatus(200);
});

// ── SEND REMINDER
router.post('/send-reminder', async (req, res) => {
  const { meal_name } = req.body;
  try {
    const users = db.prepare(`
      SELECT u.id, u.name, u.phone, p.cal_target, p.water_target
      FROM users u
      JOIN profiles p ON p.user_id = u.id
      WHERE u.phone IS NOT NULL AND u.phone != ''
    `).all();

    let sent = 0;
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    for (const u of users) {
      const meals  = db.prepare('SELECT SUM(calories) as total FROM meals WHERE user_id = ? AND date = ?').get(u.id, today);
      const cal    = meals?.total || 0;
      const target = u.cal_target || 2000;

      const msg =
        `🍽️ *${meal_name} Time, ${u.name}!*\n\n` +
        `Don't forget to log your ${meal_name.toLowerCase()}!\n\n` +
        `📊 Today so far: ${cal}/${target} kcal\n\n` +
        `_Reply *status* for full update_`;

      await sendWhatsApp(u.phone, msg);
      sent++;
    }

    res.json({ message: `Reminder sent to ${sent} users!` });
  } catch (err) {
    console.error('Reminder error:', err);
    res.status(500).json({ error: 'Failed to send reminders' });
  }
});

module.exports = router;