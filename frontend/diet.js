const STATE = {
  user:     JSON.parse(localStorage.getItem('fitai_user'))     || { name: 'User', goal: 'maintain' },
  targets:  JSON.parse(localStorage.getItem('fitai_targets'))  || { calories: 2000, protein: 150, carbs: 225, fat: 56 },
  plan:     JSON.parse(localStorage.getItem('fitai_dietplan')) || {},
  dietType: 'all',
  mealSize: 'balanced',
};

const MEAL_DB = {
  breakfast: [
    { id:'b1', name:'Masala Oats Bowl', type:'veg', cal:280, protein:9, carbs:48, fat:6, prepTime:'10 min', servings:1,
      ingredients:['1 cup rolled oats','1 medium onion (chopped)','1 tomato (chopped)','1 green chilli','1/2 tsp cumin seeds','1/4 tsp turmeric','Salt to taste','2 cups water','Fresh coriander'],
      steps:['Heat oil in a pan, add cumin seeds and let them splutter.','Add chopped onion and green chilli, sauté until golden.','Add tomato and cook until soft. Add turmeric and salt.','Pour in water and bring to a boil.','Add oats and stir continuously for 3-4 minutes until thick.','Garnish with fresh coriander and serve hot.'] },
    { id:'b2', name:'Egg White Veggie Omelette', type:'nonveg', cal:180, protein:22, carbs:6, fat:7, prepTime:'8 min', servings:1,
      ingredients:['4 egg whites','1/2 cup mixed vegetables (capsicum, mushroom, onion)','1 tsp olive oil','Salt & pepper','Fresh herbs'],
      steps:['Whisk egg whites with salt and pepper until frothy.','Heat oil in a non-stick pan over medium heat.','Sauté vegetables for 2 minutes until slightly tender.','Pour egg whites over vegetables.','Cook until edges set, then fold gently. Serve immediately.'] },
    { id:'b3', name:'Greek Yogurt Parfait', type:'veg', cal:220, protein:18, carbs:28, fat:4, prepTime:'5 min', servings:1,
      ingredients:['200g low-fat Greek yogurt','1/2 cup mixed berries','2 tbsp granola','1 tsp honey','1 tbsp chia seeds'],
      steps:['Layer Greek yogurt in a bowl or glass.','Add mixed berries on top.','Sprinkle granola and chia seeds.','Drizzle honey and serve chilled.'] },
    { id:'b4', name:'Avocado Toast with Eggs', type:'nonveg', cal:340, protein:16, carbs:28, fat:18, prepTime:'10 min', servings:1,
      ingredients:['2 slices whole wheat bread','1/2 ripe avocado','2 eggs','Lemon juice','Red chilli flakes','Salt & pepper'],
      steps:['Toast bread slices until golden and crispy.','Mash avocado with lemon juice, salt, and pepper.','Poach or fry eggs to your preference.','Spread avocado on toast, top with eggs.','Sprinkle chilli flakes and serve.'] },
    { id:'b5', name:'Banana Peanut Butter Smoothie', type:'vegan', cal:310, protein:12, carbs:44, fat:10, prepTime:'5 min', servings:1,
      ingredients:['2 ripe bananas','2 tbsp peanut butter','1 cup almond milk','1 tbsp flax seeds','1/2 tsp cinnamon','Ice cubes'],
      steps:['Add all ingredients to a blender.','Blend on high for 60 seconds until smooth and creamy.','Add more almond milk if too thick.','Pour into a glass and serve immediately.'] },
    { id:'b6', name:'Idli with Sambar', type:'vegan', cal:260, protein:8, carbs:50, fat:3, prepTime:'20 min', servings:1,
      ingredients:['4 steamed idlis','1 cup sambar','2 tbsp coconut chutney','Curry leaves','Mustard seeds'],
      steps:['Steam idlis fresh or reheat for 3 minutes.','Heat sambar with tempering of mustard seeds and curry leaves.','Serve idlis with hot sambar and coconut chutney.'] },
  ],
  lunch: [
    { id:'l1', name:'Grilled Chicken Rice Bowl', type:'nonveg', cal:480, protein:38, carbs:52, fat:10, prepTime:'25 min', servings:1,
      ingredients:['150g chicken breast','1 cup cooked brown rice','1/2 cup steamed broccoli','1/2 cup cherry tomatoes','2 tbsp Greek yogurt dressing','Garlic powder, paprika, salt'],
      steps:['Marinate chicken with garlic powder, paprika, salt for 15 mins.','Grill chicken on medium-high for 6-7 minutes each side.','Let rest for 5 minutes then slice.','Arrange rice in bowl, top with chicken, broccoli, tomatoes.','Drizzle with Greek yogurt dressing.'] },
    { id:'l2', name:'Dal Makhani with Roti', type:'veg', cal:420, protein:18, carbs:62, fat:12, prepTime:'30 min', servings:1,
      ingredients:['1/2 cup whole black lentils','2 tbsp kidney beans','1 tbsp butter','1 onion','2 tomatoes','Ginger-garlic paste','1 tbsp cream','3 whole wheat rotis'],
      steps:['Pressure cook soaked lentils and kidney beans for 20 mins.','Sauté onion until golden, add ginger-garlic paste.','Add tomatoes and spices, cook until oil separates.','Add cooked dal and simmer for 15 minutes.','Finish with butter and cream. Serve with rotis.'] },
    { id:'l3', name:'Tuna Quinoa Salad', type:'nonveg', cal:360, protein:32, carbs:34, fat:9, prepTime:'15 min', servings:1,
      ingredients:['1 can tuna (in water)','3/4 cup cooked quinoa','1 cucumber (diced)','1 tomato (diced)','1/4 red onion','2 tbsp olive oil','Lemon juice','Fresh parsley'],
      steps:['Drain tuna and flake with a fork.','Cook quinoa as per package instructions and let cool.','Combine quinoa, tuna, cucumber, tomato, onion.','Whisk olive oil and lemon juice for dressing.','Toss everything together and garnish with parsley.'] },
    { id:'l4', name:'Paneer Bhurji with Brown Rice', type:'veg', cal:440, protein:22, carbs:48, fat:16, prepTime:'20 min', servings:1,
      ingredients:['150g paneer (crumbled)','1 cup cooked brown rice','1 onion','1 tomato','1 capsicum','Cumin, turmeric, coriander powder','1 tbsp oil'],
      steps:['Heat oil, add cumin seeds and sauté onions until soft.','Add tomatoes and capsicum, cook for 5 minutes.','Add spices and crumbled paneer, mix well.','Cook for another 5 minutes on medium heat.','Serve hot with brown rice.'] },
    { id:'l5', name:'Chickpea Buddha Bowl', type:'vegan', cal:390, protein:16, carbs:58, fat:11, prepTime:'20 min', servings:1,
      ingredients:['1 cup canned chickpeas (roasted)','1/2 cup quinoa','1 cup mixed greens','1/2 avocado','1/4 cup shredded carrots','2 tbsp tahini dressing'],
      steps:['Roast chickpeas with olive oil, paprika, garlic powder at 200°C for 20 mins.','Cook quinoa and let cool slightly.','Arrange greens, quinoa, chickpeas, carrots, avocado in bowl.','Drizzle tahini dressing generously.'] },
    { id:'l6', name:'Salmon with Sweet Potato', type:'nonveg', cal:510, protein:36, carbs:40, fat:20, prepTime:'30 min', servings:1,
      ingredients:['150g salmon fillet','1 medium sweet potato','1 cup asparagus','2 tbsp olive oil','Garlic, lemon, dill','Salt & pepper'],
      steps:['Preheat oven to 200°C. Cube sweet potato, toss with olive oil and roast 20 mins.','Season salmon with salt, pepper, garlic, lemon juice.','Pan-sear salmon 4 mins per side until cooked through.','Steam or roast asparagus until tender.','Plate together and garnish with dill.'] },
  ],
  dinner: [
    { id:'d1', name:'Grilled Fish Tacos', type:'nonveg', cal:380, protein:30, carbs:36, fat:12, prepTime:'20 min', servings:1,
      ingredients:['150g white fish (tilapia/cod)','3 small corn tortillas','1/4 cabbage (shredded)','1/2 avocado','Lime juice','Cumin, paprika','Greek yogurt sauce'],
      steps:['Season fish with cumin, paprika, salt.','Grill or pan-fry fish for 3-4 mins per side.','Warm tortillas on a dry pan.','Flake fish, arrange on tortillas with cabbage, avocado.','Squeeze lime and add yogurt sauce.'] },
    { id:'d2', name:'Lentil Vegetable Soup', type:'vegan', cal:280, protein:16, carbs:44, fat:4, prepTime:'30 min', servings:1,
      ingredients:['1/2 cup red lentils','1 carrot','2 celery stalks','1 onion','2 garlic cloves','1 can crushed tomatoes','Cumin, coriander, turmeric','2 cups vegetable broth'],
      steps:['Sauté onion and garlic in olive oil until soft.','Add carrots and celery, cook 3 minutes.','Add spices and lentils, stir to coat.','Pour in broth and tomatoes, bring to boil.','Simmer 20-25 minutes until lentils are fully soft.'] },
    { id:'d3', name:'Chicken Stir Fry with Noodles', type:'nonveg', cal:430, protein:34, carbs:46, fat:11, prepTime:'20 min', servings:1,
      ingredients:['120g chicken breast (sliced)','80g rice noodles','1 cup mixed vegetables','2 tbsp low-sodium soy sauce','1 tsp sesame oil','Garlic, ginger','1 tsp cornstarch'],
      steps:['Cook noodles as per package, drain and set aside.','Marinate chicken in soy sauce, cornstarch for 10 mins.','Stir-fry chicken in high heat until cooked, set aside.','Stir-fry vegetables for 2-3 minutes in same pan.','Add noodles and chicken back, toss with soy sauce and sesame oil.'] },
    { id:'d4', name:'Palak Paneer with Roti', type:'veg', cal:360, protein:20, carbs:34, fat:16, prepTime:'25 min', servings:1,
      ingredients:['100g paneer','2 cups spinach (blanched)','1 onion','1 tomato','Ginger-garlic paste','Cumin, garam masala','2 tbsp cream','3 whole wheat rotis'],
      steps:['Blanch spinach in hot water for 2 mins, then blend smooth.','Sauté onion until golden, add ginger-garlic paste.','Add tomato and spices, cook until thick.','Add spinach puree and simmer 5 mins.','Add paneer cubes and cream, cook 3 more mins. Serve with rotis.'] },
    { id:'d5', name:'Baked Lemon Herb Chicken', type:'nonveg', cal:320, protein:40, carbs:6, fat:14, prepTime:'35 min', servings:1,
      ingredients:['180g chicken breast','1 lemon (zest + juice)','3 garlic cloves','Fresh rosemary and thyme','2 tbsp olive oil','Salt & pepper','1 cup roasted vegetables'],
      steps:['Preheat oven to 190°C.','Mix olive oil, lemon, garlic, herbs for marinade.','Coat chicken well and let sit 15 mins.','Bake 25-30 minutes until internal temp 74°C.','Rest 5 minutes before serving with vegetables.'] },
    { id:'d6', name:'Tofu Veggie Stir Fry', type:'vegan', cal:300, protein:18, carbs:28, fat:12, prepTime:'20 min', servings:1,
      ingredients:['150g firm tofu (cubed)','1 cup mixed vegetables','1 tbsp sesame oil','2 tbsp soy sauce','1 tsp rice vinegar','Garlic, ginger','1/2 cup cooked brown rice'],
      steps:['Press tofu dry and cube. Pan fry until golden on all sides.','Remove tofu, stir-fry vegetables in sesame oil.','Add garlic and ginger, cook 1 minute.','Return tofu, add soy sauce and rice vinegar.','Toss well and serve over brown rice.'] },
  ],
  snack: [
    { id:'s1', name:'Apple with Almond Butter', type:'vegan', cal:195, protein:5, carbs:26, fat:9, prepTime:'2 min', servings:1,
      ingredients:['1 medium apple','2 tbsp almond butter'],
      steps:['Slice apple into wedges.','Serve with almond butter for dipping.'] },
    { id:'s2', name:'Boiled Egg & Nuts', type:'nonveg', cal:210, protein:14, carbs:4, fat:15, prepTime:'10 min', servings:1,
      ingredients:['2 hard-boiled eggs','20g mixed nuts','Salt & pepper'],
      steps:['Boil eggs for 9 minutes, cool and peel.','Serve with mixed nuts on the side.'] },
    { id:'s3', name:'Hummus with Veggie Sticks', type:'vegan', cal:180, protein:6, carbs:22, fat:8, prepTime:'5 min', servings:1,
      ingredients:['4 tbsp hummus','1 carrot (sticks)','1/2 cucumber (sticks)','4 celery stalks'],
      steps:['Cut vegetables into sticks.','Serve with hummus for dipping.'] },
    { id:'s4', name:'Protein Shake', type:'nonveg', cal:160, protein:24, carbs:10, fat:3, prepTime:'3 min', servings:1,
      ingredients:['1 scoop whey protein powder','250ml milk','1/2 banana','Ice cubes'],
      steps:['Add all ingredients to blender.','Blend for 30 seconds.','Serve immediately.'] },
  ],
};

