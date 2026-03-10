const STATE = {
  user:      JSON.parse(localStorage.getItem('fitai_user'))    || { name: 'User', goal: 'maintain' },
  targets:   JSON.parse(localStorage.getItem('fitai_targets')) || { calories: 2000, protein: 150, carbs: 225, fat: 56 },
  mealCount: parseInt(localStorage.getItem('fitai_mealcount')) || 3,
  meals:     JSON.parse(localStorage.getItem('fitai_meals'))   || null,
  water:     parseInt(localStorage.getItem('fitai_water'))     || 0,
  waterGoal: 8,
};

const MEAL_TEMPLATES = {
  2: [
    { name: 'BREAKFAST', time: '8:00 AM', icon: '🌅', ratio: 0.5  },
    { name: 'DINNER',    time: '6:00 PM', icon: '🌙', ratio: 0.5  },
  ],
  3: [
    { name: 'BREAKFAST', time: '8:00 AM',  icon: '🌅', ratio: 0.30 },
    { name: 'LUNCH',     time: '1:00 PM',  icon: '☀️', ratio: 0.40 },
    { name: 'DINNER',    time: '7:00 PM',  icon: '🌙', ratio: 0.30 },
  ],
  4: [
    { name: 'BREAKFAST', time: '7:30 AM',  icon: '🌅', ratio: 0.25 },
    { name: 'LUNCH',     time: '12:30 PM', icon: '☀️', ratio: 0.35 },
    { name: 'SNACK',     time: '4:00 PM',  icon: '⚡', ratio: 0.15 },
    { name: 'DINNER',    time: '7:30 PM',  icon: '🌙', ratio: 0.25 },
  ],
  5: [
    { name: 'BREAKFAST',   time: '7:00 AM',  icon: '🌅', ratio: 0.25 },
    { name: 'MID MORNING', time: '10:00 AM', icon: '⚡', ratio: 0.10 },
    { name: 'LUNCH',       time: '1:00 PM',  icon: '☀️', ratio: 0.30 },
    { name: 'SNACK',       time: '4:30 PM',  icon: '⚡', ratio: 0.10 },
    { name: 'DINNER',      time: '7:30 PM',  icon: '🌙', ratio: 0.25 },
  ],
  6: [
    { name: 'BREAKFAST',   time: '7:00 AM',  icon: '🌅', ratio: 0.20 },
    { name: 'MID MORNING', time: '9:30 AM',  icon: '⚡', ratio: 0.10 },
    { name: 'LUNCH',       time: '12:30 PM', icon: '☀️', ratio: 0.25 },
    { name: 'AFTERNOON',   time: '3:30 PM',  icon: '⚡', ratio: 0.10 },
    { name: 'DINNER',      time: '6:30 PM',  icon: '🌙', ratio: 0.25 },
    { name: 'EVENING',     time: '9:00 PM',  icon: '⭐', ratio: 0.10 },
  ],
};

const MEAL_DB = [
  { name: 'Grilled Chicken Breast',  cal: 165, protein: 31, carbs: 0,  fat: 4,  tag: 'HIGH PROTEIN' },
  { name: 'Brown Rice (1 cup)',       cal: 216, protein: 5,  carbs: 45, fat: 2,  tag: 'CARBS' },
  { name: 'Oats with Banana',        cal: 280, protein: 8,  carbs: 52, fat: 5,  tag: 'BREAKFAST' },
  { name: 'Egg White Omelette',      cal: 120, protein: 18, carbs: 2,  fat: 4,  tag: 'HIGH PROTEIN' },
  { name: 'Greek Yogurt',            cal: 100, protein: 17, carbs: 6,  fat: 0,  tag: 'SNACK' },
  { name: 'Salmon Fillet',           cal: 208, protein: 28, carbs: 0,  fat: 10, tag: 'OMEGA-3' },
  { name: 'Sweet Potato',            cal: 103, protein: 2,  carbs: 24, fat: 0,  tag: 'COMPLEX CARBS' },
  { name: 'Almonds (30g)',           cal: 174, protein: 6,  carbs: 6,  fat: 15, tag: 'HEALTHY FAT' },
  { name: 'Mixed Salad + Olive Oil', cal: 120, protein: 2,  carbs: 8,  fat: 10, tag: 'LIGHT' },
  { name: 'Paneer (100g)',           cal: 265, protein: 18, carbs: 1,  fat: 21, tag: 'VEGETARIAN' },
  { name: 'Dal (1 cup)',             cal: 230, protein: 18, carbs: 40, fat: 1,  tag: 'VEGETARIAN' },
  { name: 'Banana',                  cal: 89,  protein: 1,  carbs: 23, fat: 0,  tag: 'SNACK' },
  { name: 'Whole Wheat Roti',        cal: 71,  protein: 3,  carbs: 15, fat: 0,  tag: 'CARBS' },
  { name: 'Boiled Eggs (2)',         cal: 156, protein: 12, carbs: 1,  fat: 11, tag: 'PROTEIN' },
  { name: 'Tuna Salad',              cal: 185, protein: 25, carbs: 5,  fat: 8,  tag: 'HIGH PROTEIN' },
  { name: 'Cottage Cheese (100g)',   cal: 98,  protein: 11, carbs: 3,  fat: 4,  tag: 'LIGHT' },
];

