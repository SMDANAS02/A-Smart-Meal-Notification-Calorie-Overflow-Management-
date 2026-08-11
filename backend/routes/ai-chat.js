// routes/ai-chat.js — AI Assistant powered by xAI Grok & FitAI DB Context
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const auth    = require('../middleware/auth');

// Function to call AI API (Supports Groq gsk_... and xAI xai-...)
async function callGrokAPI(apiKey, messages) {
  let endpoint = "https://api.groq.com/openai/v1/chat/completions";
  let model = "llama-3.3-70b-versatile";

  if (apiKey.startsWith("xai-")) {
    endpoint = "https://api.x.ai/v1/chat/completions";
    model = "grok-2-latest";
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 800
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// ─────────────────────────────────────────
// POST /api/ai-chat — Process Chat Request
// ─────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { message, history = [], clientApiKey, date } = req.body;
    const userId = req.user.id;
    const dateStr = date || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    // Determine API Key (Client key or Environment variable)
    const apiKey = clientApiKey || process.env.GROQ_API_KEY || process.env.GROK_API_KEY || process.env.XAI_API_KEY;

    // Fetch user context from database
    const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(userId);
    const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId);
    const todayMeals = db.prepare('SELECT * FROM meals WHERE user_id = ? AND date = ? ORDER BY created_at ASC').all(userId, dateStr);
    const todayWater = db.prepare('SELECT glasses FROM water_log WHERE user_id = ? AND date = ?').get(userId, dateStr);

    const targetCal = profile?.cal_target || 2000;
    const totalCal = todayMeals.reduce((sum, m) => sum + (m.calories || 0), 0);
    const totalP = todayMeals.reduce((sum, m) => sum + (m.protein || 0), 0);
    const totalC = todayMeals.reduce((sum, m) => sum + (m.carbs || 0), 0);
    const totalF = todayMeals.reduce((sum, m) => sum + (m.fat || 0), 0);
    const remainingCal = targetCal - totalCal;
    const waterGlasses = todayWater ? todayWater.glasses : 0;

    const mealsSummary = todayMeals.length > 0 
      ? todayMeals.map(m => `- ${m.meal_name.toUpperCase()}: ${m.food_name} (${m.calories} kcal, P:${m.protein}g C:${m.carbs}g F:${m.fat}g)`).join('\n')
      : 'No meals logged today yet.';

    // Construct System Context for Grok / Groq
    const systemPrompt = `You are fitAi Calorie & Nutrition Assistant, an intelligent, energetic fitness & nutrition AI assistant inside the fitAi Calorie Overflow & Diet Management app.

REAL-TIME USER METRICS TODAY (${dateStr}):
- User Name: ${user?.name || 'User'}
- Goal: ${profile?.goal || 'Maintain Weight'}
- Target Daily Calories: ${targetCal} kcal
- Consumed Today: ${totalCal} kcal
- Remaining Budget: ${remainingCal} kcal
- Today's Macros: Protein: ${totalP}g / Target ${profile?.protein_target || 150}g | Carbs: ${totalC}g / Target ${profile?.carbs_target || 225}g | Fat: ${totalF}g / Target ${profile?.fat_target || 56}g
- Water Intake: ${waterGlasses} glasses (8 oz each)
- Logged Meals Today:
${mealsSummary}

SPECIAL INSTRUCTIONS FOR FOOD LOGGING:
- Answer user queries about calories, foods, and nutrition warmly and concisely.
- If the user asks to log, add, track, or record any food item (or mentions eating/drinking something), confirm it warmly AND append a JSON action block at the VERY END of your response inside <ACTION> ... </ACTION> tags like this:
<ACTION>
{
  "action": "LOG_FOOD",
  "meal_name": "breakfast" | "lunch" | "snack" | "dinner",
  "food_name": "Food Item Name",
  "calories": 250,
  "protein": 15,
  "carbs": 30,
  "fat": 8,
  "quantity": 1,
  "unit": "serving"
}
</ACTION>`;

    let replyText = "";
    let actionResult = null;

    // Helper to clean JSON code blocks / ACTION tags from user-facing text
    const cleanTextForUser = (str) => {
      if (!str) return '';
      return String(str)
        .replace(/<ACTION>[\s\S]*?<\/ACTION>/gi, '')
        .replace(/```json[\s\S]*?```/gi, '')
        .replace(/```[\s\S]*?```/gi, '')
        .replace(/\{[\s\S]*?"action"\s*:\s*"LOG_FOOD"[\s\S]*?\}/gi, '')
        .trim();
    };

    if (apiKey) {
      // Sanitize history to prevent API 400 errors
      const validRoles = new Set(['user', 'assistant']);
      const sanitizedHistory = (Array.isArray(history) ? history : [])
        .filter(h => h && validRoles.has(h.role) && typeof h.content === 'string')
        .map(h => ({
          role: h.role,
          content: cleanTextForUser(h.content)
        }))
        .filter(h => h.content.length > 0)
        .slice(-6);

      const messages = [
        { role: "system", content: systemPrompt },
        ...sanitizedHistory,
        { role: "user", content: message }
      ];

      try {
        replyText = await callGrokAPI(apiKey, messages);
      } catch (err) {
        console.error("Grok API call failed:", err);
        replyText = `⚠️ API error: ${err.message}. Switching to local assistant.`;
      }
    }

    // Extract food logging action from <ACTION> tags in AI reply
    let extractedAction = null;
    if (replyText) {
      const actionTagMatch = replyText.match(/<ACTION>([\s\S]*?)<\/ACTION>/i);
      if (actionTagMatch) {
        try {
          const parsed = JSON.parse(actionTagMatch[1].trim());
          if (parsed && parsed.action === 'LOG_FOOD') extractedAction = parsed;
        } catch (e) {}
      }
    }

    // Fallback/Local AI response if API key wasn't provided or failed or didn't extract action
    if (!extractedAction) {
      extractedAction = detectFoodLogIntent(message);
    }

    if (!replyText || replyText.includes("API error:")) {
      replyText = generateFallbackResponse(message, user, targetCal, totalCal, remainingCal, mealsSummary, waterGlasses);
    }

    // Clean user-facing text: strip raw JSON action blocks / ACTION tags
    replyText = cleanTextForUser(replyText);

    // If an action was extracted, execute DB logging safely
    if (extractedAction && extractedAction.action === 'LOG_FOOD') {
      try {
        const mealName = String(extractedAction.meal_name || 'snack').toLowerCase().trim();
        const foodName = String(extractedAction.food_name || 'Food Item').trim();
        const cals = Math.max(1, parseInt(extractedAction.calories) || 150);
        const p = Math.max(0, parseInt(extractedAction.protein) || 0);
        const c = Math.max(0, parseInt(extractedAction.carbs) || 0);
        const f = Math.max(0, parseInt(extractedAction.fat) || 0);
        const qty = Math.max(1, parseInt(extractedAction.quantity) || 1);
        const unit = String(extractedAction.unit || 'serving').slice(0, 20);

        const insertResult = db.prepare(`
          INSERT INTO meals (user_id, date, meal_name, food_name, calories, protein, carbs, fat, quantity, unit)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(userId, dateStr, mealName, foodName, cals, p, c, f, qty, unit);

        const newMeal = db.prepare('SELECT * FROM meals WHERE id = ?').get(insertResult.lastInsertRowid);

        actionResult = {
          success: true,
          meal: newMeal,
          message: `Successfully logged ${foodName} (${cals} kcal) under ${mealName.toUpperCase()}!`
        };
      } catch (dbErr) {
        console.error("Database error while logging AI food action:", dbErr);
      }

      if (!replyText || replyText.includes("fitAi Grok Coach")) {
        replyText = `✅ Added **${extractedAction.food_name || 'food'}** (${extractedAction.calories} kcal) to your daily tracker!`;
      }
    }

    // Recalculate totals after action
    const updatedMeals = db.prepare('SELECT * FROM meals WHERE user_id = ? AND date = ?').all(userId, dateStr);
    const updatedTotalCal = updatedMeals.reduce((sum, m) => sum + (m.calories || 0), 0);
    const updatedRemaining = targetCal - updatedTotalCal;

    res.json({
      reply: replyText,
      actionResult,
      metrics: {
        totalCalories: updatedTotalCal,
        targetCalories: targetCal,
        remainingCalories: updatedRemaining,
        loggedMealsCount: updatedMeals.length
      },
      hasApiKey: !!apiKey
    });

  } catch (err) {
    console.error("AI Chat Route Error:", err);
    res.json({
      reply: `🤖 I've received your request! Ask me to log meals like "Add 2 eggs to breakfast" or check remaining calories anytime.`,
      actionResult: null,
      metrics: { totalCalories: 0, targetCalories: 2000, remainingCalories: 2000, loggedMealsCount: 0 },
      hasApiKey: false
    });
  }
});

