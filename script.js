// script.js — FitAI Login Page
// ════════════════════════════════════════

// ─────────────────────────────────────────
// BACKEND URL — Deploy பண்ணப்பிறகு மாத்துங்க
// Example: 'https://fitai-backend.onrender.com/api'
// ─────────────────────────────────────────
const API_BASE = 'http://localhost:3000/api';

// ─────────────────────────────────────────
// PAGE LOAD — Already logged in-ஆ check பண்ணு
// ─────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  // Already token இருந்தா direct tracker-க்கு போ
  if (localStorage.getItem('fitai_token')) {
    window.location.href = 'tracker.html';
    return;
  }

  // Particles init
  initParticles();

  // Remember me — saved email fill பண்ணு
  const savedEmail = localStorage.getItem('fitai_remember_email');
  if (savedEmail) {
    document.getElementById('email').value = savedEmail;
    const box = document.getElementById('checkBox');
    box.classList.add('checked');
    box.dataset.checked = 'true';
  }

  // Enter key → login
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLogin();
  });
});

// ─────────────────────────────────────────
// HANDLE LOGIN / REGISTER
// ─────────────────────────────────────────
let isRegisterMode = false;

async function handleLogin() {
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  // Validation
  if (!email || !password) {
    showFormError('Please enter email and password');
    return;
  }
  if (!isValidEmail(email)) {
    showFormError('Please enter a valid email');
    return;
  }
  if (password.length < 6) {
    showFormError('Password must be at least 6 characters');
    return;
  }

  // Button loading state
  setLoading(true);

  try {
    let data;

    if (isRegisterMode) {
      // ── REGISTER ──
      const name = document.getElementById('nameInput')?.value.trim();
      if (!name) {
        showFormError('Please enter your name');
        setLoading(false);
        return;
      }
      data = await apiPost('/auth/register', { name, email, password });
    } else {
      // ── LOGIN ──
      data = await apiPost('/auth/login', { email, password });
    }

    // Remember me
    const isChecked = document.getElementById('checkBox').dataset.checked === 'true';
    if (isChecked) {
      localStorage.setItem('fitai_remember_email', email);
    } else {
      localStorage.removeItem('fitai_remember_email');
    }

    // Save token + user
    localStorage.setItem('fitai_token', data.token);
    localStorage.setItem('fitai_user', JSON.stringify(data.user));

    // Success — transition animation
    triggerTransition(data.user.name);

  } catch (err) {
    setLoading(false);
    showFormError(err.message || 'Something went wrong. Try again.');
  }
}

// ─────────────────────────────────────────
// API POST HELPER
// ─────────────────────────────────────────
async function apiPost(endpoint, body) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

// ─────────────────────────────────────────
// TRANSITION ANIMATION → Go to next page
// ─────────────────────────────────────────
function triggerTransition(userName) {
  const overlay = document.getElementById('transitionOverlay');
  const dash    = document.getElementById('dashboardPage');

  // Show welcome dashboard briefly
  const welcome = document.getElementById('dashWelcome');
  const title   = document.getElementById('dashTitle');
  const cards   = document.getElementById('dashCards');
  const back    = document.getElementById('dashBack');

  welcome.textContent = `WELCOME, ${userName.toUpperCase()}`;

  // Red circle expand
  overlay.classList.add('expanding');

  setTimeout(() => {
    overlay.classList.add('expanded');
    dash.classList.add('visible');

    // Animate dashboard elements
    setTimeout(() => {
      welcome.style.animation = 'dashFadeUp 0.5s ease forwards';
      title.style.animation   = 'dashFadeUp 0.6s ease 0.1s forwards';
      cards.style.animation   = 'dashFadeUp 0.6s ease 0.2s forwards';
      back.style.animation    = 'dashFadeUp 0.6s ease 0.35s forwards';
    }, 200);

    // Check onboarding done-ஆ?
    const user = JSON.parse(localStorage.getItem('fitai_user') || '{}');
    checkOnboardingAndRedirect();

  }, 400);
}