const FOOD_DB = {
  'rice':            { cal: 206, protein: 4,  carbs: 45, fat: 0,   note: 'White rice, 1 cup cooked' },
  'brown rice':      { cal: 216, protein: 5,  carbs: 45, fat: 2,   note: 'Brown rice, 1 cup cooked' },
  'oats':            { cal: 150, protein: 5,  carbs: 27, fat: 3,   note: 'Oats, 1/2 cup dry' },
  'roti':            { cal: 71,  protein: 3,  carbs: 15, fat: 0,   note: 'Whole wheat roti, 1 piece' },
  'chapati':         { cal: 71,  protein: 3,  carbs: 15, fat: 0,   note: 'Chapati, 1 piece' },
  'bread':           { cal: 79,  protein: 3,  carbs: 15, fat: 1,   note: 'Whole wheat bread, 1 slice' },
  'idli':            { cal: 58,  protein: 2,  carbs: 12, fat: 0,   note: 'Idli, 1 piece' },
  'dosa':            { cal: 120, protein: 3,  carbs: 20, fat: 3,   note: 'Plain dosa, 1 piece' },
  'upma':            { cal: 200, protein: 5,  carbs: 35, fat: 5,   note: 'Upma, 1 cup' },
  'poha':            { cal: 180, protein: 4,  carbs: 35, fat: 3,   note: 'Poha, 1 cup' },
  'pasta':           { cal: 220, protein: 8,  carbs: 43, fat: 1,   note: 'Pasta, 1 cup cooked' },
  'noodles':         { cal: 200, protein: 5,  carbs: 38, fat: 2,   note: 'Noodles, 1 cup cooked' },
  'quinoa':          { cal: 222, protein: 8,  carbs: 39, fat: 4,   note: 'Quinoa, 1 cup cooked' },
  'wheat':           { cal: 340, protein: 13, carbs: 72, fat: 2,   note: 'Wheat flour, 100g' },
  'chicken breast':  { cal: 165, protein: 31, carbs: 0,  fat: 4,   note: 'Grilled chicken breast, 100g' },
  'chicken':         { cal: 165, protein: 31, carbs: 0,  fat: 4,   note: 'Chicken, 100g' },
  'egg':             { cal: 78,  protein: 6,  carbs: 1,  fat: 5,   note: 'Whole egg, 1 large' },
  'egg white':       { cal: 17,  protein: 4,  carbs: 0,  fat: 0,   note: 'Egg white, 1 large' },
  'boiled egg':      { cal: 78,  protein: 6,  carbs: 1,  fat: 5,   note: 'Boiled egg, 1 large' },
  'omelette':        { cal: 154, protein: 11, carbs: 1,  fat: 12,  note: 'Plain omelette, 2 eggs' },
  'salmon':          { cal: 208, protein: 28, carbs: 0,  fat: 10,  note: 'Salmon fillet, 100g' },
  'tuna':            { cal: 130, protein: 28, carbs: 0,  fat: 1,   note: 'Tuna, 100g' },
  'fish':            { cal: 140, protein: 26, carbs: 0,  fat: 4,   note: 'Fish fillet, 100g' },
  'mutton':          { cal: 294, protein: 26, carbs: 0,  fat: 20,  note: 'Mutton, 100g cooked' },
  'beef':            { cal: 250, protein: 26, carbs: 0,  fat: 15,  note: 'Beef, 100g cooked' },
  'prawn':           { cal: 99,  protein: 21, carbs: 0,  fat: 1,   note: 'Prawns, 100g' },
  'shrimp':          { cal: 99,  protein: 21, carbs: 0,  fat: 1,   note: 'Shrimp, 100g' },
  'turkey':          { cal: 135, protein: 30, carbs: 0,  fat: 1,   note: 'Turkey breast, 100g' },
  'paneer':          { cal: 265, protein: 18, carbs: 1,  fat: 21,  note: 'Paneer, 100g' },
  'tofu':            { cal: 76,  protein: 8,  carbs: 2,  fat: 4,   note: 'Firm tofu, 100g' },
  'dal':             { cal: 230, protein: 18, carbs: 40, fat: 1,   note: 'Dal, 1 cup cooked' },
  'lentils':         { cal: 230, protein: 18, carbs: 40, fat: 1,   note: 'Lentils, 1 cup cooked' },
  'chickpeas':       { cal: 269, protein: 15, carbs: 45, fat: 4,   note: 'Chickpeas, 1 cup cooked' },
  'kidney beans':    { cal: 225, protein: 15, carbs: 40, fat: 1,   note: 'Kidney beans, 1 cup' },
  'soya':            { cal: 173, protein: 17, carbs: 10, fat: 9,   note: 'Soya chunks, 100g cooked' },
  'whey protein':    { cal: 120, protein: 24, carbs: 3,  fat: 2,   note: 'Whey protein, 1 scoop 30g' },
  'protein shake':   { cal: 160, protein: 24, carbs: 10, fat: 3,   note: 'Protein shake, 1 serving' },
  'milk':            { cal: 61,  protein: 3,  carbs: 5,  fat: 3,   note: 'Whole milk, 100ml' },
  'greek yogurt':    { cal: 100, protein: 17, carbs: 6,  fat: 0,   note: 'Greek yogurt, 170g' },
  'yogurt':          { cal: 59,  protein: 3,  carbs: 5,  fat: 3,   note: 'Curd/Yogurt, 100g' },
  'curd':            { cal: 59,  protein: 3,  carbs: 5,  fat: 3,   note: 'Curd, 100g' },
  'cheese':          { cal: 402, protein: 25, carbs: 1,  fat: 33,  note: 'Cheese, 100g' },
  'cottage cheese':  { cal: 98,  protein: 11, carbs: 3,  fat: 4,   note: 'Cottage cheese, 100g' },
  'butter':          { cal: 717, protein: 1,  carbs: 0,  fat: 81,  note: 'Butter, 100g' },
  'ghee':            { cal: 900, protein: 0,  carbs: 0,  fat: 100, note: 'Ghee, 100g' },
  'ice cream':       { cal: 207, protein: 4,  carbs: 24, fat: 11,  note: 'Ice cream, 100g' },
  'broccoli':        { cal: 34,  protein: 3,  carbs: 7,  fat: 0,   note: 'Broccoli, 100g' },
  'spinach':         { cal: 23,  protein: 3,  carbs: 4,  fat: 0,   note: 'Spinach, 100g' },
  'tomato':          { cal: 18,  protein: 1,  carbs: 4,  fat: 0,   note: 'Tomato, 100g' },
  'onion':           { cal: 40,  protein: 1,  carbs: 9,  fat: 0,   note: 'Onion, 100g' },
  'carrot':          { cal: 41,  protein: 1,  carbs: 10, fat: 0,   note: 'Carrot, 100g' },
  'potato':          { cal: 77,  protein: 2,  carbs: 17, fat: 0,   note: 'Potato, 100g' },
  'sweet potato':    { cal: 86,  protein: 2,  carbs: 20, fat: 0,   note: 'Sweet potato, 100g' },
  'cucumber':        { cal: 15,  protein: 1,  carbs: 4,  fat: 0,   note: 'Cucumber, 100g' },
  'capsicum':        { cal: 31,  protein: 1,  carbs: 6,  fat: 0,   note: 'Capsicum, 100g' },
  'mushroom':        { cal: 22,  protein: 3,  carbs: 3,  fat: 0,   note: 'Mushroom, 100g' },
  'cauliflower':     { cal: 25,  protein: 2,  carbs: 5,  fat: 0,   note: 'Cauliflower, 100g' },
  'cabbage':         { cal: 25,  protein: 1,  carbs: 6,  fat: 0,   note: 'Cabbage, 100g' },
  'beans':           { cal: 31,  protein: 2,  carbs: 7,  fat: 0,   note: 'Green beans, 100g' },
  'peas':            { cal: 81,  protein: 5,  carbs: 14, fat: 0,   note: 'Green peas, 100g' },
  'banana':          { cal: 89,  protein: 1,  carbs: 23, fat: 0,   note: 'Banana, 1 medium' },
  'apple':           { cal: 52,  protein: 0,  carbs: 14, fat: 0,   note: 'Apple, 1 medium' },
  'mango':           { cal: 60,  protein: 1,  carbs: 15, fat: 0,   note: 'Mango, 100g' },
  'orange':          { cal: 47,  protein: 1,  carbs: 12, fat: 0,   note: 'Orange, 1 medium' },
  'grapes':          { cal: 69,  protein: 1,  carbs: 18, fat: 0,   note: 'Grapes, 100g' },
  'watermelon':      { cal: 30,  protein: 1,  carbs: 8,  fat: 0,   note: 'Watermelon, 100g' },
  'strawberry':      { cal: 32,  protein: 1,  carbs: 8,  fat: 0,   note: 'Strawberries, 100g' },
  'papaya':          { cal: 43,  protein: 0,  carbs: 11, fat: 0,   note: 'Papaya, 100g' },
  'pineapple':       { cal: 50,  protein: 1,  carbs: 13, fat: 0,   note: 'Pineapple, 100g' },
  'pomegranate':     { cal: 83,  protein: 2,  carbs: 19, fat: 1,   note: 'Pomegranate, 100g' },
  'guava':           { cal: 68,  protein: 3,  carbs: 14, fat: 1,   note: 'Guava, 100g' },
  'kiwi':            { cal: 61,  protein: 1,  carbs: 15, fat: 1,   note: 'Kiwi, 1 medium' },
  'almonds':         { cal: 579, protein: 21, carbs: 22, fat: 50,  note: 'Almonds, 100g' },
  'peanuts':         { cal: 567, protein: 26, carbs: 16, fat: 49,  note: 'Peanuts, 100g' },
  'peanut butter':   { cal: 588, protein: 25, carbs: 20, fat: 50,  note: 'Peanut butter, 100g' },
  'walnuts':         { cal: 654, protein: 15, carbs: 14, fat: 65,  note: 'Walnuts, 100g' },
  'cashew':          { cal: 553, protein: 18, carbs: 30, fat: 44,  note: 'Cashews, 100g' },
  'olive oil':       { cal: 884, protein: 0,  carbs: 0,  fat: 100, note: 'Olive oil, 100ml' },
  'coconut oil':     { cal: 862, protein: 0,  carbs: 0,  fat: 100, note: 'Coconut oil, 100ml' },
  'avocado':         { cal: 160, protein: 2,  carbs: 9,  fat: 15,  note: 'Avocado, 100g' },
  'sambar':          { cal: 60,  protein: 3,  carbs: 10, fat: 1,   note: 'Sambar, 100ml' },
  'rasam':           { cal: 30,  protein: 1,  carbs: 5,  fat: 1,   note: 'Rasam, 100ml' },
  'coconut chutney': { cal: 180, protein: 2,  carbs: 8,  fat: 16,  note: 'Coconut chutney, 50g' },
  'biryani':         { cal: 290, protein: 12, carbs: 40, fat: 9,   note: 'Chicken biryani, 1 cup' },
  'chole':           { cal: 200, protein: 11, carbs: 30, fat: 5,   note: 'Chole, 1 cup' },
  'rajma':           { cal: 225, protein: 15, carbs: 40, fat: 1,   note: 'Rajma, 1 cup' },
  'palak paneer':    { cal: 280, protein: 14, carbs: 10, fat: 20,  note: 'Palak paneer, 1 cup' },
  'butter chicken':  { cal: 300, protein: 28, carbs: 8,  fat: 18,  note: 'Butter chicken, 1 cup' },
  'masala dosa':     { cal: 206, protein: 5,  carbs: 34, fat: 6,   note: 'Masala dosa, 1 piece' },
  'pongal':          { cal: 220, protein: 6,  carbs: 40, fat: 5,   note: 'Pongal, 1 cup' },
  'uttapam':         { cal: 175, protein: 5,  carbs: 30, fat: 4,   note: 'Uttapam, 1 piece' },
  'appam':           { cal: 120, protein: 3,  carbs: 22, fat: 2,   note: 'Appam, 1 piece' },
  'puttu':           { cal: 210, protein: 4,  carbs: 45, fat: 1,   note: 'Puttu, 1 serving' },
  'parota':          { cal: 260, protein: 5,  carbs: 40, fat: 10,  note: 'Parota, 1 piece' },
  'tea':             { cal: 30,  protein: 0,  carbs: 5,  fat: 1,   note: 'Milk tea, 1 cup' },
  'coffee':          { cal: 30,  protein: 0,  carbs: 5,  fat: 1,   note: 'Coffee with milk, 1 cup' },
  'juice':           { cal: 110, protein: 0,  carbs: 26, fat: 0,   note: 'Fruit juice, 1 glass 250ml' },
  'coconut water':   { cal: 46,  protein: 2,  carbs: 9,  fat: 0,   note: 'Coconut water, 240ml' },
  'protein bar':     { cal: 200, protein: 20, carbs: 22, fat: 7,   note: 'Protein bar, 1 bar' },
  'dark chocolate':  { cal: 546, protein: 5,  carbs: 60, fat: 31,  note: 'Dark chocolate, 100g' },
  'honey':           { cal: 304, protein: 0,  carbs: 82, fat: 0,   note: 'Honey, 100g' },
  'salad':           { cal: 20,  protein: 1,  carbs: 4,  fat: 0,   note: 'Mixed salad, 100g' },
  'soup':            { cal: 50,  protein: 2,  carbs: 8,  fat: 1,   note: 'Vegetable soup, 1 bowl' },
  'sandwich':        { cal: 250, protein: 10, carbs: 35, fat: 8,   note: 'Veg sandwich, 1 piece' },
  'pizza':           { cal: 266, protein: 11, carbs: 33, fat: 10,  note: 'Pizza slice, 1 piece' },
  'burger':          { cal: 354, protein: 17, carbs: 40, fat: 14,  note: 'Burger, 1 piece' },
  'corn':            { cal: 86,  protein: 3,  carbs: 19, fat: 1,   note: 'Sweet corn, 100g' },
};