// Fallback response engine when Grok Key is not yet configured
function generateFallbackResponse(msg, user, targetCal, totalCal, remainingCal, mealsSummary, water) {
  const text = msg.toLowerCase();

  if (text.includes("calor") || text.includes("left") || text.includes("target") || text.includes("budget")) {
    return `📊 **Daily Calorie Summary**:
- Target: **${targetCal} kcal**
- Consumed: **${totalCal} kcal**
- Remaining: **${remainingCal} kcal**
${remainingCal < 0 ? '⚠️ You are currently in a calorie overflow!' : '✅ You are within your budget!'}`;
  }

  if (text.includes("eat") || text.includes("food") || text.includes("log") || text.includes("earlier") || text.includes("history")) {
    return `🍽️ **Logged Foods Today**:
${mealsSummary}

*Tip: You can ask me to log foods like "Add 2 eggs 140 cal to breakfast" and I'll add them instantly!*`;
  }

  if (text.includes("water") || text.includes("drink")) {
    return `💧 You have logged **${water} glasses** of water today (Goal: 8 glasses). Stay hydrated!`;
  }

  return `🤖 Hi **${user?.name || 'there'}**! I am your **fitAi Grok Coach**.

I can help you:
- Track & log foods (e.g. "Log 1 apple 52 cal to breakfast")
- Recall previous meals logged today
- Check your remaining calorie & macro budget
- Suggest healthy meals based on remaining calories

💡 *Enter your Grok API key in the chat settings above to unlock full AI conversational powers!*`;
}

