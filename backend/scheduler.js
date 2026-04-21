const cron = require('node-cron');
const twilio = require('twilio');
const db = require('./db');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const FROM = process.env.TWILIO_WHATSAPP_FROM;

async function sendWhatsApp(to, message) {
  try {
    await client.messages.create({ from: FROM, to: `whatsapp:${to}`, body: message });
    console.log(`Reminder sent to ${to}`);
  } catch (err) { console.error(`Failed:`, err.message); }
}

function getUsers() {
  return db.prepare(`SELECT u.id, u.name, u.phone, p.cal_target, p.water_target FROM users u JOIN profiles p ON p.user_id = u.id WHERE u.phone IS NOT NULL AND u.phone != ''`).all();
}

function getTodayStats(userId) {
  const today = new Date().toISOString().split('T')[0];
  const meals = db.prepare('SELECT SUM(calories) as total FROM meals WHERE user_id = ? AND date = ?').get(userId, today);
  const water = db.prepare('SELECT glasses FROM water_log WHERE user_id = ? AND date = ?').get(userId, today);
  return { calories: meals?.total || 0, glasses: water?.glasses || 0, date: today };
}

cron.schedule('0 8 * * *', async () => {
  const users = getUsers();
  for (const u of users) { await sendWhatsApp(u.phone, `Good Morning ${u.name}! Breakfast time! Log your meal in FitAI. Reply status for progress.`); }
}, { timezone: 'Asia/Kolkata' });

cron.schedule('0 13 * * *', async () => {
  const users = getUsers();
  for (const u of users) {
    const s = getTodayStats(u.id);
    await sendWhatsApp(u.phone, `Lunch Time ${u.name}! Calories so far: ${s.calories}/${u.cal_target || 2000} kcal. Log your lunch!`);
  }
}, { timezone: 'Asia/Kolkata' });

cron.schedule('0 19 * * *', async () => {
  const users = getUsers();
  for (const u of users) {
    const s = getTodayStats(u.id);
    await sendWhatsApp(u.phone, `Dinner Time ${u.name}! Calories: ${s.calories}/${u.cal_target || 2000} kcal. Water: ${s.glasses}/${u.water_target || 8} glasses. Log your dinner!`);
  }
}, { timezone: 'Asia/Kolkata' });

cron.schedule('0 21 * * *', async () => {
  const users = getUsers();
  for (const u of users) {
    const s = getTodayStats(u.id);
    const diff = s.calories - (u.cal_target || 2000);
    await sendWhatsApp(u.phone, `Daily Summary ${u.name}! Calories: ${s.calories}/${u.cal_target || 2000} kcal. ${diff <= 0 ? 'On track!' : `Over by ${diff} kcal`}. Water: ${s.glasses} glasses. Great job!`);
  }
}, { timezone: 'Asia/Kolkata' });

console.log('FitAI Scheduler started! Breakfast 8AM, Lunch 1PM, Dinner 7PM, Summary 9PM');