let activeMealIndex = null;
let aiNutritionData = null;

window.addEventListener('DOMContentLoaded', () => {
  setupNav(); setupWater(); buildMeals(); updateAllStats(); setDate(); checkOnLoadDebt();
});

function checkOnLoadDebt() {
  const debt = JSON.parse(localStorage.getItem('fitai_caldebt') || 'null');
  if (!debt) return;
  const dayDiff = Math.floor((new Date(new Date().toDateString()) - new Date(debt.date)) / 86400000);
  if (dayDiff >= 1 && dayDiff <= debt.splitDays) {
    showInAppBanner(`⚠️ Calorie debt active! Today's target reduced by ${debt.perDay} kcal to balance overeating on ${debt.date}.`, 'warning', null, 9000);
  } else if (dayDiff > debt.splitDays) { clearCalorieDebt(); }
}

function setDate() {
  const opts = { weekday: 'long', month: 'long', day: 'numeric' };
  document.getElementById('navDate').textContent = new Date().toLocaleDateString('en-US', opts).toUpperCase();
}

function setupNav() {
  const name = STATE.user.name || 'User';
  document.getElementById('navUser').textContent   = name.toUpperCase();
  document.getElementById('navAvatar').textContent = name.charAt(0).toUpperCase();
}

function setupWater() { document.getElementById('waterGoal').textContent = STATE.waterGoal; renderWater(); }
function renderWater() {
  document.getElementById('waterCount').textContent = STATE.water;
  const wrap = document.getElementById('waterGlasses'); wrap.innerHTML = '';
  for (let i = 0; i < STATE.waterGoal; i++) {
    const g = document.createElement('div');
    g.className = 'water-glass' + (i < STATE.water ? ' filled' : '');
    g.innerHTML = i < STATE.water ? '💧' : ''; g.style.fontSize = '12px';
    g.onclick = () => { STATE.water = (i < STATE.water) ? i : i + 1; localStorage.setItem('fitai_water', STATE.water); renderWater(); };
    wrap.appendChild(g);
  }
}
function addWater() {
  if (STATE.water < STATE.waterGoal) { STATE.water++; localStorage.setItem('fitai_water', STATE.water); renderWater(); }
}