const MEAL_SECTIONS = [
  { key:'breakfast', name:'BREAKFAST', icon:'🌅', time:'7:30 – 9:00 AM',   ratio:0.30 },
  { key:'lunch',     name:'LUNCH',     icon:'☀️', time:'12:30 – 2:00 PM', ratio:0.40 },
  { key:'dinner',    name:'DINNER',    icon:'🌙', time:'7:00 – 8:30 PM',  ratio:0.25 },
  { key:'snack',     name:'SNACK',     icon:'⚡', time:'Anytime',          ratio:0.10 },
];

let activeRecipe  = null;
let activeMealKey = null;

window.addEventListener('DOMContentLoaded', () => {
  setupNav();
  renderMealSections();
  updateSummary();
  updateShoppingList();
});

function setupNav() {
  const name = STATE.user.name || 'User';
  document.getElementById('navAvatar').textContent    = name.charAt(0).toUpperCase();
  document.getElementById('navTargetCal').textContent = STATE.targets.calories;
  updateNavCal();
}

function updateNavCal() {
  document.getElementById('navTotalCal').textContent = getSelectedTotal().cal;
}

function setDietType(type, btn) {
  STATE.dietType = type;
  document.querySelectorAll('.diet-type-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderMealSections();
}

function setMealSize(size, btn) {
  STATE.mealSize = size;
  document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderMealSections();
}

function renderMealSections() {
  const container = document.getElementById('mealsContainer');
  container.innerHTML = '';

  MEAL_SECTIONS.forEach((section, sIdx) => {
    const targetCal   = Math.round(STATE.targets.calories * section.ratio);
    const selectedMeal = STATE.plan[section.key] || null;
    const selectedCal  = selectedMeal ? selectedMeal.cal : 0;

    let meals = MEAL_DB[section.key] || [];
    if (STATE.dietType !== 'all') meals = meals.filter(m => m.type === STATE.dietType);
    if (STATE.mealSize === 'light') meals = meals.filter(m => m.cal <= targetCal * 0.9);
    if (STATE.mealSize === 'heavy') meals = meals.filter(m => m.cal >= targetCal * 0.7);

    const sec = document.createElement('div');
    sec.className = 'meal-section';
    sec.style.animationDelay = (sIdx * 0.08) + 's';
    sec.innerHTML = `
      <div class="meal-section-header">
        <div class="msh-left">
          <div class="meal-type-icon">${section.icon}</div>
          <div>
            <div class="meal-type-name">${section.name}</div>
            <div class="meal-type-time">${section.time}</div>
          </div>
        </div>
        <div class="msh-right">
          <div>
            <div class="msh-cal-badge">${selectedCal}</div>
            <div class="msh-cal-target">/ ${targetCal} KCAL TARGET</div>
          </div>
        </div>
      </div>
      <div class="meal-cards-grid" id="grid-${section.key}"></div>`;
    container.appendChild(sec);

    const grid = sec.querySelector(`#grid-${section.key}`);
    if (meals.length === 0) {
      grid.innerHTML = `<div class="meal-empty-slot">No meals match your filter.</div>`;
      return;
    }

    meals.forEach(meal => {
      const isSelected = selectedMeal && selectedMeal.id === meal.id;
      const card = document.createElement('div');
      card.className = 'meal-option-card' + (isSelected ? ' selected' : '');
      card.innerHTML = `
        <div class="selected-tick">✓</div>
        <div class="moc-top">
          <div class="moc-name">${meal.name}</div>
          <span class="moc-type-badge badge-${meal.type}">${meal.type.toUpperCase()}</span>
        </div>
        <div class="moc-cal">${meal.cal}</div>
        <div class="moc-cal-unit">KCAL PER SERVING</div>
        <div class="moc-macros">
          <span class="moc-macro"><strong>P:</strong> ${meal.protein}g</span>
          <span class="moc-macro"><strong>C:</strong> ${meal.carbs}g</span>
          <span class="moc-macro"><strong>F:</strong> ${meal.fat}g</span>
        </div>
        <div class="moc-actions">
          <button class="moc-recipe-btn" onclick="openRecipe('${meal.id}','${section.key}')">VIEW RECIPE</button>
          <button class="moc-select-btn" onclick="selectMeal('${section.key}','${meal.id}')">
            ${isSelected ? '✓ SELECTED' : 'SELECT'}
          </button>
        </div>`;
      grid.appendChild(card);
    });
  });
}

function selectMeal(mealKey, mealId) {
  const meal = Object.values(MEAL_DB).flat().find(m => m.id === mealId);
  if (STATE.plan[mealKey] && STATE.plan[mealKey].id === mealId) {
    delete STATE.plan[mealKey];
  } else {
    STATE.plan[mealKey] = meal;
  }
  localStorage.setItem('fitai_dietplan', JSON.stringify(STATE.plan));
  renderMealSections();
  updateSummary();
  updateNavCal();
  updateShoppingList();
}

function generateFullPlan() {
  MEAL_SECTIONS.forEach(section => {
    let meals = MEAL_DB[section.key] || [];
    if (STATE.dietType !== 'all') meals = meals.filter(m => m.type === STATE.dietType);
    if (meals.length > 0) STATE.plan[section.key] = meals[Math.floor(Math.random() * meals.length)];
  });
  localStorage.setItem('fitai_dietplan', JSON.stringify(STATE.plan));
  renderMealSections();
  updateSummary();
  updateNavCal();
  updateShoppingList();
}

function resetPlan() {
  STATE.plan = {};
  localStorage.removeItem('fitai_dietplan');
  renderMealSections();
  updateSummary();
  updateNavCal();
  updateShoppingList();
}

function getSelectedTotal() {
  return Object.values(STATE.plan).reduce((acc, m) => ({
    cal:     acc.cal     + (m.cal     || 0),
    protein: acc.protein + (m.protein || 0),
    carbs:   acc.carbs   + (m.carbs   || 0),
    fat:     acc.fat     + (m.fat     || 0),
  }), { cal:0, protein:0, carbs:0, fat:0 });
}

function updateSummary() {
  const t   = getSelectedTotal();
  const tgt = STATE.targets.calories;
  const pct = Math.min(1, t.cal / tgt);
  document.getElementById('summaryRing').style.strokeDashoffset = 314 - (pct * 314);
  document.getElementById('srConsumed').textContent  = t.cal;
  document.getElementById('ssTotalCal').textContent  = t.cal;
  document.getElementById('ssRemaining').textContent = Math.max(0, tgt - t.cal);
  document.getElementById('smProtein').textContent   = t.protein + 'g';
  document.getElementById('smCarbs').textContent     = t.carbs   + 'g';
  document.getElementById('smFat').textContent       = t.fat     + 'g';
}

function updateShoppingList() {
  const listEl   = document.getElementById('shopList');
  const selected = Object.values(STATE.plan);
  if (selected.length === 0) {
    listEl.innerHTML = `<div class="shop-empty">Add meals to generate list</div>`;
    return;
  }
  listEl.innerHTML = selected.map(meal =>
    meal.ingredients.map(ing => `
      <div class="shop-item">
        <span class="shop-item-dot"></span>
        <span class="shop-item-name">${ing}</span>
      </div>`).join('')
  ).join('');
}

function copyShoppingList() {
  const selected = Object.values(STATE.plan);
  if (!selected.length) return;
  let text = '🛒 FITAI SHOPPING LIST\n\n';
  selected.forEach(meal => {
    text += `📍 ${meal.name}\n`;
    meal.ingredients.forEach(ing => { text += `  • ${ing}\n`; });
    text += '\n';
  });
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.querySelector('.shop-copy-btn');
    btn.textContent = 'COPIED!';
    btn.style.color = '#22c55e';
    setTimeout(() => { btn.textContent = 'COPY'; btn.style.color = ''; }, 2000);
  });
}

