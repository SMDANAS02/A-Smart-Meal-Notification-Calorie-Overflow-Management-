let selectedGender   = 'male';
let selectedActivity = 'light';
let selectedGoal     = 'maintain';
let calculatedCalories = 0;
let userName = '';

window.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('transitionOverlay');
  const page    = document.getElementById('onboardingPage');
  setTimeout(() => {
    overlay.classList.add('fade-out');
    page.classList.add('visible');
    setTimeout(() => { overlay.style.display = 'none'; }, 600);
  }, 300);
});

function setGender(gender) {
  selectedGender = gender;
  document.getElementById('g-male').classList.toggle('active',   gender === 'male');
  document.getElementById('g-female').classList.toggle('active', gender === 'female');
}

function setActivity(level, btn) {
  selectedActivity = level;
  document.querySelectorAll('.activity-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function setGoal(goal, btn) {
  selectedGoal = goal;
  document.querySelectorAll('.goal-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

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
    const tdee = Math.round(bmr * activityMap[selectedActivity]);

    const goalMap = { lose: -500, maintain: 0, gain: +400 };
    calculatedCalories = tdee + goalMap[selectedGoal];

    const protein = Math.round((calculatedCalories * 0.30) / 4);
    const carbs   = Math.round((calculatedCalories * 0.45) / 4);
    const fat     = Math.round((calculatedCalories * 0.25) / 9);

    const goalLabel = {
      lose:     '🔥 500 kcal deficit applied for fat loss',
      maintain: '⚖️ Maintenance calories — stay balanced',
      gain:     '💪 400 kcal surplus applied for muscle gain',
    };

    document.getElementById('resultCalories').textContent = calculatedCalories.toLocaleString();
    document.getElementById('resultBreakdown').innerHTML =
      `<strong style="color:#555;font-size:10px;letter-spacing:2px;">MACROS</strong><br>
       Protein: <span style="color:#888">${protein}g</span> &nbsp;|&nbsp;
       Carbs: <span style="color:#888">${carbs}g</span> &nbsp;|&nbsp;
       Fat: <span style="color:#888">${fat}g</span><br><br>
       <span style="color:#444;font-size:10px">${goalLabel[selectedGoal]}</span>`;

    document.getElementById('resultCard').classList.add('show');

    text.textContent = 'RECALCULATE';
    text.style.display = 'inline'; arrow.style.display = 'inline';
    dots.style.display = 'none';  btn.style.pointerEvents = 'auto';
  }, 1200);
}

function goToDashboard() {
  // Save user data to localStorage
  localStorage.setItem('fitai_user', JSON.stringify({
    name: userName,
    goal: selectedGoal
  }));
  localStorage.setItem('fitai_targets', JSON.stringify({
    calories: calculatedCalories,
    protein:  Math.round((calculatedCalories * 0.30) / 4),
    carbs:    Math.round((calculatedCalories * 0.45) / 4),
    fat:      Math.round((calculatedCalories * 0.25) / 9)
  }));

  // Red circle expand → then go to tracker page
  const overlay = document.getElementById('nextOverlay');
  overlay.classList.add('expanding');
  setTimeout(() => {
    window.location.href = 'tracker.html';
  }, 700);
}

function animateDashboard() {
  [
    { id: 'dashWelcome', delay: 100 },
    { id: 'dashTitle',   delay: 250 },
    { id: 'dashCards',   delay: 450 },
    { id: 'dashBack',    delay: 650 },
  ].forEach(({ id, delay }) => {
    setTimeout(() => {
      document.getElementById(id).style.animation = 'dashFadeUp 0.6s ease forwards';
    }, delay);
  });
}

function goBack() { window.location.reload(); }
function goToDashboard() {
  localStorage.setItem('fitai_user', JSON.stringify({
    name: userName, goal: selectedGoal
  }));
  localStorage.setItem('fitai_targets', JSON.stringify({
    calories: calculatedCalories,
    protein:  Math.round((calculatedCalories * 0.30) / 4),
    carbs:    Math.round((calculatedCalories * 0.45) / 4),
    fat:      Math.round((calculatedCalories * 0.25) / 9)
  }));
  window.location.href = 'tracker.html';}