function changeMealCount(delta) {
  const newCount = Math.min(6, Math.max(2, STATE.mealCount + delta));
  if (newCount === STATE.mealCount) return;
  STATE.mealCount = newCount; STATE.meals = null;
  localStorage.setItem('fitai_mealcount', newCount); localStorage.removeItem('fitai_meals');
  document.getElementById('mcgVal').textContent   = newCount;
  document.getElementById('mscTitle').textContent = `${newCount} MEALS / DAY`;
  buildMeals(); updateAllStats();
}

function buildMeals() {
  document.getElementById('mcgVal').textContent   = STATE.mealCount;
  document.getElementById('mscTitle').textContent = `${STATE.mealCount} MEALS / DAY`;
  const templates = MEAL_TEMPLATES[STATE.mealCount];
  const totalCal  = STATE.targets.calories;
  if (!STATE.meals || STATE.meals.length !== STATE.mealCount) {
    STATE.meals = templates.map(t => ({ name: t.name, time: t.time, icon: t.icon, target: Math.round(totalCal * t.ratio), foods: [] }));
    localStorage.setItem('fitai_meals', JSON.stringify(STATE.meals));
  }
  renderMeals();
}

function renderMeals() {
  const grid = document.getElementById('mealsGrid');
  grid.innerHTML = '';
  STATE.meals.forEach((meal, idx) => {
    const eaten      = meal.foods.reduce((s, f) => s + (f.cal * f.qty), 0);
    const pct        = Math.min(100, Math.round((eaten / meal.target) * 100));
    const isOverMeal = eaten > meal.target;
    const adjustedBadge = meal.adjusted
      ? `<span style="font-size:9px;color:#eab308;letter-spacing:1px;background:rgba(234,179,8,0.1);padding:2px 6px;border-radius:2px;border:1px solid rgba(234,179,8,0.2);margin-left:6px;">⚡ ADJUSTED</span>` : '';
    let foodsHTML = meal.foods.length === 0
      ? `<div class="meal-empty">NO FOODS LOGGED YET</div>`
      : meal.foods.map((f, fi) => `
          <div class="food-item">
            <span class="food-item-name">${f.name}</span>
            <span class="food-item-cal">${f.cal * f.qty} kcal</span>
            <button class="food-item-del" onclick="deleteFood(${idx}, ${fi})">✕</button>
          </div>`).join('');
    const card = document.createElement('div');
    card.className = 'meal-card';
    card.style.animationDelay = (idx * 0.07) + 's';
    card.innerHTML = `
      <div class="meal-card-header">
        <div class="meal-card-left">
          <div class="meal-icon">${meal.icon}</div>
          <div>
            <div class="meal-name">${meal.name}${adjustedBadge}</div>
            <div class="meal-time">${meal.time}</div>
          </div>
        </div>
        <div class="meal-card-right">
          <div class="meal-cal-eaten" style="color:${isOverMeal ? '#ff4444' : ''}">${eaten}</div>
          <div class="meal-cal-total">/ ${meal.target} KCAL</div>
        </div>
      </div>
      <div class="meal-progress-bar">
        <div class="meal-progress-fill" style="width:${pct}%;background:${isOverMeal ? '#ff4444' : 'var(--red)'}"></div>
      </div>
      <div class="meal-foods">${foodsHTML}</div>
      <button class="meal-add-btn" onclick="openModal(${idx})"
        style="${isOverMeal ? 'border-color:rgba(255,68,68,0.4);color:#ff4444;' : ''}">
        ${isOverMeal ? '⚠ OVER TARGET — ADD MORE?' : '+ ADD FOOD'}
      </button>`;
    grid.appendChild(card);
  });
}

function openModal(mealIdx) {
  activeMealIndex = mealIdx; aiNutritionData = null;
  document.getElementById('modalMealName').textContent = STATE.meals[mealIdx].name;
  document.getElementById('foodName').value = ''; document.getElementById('foodQty').value = '';
  document.getElementById('aiResultPreview').style.display = 'none';
  document.getElementById('aiCalculating').style.display   = 'none';
  document.getElementById('aiError').style.display         = 'none';
  document.getElementById('modalAddBtn').style.display     = 'none';
  document.getElementById('modalCalcBtn').innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> CALCULATE NUTRITION';
  document.getElementById('modalCalcBtn').disabled = false;
  document.getElementById('modalOverlay').classList.add('show');
  document.getElementById('modal').classList.add('show');
  setTimeout(() => document.getElementById('foodName').focus(), 200);
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('show');
  document.getElementById('modal').classList.remove('show');
  activeMealIndex = null; aiNutritionData = null;
}