function openRecipe(mealId, mealKey) {
  const meal = Object.values(MEAL_DB).flat().find(m => m.id === mealId);
  if (!meal) return;
  activeRecipe  = meal;
  activeMealKey = mealKey;
  const section    = MEAL_SECTIONS.find(s => s.key === mealKey);
  const isSelected = STATE.plan[mealKey] && STATE.plan[mealKey].id === mealId;

  document.getElementById('rmTag').textContent   = section ? section.name : '';
  document.getElementById('rmTitle').textContent = meal.name;
  document.getElementById('rmMeta').textContent  = `⏱ ${meal.prepTime}  ·  👤 ${meal.servings} serving  ·  🔥 ${meal.cal} kcal`;
  document.getElementById('rmIngredients').innerHTML = meal.ingredients.map(i => `<li>${i}</li>`).join('');
  document.getElementById('rmSteps').innerHTML       = meal.steps.map(s => `<li>${s}</li>`).join('');
  document.getElementById('rmMacros').innerHTML = `
    <div class="rm-macro-item"><div class="rm-macro-val">${meal.cal}</div><div class="rm-macro-name">CALORIES</div></div>
    <div class="rm-macro-item"><div class="rm-macro-val">${meal.protein}g</div><div class="rm-macro-name">PROTEIN</div></div>
    <div class="rm-macro-item"><div class="rm-macro-val">${meal.carbs}g</div><div class="rm-macro-name">CARBS</div></div>
    <div class="rm-macro-item"><div class="rm-macro-val">${meal.fat}g</div><div class="rm-macro-name">FAT</div></div>`;

  const addBtn = document.getElementById('rmAddBtn');
  addBtn.textContent       = isSelected ? '✓ ALREADY SELECTED' : '+ ADD TO MY PLAN';
  addBtn.style.background  = isSelected ? '#1a1a1a' : '';
  addBtn.onclick = () => { selectMeal(activeMealKey, activeRecipe.id); closeRecipe(); };

  document.getElementById('recipeOverlay').classList.add('show');
  document.getElementById('recipeModal').classList.add('show');
}

function closeRecipe() {
  document.getElementById('recipeOverlay').classList.remove('show');
  document.getElementById('recipeModal').classList.remove('show');
}

function swapMeal() {
  if (!activeMealKey || !activeRecipe) return;
  let meals = MEAL_DB[activeMealKey].filter(m => m.id !== activeRecipe.id);
  if (STATE.dietType !== 'all') meals = meals.filter(m => m.type === STATE.dietType);
  if (!meals.length) return;
  openRecipe(meals[Math.floor(Math.random() * meals.length)].id, activeMealKey);
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeRecipe(); });