// Fallback regex & database intent detection for logging food
const COMMON_FOOD_DB = {
  'egg': { cal: 78, p: 6, c: 1, f: 5 },
  'eggs': { cal: 78, p: 6, c: 1, f: 5 },
  'chicken breast': { cal: 165, p: 31, c: 0, f: 4 },
  'chicken': { cal: 165, p: 31, c: 0, f: 4 },
  'apple': { cal: 52, p: 0, c: 14, f: 0 },
  'banana': { cal: 89, p: 1, c: 23, f: 0 },
  'rice': { cal: 206, p: 4, c: 45, f: 0 },
  'oats': { cal: 280, p: 8, c: 52, f: 5 },
  'paneer': { cal: 265, p: 18, c: 1, f: 21 },
  'dal': { cal: 230, p: 18, c: 40, f: 1 },
  'roti': { cal: 71, p: 3, c: 15, f: 0 },
  'chapati': { cal: 71, p: 3, c: 15, f: 0 },
  'dosa': { cal: 120, p: 3, c: 20, f: 3 },
  'idli': { cal: 58, p: 2, c: 12, f: 0 },
  'biryani': { cal: 290, p: 12, c: 40, f: 9 },
  'pizza': { cal: 266, p: 11, c: 33, f: 10 },
  'burger': { cal: 354, p: 17, c: 40, f: 14 },
  'milk': { cal: 150, p: 8, c: 12, f: 8 },
  'salad': { cal: 120, p: 2, c: 8, f: 10 }
};

function detectFoodLogIntent(msg) {
  const text = msg.toLowerCase();
  const keywords = ["add", "log", "ate", "had", "eat", "track", "consumed", "drink", "drank", "have", "record"];
  const isLogReq = keywords.some(k => text.includes(k));
  if (!isLogReq) return null;

  // Extract meal category
  let meal = "snack";
  if (text.includes("breakfast")) meal = "breakfast";
  else if (text.includes("lunch")) meal = "lunch";
  else if (text.includes("dinner")) meal = "dinner";

  // Extract explicit calories if mentioned (e.g. 200 cal / 200 kcal / 200 calories)
  const calMatch = text.match(/(\d+)\s*(cal|kcal|calories)/);
  let calories = calMatch ? parseInt(calMatch[1]) : 0;

  // Extract quantity (e.g. 2 eggs, 3 rotis)
  const qtyMatch = text.match(/(\d+)\s+([a-z]+)/);
  let qty = 1;
  if (qtyMatch) {
    const num = parseInt(qtyMatch[1]);
    if (!isNaN(num) && num > 0 && num < 50) qty = num;
  }

  // Find matching food item in COMMON_FOOD_DB
  let matchedFood = null;
  let foodName = "";
  for (const [key, item] of Object.entries(COMMON_FOOD_DB)) {
    if (text.includes(key)) {
      matchedFood = item;
      foodName = key.charAt(0).toUpperCase() + key.slice(1);
      break;
    }
  }

  if (!matchedFood) {
    foodName = msg
      .replace(/(add|log|i ate|i had|i consumed|to|for|breakfast|lunch|dinner|snack|\d+|cal|kcal|calories|track|record)/gi, '')
      .trim();
    if (!foodName || foodName.length < 2) foodName = "Custom Meal";
    foodName = foodName.charAt(0).toUpperCase() + foodName.slice(1);
  }

  if (!calories) {
    if (matchedFood) {
      calories = matchedFood.cal * qty;
    } else {
      calories = 150;
    }
  }

  const p = matchedFood ? Math.round(matchedFood.p * qty) : Math.round(calories * 0.15 / 4);
  const c = matchedFood ? Math.round(matchedFood.c * qty) : Math.round(calories * 0.5 / 4);
  const f = matchedFood ? Math.round(matchedFood.f * qty) : Math.round(calories * 0.35 / 9);

  return {
    action: "LOG_FOOD",
    meal_name: meal,
    food_name: qty > 1 && !foodName.includes(String(qty)) ? `${qty} x ${foodName}` : foodName,
    calories: calories,
    protein: p,
    carbs: c,
    fat: f,
    quantity: qty,
    unit: "serving"
  };
}

module.exports = router;