function calculateWithAI() {
  const name = document.getElementById('foodName').value.trim().toLowerCase();
  const qty  = document.getElementById('foodQty').value.trim().toLowerCase();
  if (!name) {
    document.getElementById('aiError').textContent = '⚠ Please enter a food name.';
    document.getElementById('aiError').style.display = 'block';
    document.getElementById('foodName').style.borderColor = 'rgba(232,0,13,0.6)';
    setTimeout(() => document.getElementById('foodName').style.borderColor = '', 1500); return;
  }
  document.getElementById('aiError').style.display         = 'none';
  document.getElementById('aiResultPreview').style.display = 'none';
  document.getElementById('aiCalculating').style.display   = 'flex';
  document.getElementById('modalCalcBtn').disabled         = true;
  document.getElementById('modalAddBtn').style.display     = 'none';
  setTimeout(() => {
    let match = null;
    for (const key of Object.keys(FOOD_DB)) { if (name === key) { match = FOOD_DB[key]; break; } }
    if (!match) { for (const key of Object.keys(FOOD_DB)) { if (name.includes(key)) { match = FOOD_DB[key]; break; } } }
    if (!match) { for (const key of Object.keys(FOOD_DB)) { if (key.includes(name)) { match = FOOD_DB[key]; break; } } }
    if (!match) { const words = name.split(' '); for (const key of Object.keys(FOOD_DB)) { if (words.some(w => w.length > 2 && key.includes(w))) { match = FOOD_DB[key]; break; } } }
    if (!match) {
      document.getElementById('aiCalculating').style.display = 'none';
      document.getElementById('aiError').textContent = `⚠ "${document.getElementById('foodName').value}" not found. Try: chicken, rice, egg, dal, idli, banana, paneer...`;
      document.getElementById('aiError').style.display = 'block';
      document.getElementById('modalCalcBtn').disabled = false; return;
    }
    let multiplier = 1;
    if (qty) {
      const num = parseFloat(qty);
      if (!isNaN(num)) {
        if      (qty.includes('kg'))                                                     multiplier = num * 10;
        else if (qty.includes('g') || qty.includes('gram'))                              multiplier = num / 100;
        else if (qty.includes('ml') || qty.includes('l'))                                multiplier = num / 100;
        else if (qty.includes('tbsp') || qty.includes('tablespoon'))                     multiplier = num * 0.15;
        else if (qty.includes('tsp')  || qty.includes('teaspoon'))                       multiplier = num * 0.05;
        else if (qty.includes('cup'))                                                    multiplier = num * 1;
        else if (qty.includes('bowl'))                                                   multiplier = num * 1.5;
        else if (qty.includes('scoop'))                                                  multiplier = num * 1;
        else if (qty.includes('slice') || qty.includes('piece') || qty.includes('pc'))  multiplier = num * 1;
        else                                                                             multiplier = num;
      }
    }
    multiplier = Math.max(0.1, multiplier);
    const result = {
      calories: Math.round(match.cal * multiplier), protein: Math.round(match.protein * multiplier),
      carbs: Math.round(match.carbs * multiplier),  fat: Math.round(match.fat * multiplier),
      serving_note: match.note + (qty ? ` · qty: ${qty}` : ''),
    };
    aiNutritionData = result;
    document.getElementById('aiCal').textContent     = result.calories;
    document.getElementById('aiProtein').textContent = result.protein + 'g';
    document.getElementById('aiCarbs').textContent   = result.carbs   + 'g';
    document.getElementById('aiFat').textContent     = result.fat     + 'g';
    document.getElementById('aiNote').textContent    = result.serving_note;
    document.getElementById('aiCalculating').style.display   = 'none';
    document.getElementById('aiResultPreview').style.display = 'flex';
    document.getElementById('modalAddBtn').style.display     = 'inline-flex';
    document.getElementById('modalCalcBtn').innerHTML        = '↺ RECALCULATE';
    document.getElementById('modalCalcBtn').disabled         = false;
  }, 500);
}

function logFood() {
  if (!aiNutritionData) return;
  const name = document.getElementById('foodName').value.trim();
  const qty  = document.getElementById('foodQty').value.trim() || '1 serving';
  STATE.meals[activeMealIndex].foods.push({
    name: `${name} (${qty})`, cal: aiNutritionData.calories, qty: 1,
    protein: aiNutritionData.protein, carbs: aiNutritionData.carbs, fat: aiNutritionData.fat,
  });
  localStorage.setItem('fitai_meals', JSON.stringify(STATE.meals));
  closeModal(); renderMeals(); updateAllStats(); checkAndBalanceCalories(); aiNutritionData = null;
}

function deleteFood(mealIdx, foodIdx) {
  STATE.meals[mealIdx].foods.splice(foodIdx, 1);
  localStorage.setItem('fitai_meals', JSON.stringify(STATE.meals));
  renderMeals(); updateAllStats(); checkAndBalanceCalories();
}

function updateAllStats() {
  const target   = getAdjustedTarget();
  const consumed = STATE.meals ? STATE.meals.reduce((s, m) => s + m.foods.reduce((ms, f) => ms + (f.cal * f.qty), 0), 0) : 0;
  const remaining = target - consumed;
  const isOver    = consumed > target;

  // Ring: capped at 100%, red on overflow
  const ringPct = Math.min(1, consumed / target);
  const offset  = 415 - (ringPct * 415);
  document.getElementById('ringFill').style.strokeDashoffset = offset;
  document.getElementById('ringFill').style.stroke           = isOver ? '#ff4444' : 'var(--red)';
  document.getElementById('ringConsumed').textContent        = consumed;
  document.getElementById('ringTotal').textContent           = target;

  const remEl = document.getElementById('statRemaining');
  remEl.textContent = isOver ? '+' + (consumed - target) + ' OVER' : remaining;
  document.getElementById('ringConsumed').classList.toggle('over', isOver);
  remEl.classList.toggle('over', isOver);

  const eatP = STATE.meals ? STATE.meals.reduce((s,m) => s + m.foods.reduce((ms,f) => ms + (f.protein*f.qty), 0), 0) : 0;
  const eatC = STATE.meals ? STATE.meals.reduce((s,m) => s + m.foods.reduce((ms,f) => ms + (f.carbs*f.qty),   0), 0) : 0;
  const eatF = STATE.meals ? STATE.meals.reduce((s,m) => s + m.foods.reduce((ms,f) => ms + (f.fat*f.qty),     0), 0) : 0;
  document.getElementById('mp-eaten').textContent = Math.round(eatP);
  document.getElementById('mp-total').textContent = STATE.targets.protein;
  document.getElementById('mc-eaten').textContent = Math.round(eatC);
  document.getElementById('mc-total').textContent = STATE.targets.carbs;
  document.getElementById('mf-eaten').textContent = Math.round(eatF);
  document.getElementById('mf-total').textContent = STATE.targets.fat;
  document.getElementById('mpBar').style.width = Math.min(100, (eatP / STATE.targets.protein) * 100) + '%';
  document.getElementById('mcBar').style.width = Math.min(100, (eatC / STATE.targets.carbs)   * 100) + '%';
  document.getElementById('mfBar').style.width = Math.min(100, (eatF / STATE.targets.fat)     * 100) + '%';
  updateRecommendations(remaining);
}

