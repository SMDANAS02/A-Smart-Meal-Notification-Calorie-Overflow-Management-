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
    const { message, history = [], clientApiKey } = req.body;
    const userId = req.user.id;
    const dateStr = new Date().toISOString().split('T')[0];

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

SPECIAL INSTRUCTIONS:
- Answer user queries about calories, foods, and nutrition warmly and concisely.
- If user asks to log/add a food item (e.g. "add 2 eggs", "I ate an apple"), confirm it naturally.
- IMPORTANT: Do NOT include raw JSON blocks, code fences, or technical data structures in your text response. Keep responses clean, natural, and user-friendly.`;

    let replyText = "";
    let actionResult = null;

    // Helper to thoroughly clean any JSON/code blocks from text
    const cleanTextOfCodeBlocks = (str) => {
      if (!str) return '';
      return String(str)
        .replace(/```[\s\S]*?```/gi, '')
        .replace(/\{[\s\S]*?"action"[\s\S]*?\}/gi, '')
        .replace(/\{[\s\S]*?"calories"[\s\S]*?\}/gi, '')
        .replace(/```/g, '')
        .trim();
    };

    if (apiKey) {
      // Sanitize history to prevent API 400 errors
      const validRoles = new Set(['user', 'assistant']);
      const sanitizedHistory = (Array.isArray(history) ? history : [])
        .filter(h => h && validRoles.has(h.role) && typeof h.content === 'string')
        .map(h => ({
          role: h.role,
          content: cleanTextOfCodeBlocks(h.content)
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

    // Fallback/Local AI response if API key wasn't provided or failed
    if (!replyText || replyText.includes("API error:")) {
      replyText = generateFallbackResponse(message, user, targetCal, totalCal, remainingCal, mealsSummary, waterGlasses);
    }

    // Extract food logging intent from user message & replyText
    let extractedAction = detectFoodLogIntent(message);

    // Also check if replyText has any JSON intent
    const jsonMatch = replyText.match(/(\{[\s\S]*?"action"\s*:\s*"LOG_FOOD"[\s\S]*?\})/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed && parsed.action === 'LOG_FOOD') extractedAction = parsed;
      } catch (e) {}
    }

    // Clean user-facing text: strip raw JSON action blocks completely
    replyText = cleanTextOfCodeBlocks(replyText);

    // If an action was extracted, execute DB logging safely
    if (extractedAction && extractedAction.action === 'LOG_FOOD') {
      try {
        const mealName = String(extractedAction.meal_name || 'snack').toLowerCase().trim();
        const foodName = String(extractedAction.food_name || 'Food').trim();
        const cals = Math.max(0, parseInt(extractedAction.calories) || 100);
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

      if (!replyText) {
        replyText = `✅ Added **${extractedAction.food_name || 'food'}** to your daily tracker!`;
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
    res.status(500).json({ error: "Failed to process AI chat request", details: err.message });
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

// Simple fallback regex intent detection for logging food
function detectFoodLogIntent(msg) {
  const text = msg.toLowerCase();
  const isLogReq = text.includes("add") || text.includes("log") || text.includes("ate") || text.includes("had");
  if (!isLogReq) return null;

  // Extract meal
  let meal = "snack";
  if (text.includes("breakfast")) meal = "breakfast";
  else if (text.includes("lunch")) meal = "lunch";
  else if (text.includes("dinner")) meal = "dinner";

  // Extract numbers (calories / quantity)
  const calMatch = text.match(/(\d+)\s*(cal|kcal|calories)/);
  const calories = calMatch ? parseInt(calMatch[1]) : 150;

  // Extract food name basic logic
  let foodName = msg
    .replace(/(add|log|i ate|i had|to|for|breakfast|lunch|dinner|snack|\d+|cal|kcal|calories)/gi, '')
    .trim();
  if (!foodName || foodName.length < 2) foodName = "Custom Food Item";

  return {
    action: "LOG_FOOD",
    meal_name: meal,
    food_name: foodName.charAt(0).toUpperCase() + foodName.slice(1),
    calories: calories,
    protein: Math.round(calories * 0.15 / 4),
    carbs: Math.round(calories * 0.5 / 4),
    fat: Math.round(calories * 0.35 / 9),
    quantity: 1,
    unit: "serving"
  };
}

module.exports = router;