// ─────────────────────────────────────────
// CHECK ONBOARDING — Done-ஆ? tracker-க்கு போ
// First time-ஆ? onboarding-க்கு போ
// ─────────────────────────────────────────
async function checkOnboardingAndRedirect() {
  try {
    const token = localStorage.getItem('fitai_token');
    const res   = await fetch(`${API_BASE}/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    // cal_target set ஆகிருந்தா onboarding done
    const onboardingDone = data.profile?.cal_target && data.profile.cal_target !== 2000;

    setTimeout(() => {
      if (onboardingDone) {
        window.location.href = 'tracker.html';
      } else {
        window.location.href = 'onboarding.html';
      }
    }, 1800);

  } catch (err) {
    // Error-ஆனா onboarding-க்கு போ
    setTimeout(() => {
      window.location.href = 'onboarding.html';
    }, 1800);
  }
}

// ─────────────────────────────────────────
// REGISTER MODE TOGGLE
// "CREATE ACCOUNT" click பண்ணும்போது
// ─────────────────────────────────────────
function toggleRegister() {
  isRegisterMode = !isRegisterMode;

  const heading  = document.querySelector('.form-heading h2');
  const subText  = document.querySelector('.form-sub');
  const btnText  = document.getElementById('btnText');
  const regRow   = document.querySelector('.register-row');
  const fields   = document.querySelector('.right .field');

  if (isRegisterMode) {
    // Add name field if not exists
    if (!document.getElementById('nameInput')) {
      const nameField = document.createElement('div');
      nameField.className = 'field';
      nameField.id = 'nameField';
      nameField.innerHTML = `
        <label class="field-label">Full Name</label>
        <div class="input-wrap">
          <span class="input-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </span>
          <input type="text" id="nameInput" placeholder="John Doe"/>
        </div>
      `;
      fields.parentNode.insertBefore(nameField, fields);
    }

    heading.innerHTML = 'CREATE <span>ACCOUNT</span>';
    subText.textContent = 'Join FitAI and start your journey';
    btnText.textContent = 'CREATE ACCOUNT ';
    regRow.innerHTML = `Already have an account? <a href="#" onclick="toggleRegister()">SIGN IN →</a>`;
  } else {
    // Remove name field
    const nameField = document.getElementById('nameField');
    if (nameField) nameField.remove();

    heading.innerHTML = 'WELCOME <span>BACK</span>';
    subText.textContent = 'Sign in to continue your journey';
    btnText.textContent = 'ENTER ';
    regRow.innerHTML = `New to FitAI? <a href="#" onclick="toggleRegister()">CREATE ACCOUNT →</a>`;
  }

  clearFormError();
}

// ─────────────────────────────────────────
// FORM ERROR DISPLAY
// ─────────────────────────────────────────
function showFormError(msg) {
  // Remove existing error
  const existing = document.getElementById('formError');
  if (existing) existing.remove();

  const err = document.createElement('div');
  err.id = 'formError';
  err.style.cssText = `
    background: rgba(232,0,13,0.08);
    border: 1px solid rgba(232,0,13,0.3);
    border-left: 3px solid #E8000D;
    color: #ff4444;
    padding: 12px 16px;
    border-radius: 2px;
    font-size: 13px;
    margin-bottom: 16px;
    font-family: 'Barlow', sans-serif;
    animation: fadeUp 0.3s ease;
  `;
  err.textContent = '⚠ ' + msg;

  const submitBtn = document.getElementById('submitBtn');
  submitBtn.parentNode.insertBefore(err, submitBtn);

  // Auto remove after 4s
  setTimeout(() => err.remove(), 4000);
}

function clearFormError() {
  const err = document.getElementById('formError');
  if (err) err.remove();
}

// ─────────────────────────────────────────
// LOADING STATE
// ─────────────────────────────────────────
function setLoading(loading) {
  const btn    = document.getElementById('submitBtn');
  const text   = document.getElementById('btnText');
  const arrow  = document.getElementById('btnArrow');
  const dots   = document.getElementById('btnDots');

  if (loading) {
    btn.disabled  = true;
    text.style.display  = 'none';
    arrow.style.display = 'none';
    dots.style.display  = 'flex';
  } else {
    btn.disabled  = false;
    text.style.display  = 'inline';
    arrow.style.display = 'inline';
    dots.style.display  = 'none';
  }
}

// ─────────────────────────────────────────
// UI HELPERS
// ─────────────────────────────────────────
function togglePw() {
  const input    = document.getElementById('password');
  const eyeOpen  = document.getElementById('eyeOpen');
  const eyeClosed= document.getElementById('eyeClosed');
  const isHidden = input.type === 'password';
  input.type          = isHidden ? 'text' : 'password';
  eyeOpen.style.display  = isHidden ? 'none' : 'block';
  eyeClosed.style.display= isHidden ? 'block' : 'none';
}

function toggleCheck() {
  const box     = document.getElementById('checkBox');
  const checked = box.dataset.checked === 'true';
  box.dataset.checked = (!checked).toString();
  box.classList.toggle('checked', !checked);
}

function goBack() {
  window.location.reload();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─────────────────────────────────────────
// REGISTER LINK — HTML-ல onclick="toggleRegister()" போடு
// ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const regLink = document.querySelector('.register-row a');
  if (regLink) {
    regLink.addEventListener('click', (e) => {
      e.preventDefault();
      toggleRegister();
    });
  }
});

// ─────────────────────────────────────────
// PARTICLES ANIMATION
// ─────────────────────────────────────────
function initParticles() {
  const canvas = document.getElementById('particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  canvas.width  = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  const particles = Array.from({ length: 40 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.5 + 0.5,
    dx: (Math.random() - 0.5) * 0.4,
    dy: (Math.random() - 0.5) * 0.4,
    alpha: Math.random() * 0.4 + 0.1
  }));

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(232,0,13,${p.alpha})`;
      ctx.fill();
      p.x += p.dx;
      p.y += p.dy;
      if (p.x < 0 || p.x > canvas.width)  p.dx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
    });
    requestAnimationFrame(draw);
  }
  draw();

  window.addEventListener('resize', () => {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  });
}
