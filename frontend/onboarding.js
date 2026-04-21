// onboarding.js — FitAI Onboarding (Backend Connected)
// ════════════════════════════════════════
 
const API_BASE = 'http://localhost:3000/api';
const token    = localStorage.getItem('fitai_token');
const userRaw  = localStorage.getItem('fitai_user');
const user     = userRaw ? JSON.parse(userRaw) : null;
 
// ── Auth guard
if (!token) window.location.href = 'login.html';
 
// ── State
let selectedGender     = 'male';
let selectedActivity   = 'light';
let selectedGoal       = 'maintain';
let calculatedCalories = 0;
let calculatedProtein  = 0;
let calculatedCarbs    = 0;
let calculatedFat      = 0;
let userName           = '';
 
// ── Page load
window.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('transitionOverlay');
  const page    = document.getElementById('onboardingPage');
  setTimeout(() => {
    overlay.classList.add('fade-out');
    page.classList.add('visible');
    setTimeout(() => { overlay.style.display = 'none'; }, 600);
  }, 300);
 
  // Pre-fill name from logged in user
  if (user?.name) {
    const nameInput = document.getElementById('inp-name');
    if (nameInput) nameInput.value = user.name;
    userName = user.name;
  }
});
 
// ── Gender select
function setGender(gender) {
  selectedGender = gender;
  document.getElementById('g-male').classList.toggle('active',   gender === 'male');
  document.getElementById('g-female').classList.toggle('active', gender === 'female');
}
 
// ── Activity select
function setActivity(level, btn) {
  selectedActivity = level;
  document.querySelectorAll('.activity-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}
 
// ── Goal select
function setGoal(goal, btn) {
  selectedGoal = goal;
  document.querySelectorAll('.goal-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}
 
// ── Validate
function validateForm() {
  const name   = document.getElementById('inp-name').value.trim();
  const age    = parseInt(document.getElementById('inp-age').value);
  const height = parseInt(document.getElementById('inp-height').value);
  const weight = parseInt(document.getElementById('inp-weight').value);
  if (!name)                                   return 'Please enter your name.';
  if (!age    || age < 10    || age > 100)     return 'Please enter a valid age (10–100).';
  if (!height || height < 100 || height > 250) return 'Please enter a valid height (100–250 cm).';
  if (!weight || weight < 30  || weight > 300) return 'Please enter a valid weight (30–300 kg).';
  return null;
}
 
// ── Calculate calories
function calculateCalories() {
  const error   = validateForm();
  const errorEl = document.getElementById('ob-error');
  if (error) { errorEl.textContent = '⚠ ' + error; errorEl.classList.add('show'); return; }
  errorEl.classList.remove('show');
 
  const name   = document.getElementById('inp-name').value.trim();
  const age    = parseInt(document.getElementById('inp-age').value);
  const height = parseInt(document.getElementById('inp-height').value);
  const weight = parseInt(document.getElementById('inp-weight').value);
  userName = name;
 
  const btn   = document.getElementById('ob-submit');
  const text  = document.getElementById('ob-btn-text');
  const arrow = document.getElementById('ob-btn-arrow');
  const dots  = document.getElementById('ob-btn-dots');
  text.style.display = 'none'; arrow.style.display = 'none';
  dots.style.display = 'flex'; btn.style.pointerEvents = 'none';
 
  setTimeout(() => {
    let bmr = selectedGender === 'male'
      ? (10 * weight) + (6.25 * height) - (5 * age) + 5
      : (10 * weight) + (6.25 * height) - (5 * age) - 161;
 
    const activityMap = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 };
    const tdee = Math.round(bmr * (activityMap[selectedActivity] || 1.375));
 
    const goalMap = { lose: -500, maintain: 0, gain: +400 };
    calculatedCalories = Math.max(1200, tdee + (goalMap[selectedGoal] || 0));
 
    calculatedProtein = Math.round((calculatedCalories * 0.30) / 4);
    calculatedCarbs   = Math.round((calculatedCalories * 0.45) / 4);
    calculatedFat     = Math.round((calculatedCalories * 0.25) / 9);
 
    const goalLabel = {
      lose:     '🔥 500 kcal deficit applied for fat loss',
      maintain: '⚖️ Maintenance calories — stay balanced',
      gain:     '💪 400 kcal surplus applied for muscle gain',
    };
 
    document.getElementById('resultCalories').textContent = calculatedCalories.toLocaleString();
    document.getElementById('resultBreakdown').innerHTML =
      `<strong style="color:#555;font-size:10px;letter-spacing:2px;">MACROS</strong><br>
       Protein: <span style="color:#888">${calculatedProtein}g</span> &nbsp;|&nbsp;
       Carbs: <span style="color:#888">${calculatedCarbs}g</span> &nbsp;|&nbsp;
       Fat: <span style="color:#888">${calculatedFat}g</span><br><br>
       <span style="color:#444;font-size:10px">${goalLabel[selectedGoal]}</span>`;
 
    document.getElementById('resultCard').classList.add('show');
 
    text.textContent = 'RECALCULATE';
    text.style.display = 'inline'; arrow.style.display = 'inline';
    dots.style.display = 'none';  btn.style.pointerEvents = 'auto';
  }, 1200);
}
 
// ── Save to backend → go to tracker
async function goToDashboard() {
  if (!calculatedCalories) {
    alert('Please calculate your calories first!');
    return;
  }
 
  const age    = parseInt(document.getElementById('inp-age').value);
  const height = parseInt(document.getElementById('inp-height').value);
  const weight = parseInt(document.getElementById('inp-weight').value);
 
  // Loading state
  const goBtn = document.querySelector('[onclick="goToDashboard()"]');
  if (goBtn) { goBtn.textContent = 'SAVING...'; goBtn.disabled = true; }
 
  try {
    const res = await fetch(`${API_BASE}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        age,
        gender:         selectedGender,
        height_cm:      height,
        weight_kg:      weight,
        goal:           selectedGoal,
        activity_level: selectedActivity,
        cal_target:     calculatedCalories,
        protein_target: calculatedProtein,
        carbs_target:   calculatedCarbs,
        fat_target:     calculatedFat,
        water_target:   8,
        meal_count:     3
      })
    });
 
    if (!res.ok) throw new Error('Save failed');
 
    // Save to localStorage too
    localStorage.setItem('fitai_targets', JSON.stringify({
      calories: calculatedCalories,
      protein:  calculatedProtein,
      carbs:    calculatedCarbs,
      fat:      calculatedFat
    }));
 
    // Transition → tracker
    const overlay = document.getElementById('nextOverlay');
    if (overlay) {
      overlay.classList.add('expanding');
      setTimeout(() => { window.location.href = 'tracker.html'; }, 700);
    } else {
      window.location.href = 'tracker.html';
    }
 
  } catch (err) {
    console.error('Save failed:', err);
    if (goBtn) { goBtn.textContent = 'START MY JOURNEY →'; goBtn.disabled = false; }
    alert('Failed to save. Please try again.');
  }
}
 
function goBack() { window.location.reload(); }
 








