function updateRecommendations(remaining) {
  document.getElementById('recBudgetVal').textContent = Math.max(0, remaining);
  const container = document.getElementById('recMeals');
  if (remaining <= 0) { container.innerHTML = `<div class="rec-empty">🎯 YOU'VE HIT YOUR CALORIE TARGET FOR TODAY!</div>`; return; }
  const suitable = MEAL_DB.filter(m => m.cal <= remaining + 50).sort((a,b) => b.cal - a.cal).slice(0,6);
  if (!suitable.length) { container.innerHTML = `<div class="rec-empty">BUDGET TOO LOW — TRY A LIGHT SNACK</div>`; return; }
  container.innerHTML = suitable.map(m => `
    <div class="rec-meal-item" onclick="quickAddRec('${m.name}',${m.cal},${m.protein},${m.carbs},${m.fat})">
      <div class="rec-meal-name">${m.name}</div>
      <div class="rec-meal-cal">${m.cal} <span style="font-size:12px;color:#444">KCAL</span></div>
      <div class="rec-meal-macros">P: ${m.protein}g · C: ${m.carbs}g · F: ${m.fat}g</div>
      <span class="rec-meal-tag">${m.tag}</span>
    </div>`).join('');
}

function quickAddRec(name, cal, protein, carbs, fat) {
  let bestIdx = 0, bestRem = -Infinity;
  STATE.meals.forEach((m, i) => { const eaten = m.foods.reduce((s,f) => s + (f.cal*f.qty), 0); if (m.target - eaten > bestRem) { bestRem = m.target - eaten; bestIdx = i; } });
  STATE.meals[bestIdx].foods.push({ name, cal, qty: 1, protein, carbs, fat });
  localStorage.setItem('fitai_meals', JSON.stringify(STATE.meals));
  renderMeals(); updateAllStats(); checkAndBalanceCalories();
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeModal(); closeTextract(); }
  if (e.key === 'Enter' && document.getElementById('modal').classList.contains('show') && aiNutritionData) logFood();
});

/* ════ SMART CALORIE BALANCE SYSTEM ════ */
function checkAndBalanceCalories() {
  const today    = new Date().toDateString();
  const target   = STATE.targets.calories;
  const consumed = STATE.meals ? STATE.meals.reduce((s, m) => s + m.foods.reduce((ms, f) => ms + (f.cal * f.qty), 0), 0) : 0;
  const over = consumed - target;
  if (over <= 0) {
    const debt = JSON.parse(localStorage.getItem('fitai_caldebt') || 'null');
    if (debt && debt.date === today) clearCalorieDebt();
    return;
  }
  const splitDays = over > 300 ? 3 : 2;
  const perDay    = Math.round(over / splitDays);
  localStorage.setItem('fitai_caldebt', JSON.stringify({ date: today, overCal: over, splitDays, perDay }));
  showCalorieDebtBanner(over, perDay, splitDays);
}

function clearCalorieDebt() { localStorage.removeItem('fitai_caldebt'); }

function getAdjustedTarget() {
  const debt = JSON.parse(localStorage.getItem('fitai_caldebt') || 'null');
  const baseTarget = STATE.targets.calories;
  if (!debt) return baseTarget;
  const dayDiff = Math.floor((new Date(new Date().toDateString()) - new Date(debt.date)) / 86400000);
  if (dayDiff >= 1 && dayDiff <= debt.splitDays) return Math.max(1200, baseTarget - debt.perDay);
  if (dayDiff > debt.splitDays) clearCalorieDebt();
  return baseTarget;
}

function showCalorieDebtBanner(overCal, perDay, days) {
  const existing = document.getElementById('debt-banner');
  if (existing) existing.remove();
  if (!document.getElementById('banner-style')) {
    const s = document.createElement('style'); s.id = 'banner-style';
    s.textContent = `@keyframes bannerSlide{from{opacity:0;transform:translateX(120%)}to{opacity:1;transform:translateX(0)}}@keyframes bannerFade{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(120%)}}`;
    document.head.appendChild(s);
  }
  const banner = document.createElement('div');
  banner.id = 'debt-banner';
  banner.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:9999;width:340px;background:#0d0d0d;border:1px solid rgba(232,0,13,0.3);border-left:3px solid #E8000D;border-radius:4px;padding:16px 18px;box-shadow:0 8px 32px rgba(0,0,0,0.7);font-family:'Barlow',sans-serif;animation:bannerSlide 0.35s cubic-bezier(0.4,0,0.2,1) forwards;`;
  const dayCards = Array.from({length: days}, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i + 1);
    const label = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
    return `<div style="background:rgba(232,0,13,0.06);border:1px solid rgba(232,0,13,0.15);border-radius:2px;padding:8px;text-align:center;"><div style="font-size:9px;color:#333;letter-spacing:1px;margin-bottom:4px;">${label}</div><div style="font-family:'Bebas Neue',sans-serif;font-size:15px;color:#E8000D;">${STATE.targets.calories - perDay} KCAL</div></div>`;
  }).join('');
  banner.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
      <div style="font-family:'Bebas Neue',sans-serif;font-size:16px;color:#E8000D;letter-spacing:3px;">⚠️ CALORIE OVERFLOW DETECTED</div>
      <button onclick="document.getElementById('debt-banner').remove()" style="background:none;border:none;color:#333;font-size:16px;cursor:pointer;">✕</button>
    </div>
    <div style="font-size:13px;color:#666;line-height:1.7;margin-bottom:12px;">You exceeded today's target by <span style="color:#E8000D;font-weight:700;">${overCal} kcal</span>. Balancing over next <span style="color:#E8000D;font-weight:700;">${days} days</span>.</div>
    <div style="background:#111;border:1px solid #1a1a1a;border-radius:2px;padding:12px;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="font-size:10px;color:#333;letter-spacing:2px;font-weight:700;">TODAY OVER</span><span style="font-family:'Bebas Neue',sans-serif;font-size:16px;color:#ef4444;">+${overCal} KCAL</span></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="font-size:10px;color:#333;letter-spacing:2px;font-weight:700;">DEDUCTION / DAY</span><span style="font-family:'Bebas Neue',sans-serif;font-size:16px;color:#eab308;">−${perDay} KCAL</span></div>
      <div style="display:flex;justify-content:space-between;"><span style="font-size:10px;color:#333;letter-spacing:2px;font-weight:700;">BALANCE DAYS</span><span style="font-family:'Bebas Neue',sans-serif;font-size:16px;color:#E8000D;">NEXT ${days} DAYS</span></div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(${days},1fr);gap:6px;">${dayCards}</div>`;
  document.body.appendChild(banner);
  setTimeout(() => {
    const el = document.getElementById('debt-banner');
    if (el) { el.style.transition='opacity 0.4s,transform 0.4s'; el.style.opacity='0'; el.style.transform='translateX(120%)'; setTimeout(()=>el.remove(),400); }
  }, 10000);
}

/* ════ IN-APP BANNER ════ */
let bannerTimeout = null;
function showInAppBanner(message, type='info', mealName=null, duration=5000) {
  const existing = document.getElementById('fitai-banner');
  if (existing) existing.remove();
  if (bannerTimeout) clearTimeout(bannerTimeout);
  if (!document.getElementById('banner-style')) {
    const s = document.createElement('style'); s.id='banner-style';
    s.textContent=`@keyframes bannerSlide{from{opacity:0;transform:translateX(120%)}to{opacity:1;transform:translateX(0)}}@keyframes bannerFade{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(120%)}}`;
    document.head.appendChild(s);
  }
  const colors = { info:{border:'rgba(232,0,13,0.3)',text:'#E8000D'}, success:{border:'rgba(34,197,94,0.3)',text:'#22c55e'}, warning:{border:'rgba(234,179,8,0.3)',text:'#eab308'}, danger:{border:'rgba(239,68,68,0.3)',text:'#ef4444'} };
  const c = colors[type] || colors.info;
  const banner = document.createElement('div');
  banner.id = 'fitai-banner';
  banner.style.cssText = `position:fixed;top:68px;right:20px;z-index:9999;background:#0d0d0d;border:1px solid ${c.border};border-left:3px solid ${c.text};border-radius:4px;padding:14px 18px;max-width:360px;display:flex;align-items:flex-start;gap:12px;box-shadow:0 8px 32px rgba(0,0,0,0.6);animation:bannerSlide 0.35s cubic-bezier(0.4,0,0.2,1) forwards;font-family:'Barlow',sans-serif;`;
  const logBtn = mealName ? `<button onclick="quickLogFromBanner('${mealName}')" style="margin-top:8px;height:28px;padding:0 12px;background:${c.text};border:none;border-radius:2px;color:white;font-family:'Bebas Neue',sans-serif;font-size:11px;letter-spacing:2px;cursor:pointer;">LOG NOW</button>` : '';
  banner.innerHTML = `<div style="flex:1"><div style="font-size:12px;color:${c.text};font-weight:700;letter-spacing:1px;margin-bottom:4px;">FITAI ALERT</div><div style="font-size:13px;color:#888;line-height:1.5;">${message}</div>${logBtn}</div><button onclick="this.parentElement.remove()" style="background:none;border:none;color:#333;font-size:16px;cursor:pointer;flex-shrink:0;margin-top:-2px;">✕</button>`;
  document.body.appendChild(banner);
  bannerTimeout = setTimeout(() => { if (banner.parentElement) { banner.style.animation='bannerFade 0.3s ease forwards'; setTimeout(()=>banner.remove(),300); } }, duration);
}

function quickLogFromBanner(mealName) {
  const idx = STATE.meals && STATE.meals.findIndex(m => m.name === mealName);
  if (idx >= 0) { document.getElementById('fitai-banner')?.remove(); openModal(idx); }
}

/* ════ TEXTRACT ════ */
let txSelectedFile=null, txSelectedImage=null;
let txScanHistory = JSON.parse(localStorage.getItem('fitai_scanhistory')) || [];

function openTextract() { populateMealSelect(); renderHistory(); document.getElementById('txOverlay').classList.add('show'); document.getElementById('txModal').classList.add('show'); }
function closeTextract() { document.getElementById('txOverlay').classList.remove('show'); document.getElementById('txModal').classList.remove('show'); }

function switchTab(tab) {
  document.getElementById('tabScan').style.display    = tab==='scan'    ? 'flex' : 'none';
  document.getElementById('tabHistory').style.display = tab==='history' ? 'flex' : 'none';
  document.querySelectorAll('.tx-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-'+tab).classList.add('active');
  if (tab==='history') renderHistory();
}

function handleFileSelect(e) { const file=e.target.files[0]; if(file) loadFile(file); }
function handleDragOver(e)   { e.preventDefault(); document.getElementById('txUploadZone').classList.add('dragover'); }
function handleDragLeave(e)  { document.getElementById('txUploadZone').classList.remove('dragover'); }
function handleDrop(e) {
  e.preventDefault(); document.getElementById('txUploadZone').classList.remove('dragover');
  const file=e.dataTransfer.files[0]; if(file && file.type.startsWith('image/')) loadFile(file);
}
function openCamera() { document.getElementById('txCameraInput').click(); }

function loadFile(file) {
  txSelectedFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    txSelectedImage = e.target.result;
    const preview = document.getElementById('txPreviewImg');
    preview.src = txSelectedImage; preview.style.display='block';
    document.getElementById('txUploadIcon').style.display='none';
    document.getElementById('txUploadText').style.display='none';
    document.getElementById('txScanBtn').disabled=false;
    document.getElementById('txScanText').textContent='SCAN LABEL';
    document.getElementById('txResults').style.display='none';
  };
  reader.readAsDataURL(file);
}

function scanImage() {
  if (!txSelectedImage) return;
  document.getElementById('txScanText').style.display='none';
  document.getElementById('txScanDots').style.display='flex';
  document.getElementById('txScanBtn').disabled=true;
  setTimeout(() => {
    ['txFoodName','txCalories','txProtein','txCarbs','txFat'].forEach(id => document.getElementById(id).value='');
    document.getElementById('txResults').style.display='flex';
    document.getElementById('txScanText').style.display='inline';
    document.getElementById('txScanText').textContent='RE-SCAN';
    document.getElementById('txScanDots').style.display='none';
    document.getElementById('txScanBtn').disabled=false;
  }, 800);
}

function populateMealSelect() {
  const sel = document.getElementById('txMealSelect'); sel.innerHTML='';
  if (!STATE.meals) return;
  STATE.meals.forEach((meal,idx) => { const opt=document.createElement('option'); opt.value=idx; opt.textContent=meal.name+' ('+meal.time+')'; sel.appendChild(opt); });
}

function addToTracker() {
  const name    = document.getElementById('txFoodName').value.trim() || 'Scanned Food';
  const cal     = parseFloat(document.getElementById('txCalories').value) || 0;
  const protein = parseFloat(document.getElementById('txProtein').value)  || 0;
  const carbs   = parseFloat(document.getElementById('txCarbs').value)    || 0;
  const fat     = parseFloat(document.getElementById('txFat').value)      || 0;
  const mealIdx = parseInt(document.getElementById('txMealSelect').value) || 0;
  if (!STATE.meals || !STATE.meals[mealIdx]) return;
  STATE.meals[mealIdx].foods.push({ name, cal, qty:1, protein, carbs, fat });
  localStorage.setItem('fitai_meals', JSON.stringify(STATE.meals));
  const historyItem = { id:Date.now(), name, cal, protein, carbs, fat, image:txSelectedImage,
    time:new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}),
    date:new Date().toLocaleDateString('en-US',{month:'short',day:'numeric'}),
    meal:STATE.meals[mealIdx].name };
  txScanHistory.unshift(historyItem);
  if (txScanHistory.length>20) txScanHistory.pop();
  localStorage.setItem('fitai_scanhistory', JSON.stringify(txScanHistory));
  renderMeals(); updateAllStats(); checkAndBalanceCalories(); closeTextract(); resetScan();
}

function resetScan() {
  txSelectedFile=null; txSelectedImage=null;
  document.getElementById('txPreviewImg').style.display='none';
  document.getElementById('txUploadIcon').style.display='block';
  document.getElementById('txUploadText').style.display='block';
  document.getElementById('txResults').style.display='none';
  document.getElementById('txScanBtn').disabled=true;
  document.getElementById('txScanText').textContent='SELECT IMAGE TO SCAN';
  document.getElementById('txFileInput').value='';
}

function renderHistory() {
  const list = document.getElementById('txHistoryList');
  if (txScanHistory.length===0) { list.innerHTML=`<div class="tx-history-empty">NO SCAN HISTORY YET<br><span style="font-size:10px;color:#1a1a1a">Scan a food label to see it here</span></div>`; return; }
  list.innerHTML = txScanHistory.map(item => `
    <div class="tx-history-item">
      ${item.image ? `<img class="tx-history-img" src="${item.image}" alt="food"/>` : `<div class="tx-history-img" style="background:#111;display:flex;align-items:center;justify-content:center;color:#222">📷</div>`}
      <div class="tx-history-info">
        <div class="tx-history-name">${item.name}</div>
        <div class="tx-history-cal">${item.cal} <span style="font-size:10px;color:#444">KCAL</span></div>
        <div class="tx-history-macros">P: ${item.protein}g · C: ${item.carbs}g · F: ${item.fat}g</div>
      </div>
      <div style="text-align:right">
        <div class="tx-history-time">${item.date}</div>
        <div class="tx-history-time">${item.time}</div>
        <div style="font-size:9px;color:#222;margin-top:4px;letter-spacing:1px">${item.meal}</div>
      </div>
    </div>`).join('');
}

document.addEventListener('paste', e => {
  if (!document.getElementById('txModal').classList.contains('show')) return;
  const items = e.clipboardData.items;
  for (let item of items) { if (item.type.startsWith('image/')) { loadFile(item.getAsFile()); break; } }
});

/* ════ FOOD SEARCH SUGGESTIONS ════ */
let selectedSuggestionIdx = -1;

function showFoodSuggestions(query) {
  const box = document.getElementById('foodSuggestions');
  const q   = query.trim().toLowerCase();
  document.getElementById('aiResultPreview').style.display='none';
  document.getElementById('aiError').style.display='none';
  document.getElementById('modalAddBtn').style.display='none';
  aiNutritionData=null; selectedSuggestionIdx=-1;
  if (q.length<1) { box.classList.remove('show'); box.innerHTML=''; return; }
  const results = Object.entries(FOOD_DB).filter(([key])=>key.includes(q)||q.includes(key.split(' ')[0])).slice(0,8);
  if (results.length===0) { box.innerHTML=`<div class="sug-empty">NO MATCH — try: chicken, rice, idli, egg...</div>`; box.classList.add('show'); return; }
  box.innerHTML = results.map(([key,val],i) => {
    const highlighted = key.replace(new RegExp(`(${q})`,'gi'),'<span>$1</span>');
    return `<div class="suggestion-item" id="sug-${i}" onclick="selectSuggestion('${key}')" onmouseenter="highlightSuggestion(${i})"><div class="sug-left"><div class="sug-name">${highlighted}</div><div class="sug-note">${val.note}</div></div><div class="sug-cal">${val.cal}<span style="font-size:9px;color:#444"> KCAL</span></div></div>`;
  }).join('');
  box.classList.add('show');
}

function highlightSuggestion(idx) {
  document.querySelectorAll('.suggestion-item').forEach(el=>el.classList.remove('active'));
  const el=document.getElementById('sug-'+idx);
  if(el){el.classList.add('active');selectedSuggestionIdx=idx;}
}

function handleSuggestionKey(e) {
  const items=document.querySelectorAll('.suggestion-item'); if(!items.length) return;
  if(e.key==='ArrowDown'){e.preventDefault();selectedSuggestionIdx=Math.min(selectedSuggestionIdx+1,items.length-1);items.forEach(el=>el.classList.remove('active'));items[selectedSuggestionIdx].classList.add('active');items[selectedSuggestionIdx].scrollIntoView({block:'nearest'});}
  else if(e.key==='ArrowUp'){e.preventDefault();selectedSuggestionIdx=Math.max(selectedSuggestionIdx-1,0);items.forEach(el=>el.classList.remove('active'));items[selectedSuggestionIdx].classList.add('active');items[selectedSuggestionIdx].scrollIntoView({block:'nearest'});}
  else if(e.key==='Enter'&&selectedSuggestionIdx>=0){e.preventDefault();const activeEl=document.querySelector('.suggestion-item.active');if(activeEl)activeEl.click();}
  else if(e.key==='Escape'){hideSuggestions();}
}

function selectSuggestion(key) {
  const food=FOOD_DB[key]; if(!food) return;
  document.getElementById('foodName').value=key;
  hideSuggestions();
  aiNutritionData={calories:food.cal,protein:food.protein,carbs:food.carbs,fat:food.fat,serving_note:food.note};
  document.getElementById('aiCal').textContent=food.cal;
  document.getElementById('aiProtein').textContent=food.protein+'g';
  document.getElementById('aiCarbs').textContent=food.carbs+'g';
  document.getElementById('aiFat').textContent=food.fat+'g';
  document.getElementById('aiNote').textContent=food.note;
  document.getElementById('aiResultPreview').style.display='flex';
  document.getElementById('modalAddBtn').style.display='inline-flex';
  document.getElementById('modalCalcBtn').innerHTML='↺ RECALCULATE';
  document.getElementById('aiError').style.display='none';
  setTimeout(()=>document.getElementById('foodQty').focus(),100);
}

function hideSuggestions() {
  const box=document.getElementById('foodSuggestions');
  box.classList.remove('show'); box.innerHTML=''; selectedSuggestionIdx=-1;
}

document.addEventListener('click', e => {
  if(!e.target.closest('#foodName')&&!e.target.closest('#foodSuggestions')) hideSuggestions();
});