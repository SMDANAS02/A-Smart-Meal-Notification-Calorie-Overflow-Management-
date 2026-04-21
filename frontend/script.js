// script.js — FitAI Login Page
const API_BASE = 'http://localhost:3000/api';

window.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('fitai_token')) {
    window.location.href = 'tracker.html';
    return;
  }
  initParticles();

  const savedEmail = localStorage.getItem('fitai_remember_email');
  if (savedEmail) {
    document.getElementById('email').value = savedEmail;
    const box = document.getElementById('checkBox');
    box.classList.add('checked');
    box.dataset.checked = 'true';
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLogin();
  });
});

// ── GOOGLE SIGN IN
async function handleGoogleCredential(response) {
  try {
    const data = await apiPost('/auth/google', { credential: response.credential });
    localStorage.setItem('fitai_token', data.token);
    localStorage.setItem('fitai_user', JSON.stringify(data.user));
    triggerTransition(data.user.name);
  } catch (err) {
    showFormError(err.message || 'Google Sign-In failed.');
  }
}

// ── LOGIN / REGISTER
let isRegisterMode = false;

function toggleRegister() {
  isRegisterMode = !isRegisterMode;
  const heading    = document.querySelector('.form-heading h2');
  const subText    = document.querySelector('.form-sub');
  const btnText    = document.getElementById('btnText');
  const regRow     = document.querySelector('.register-row');
  const emailField = document.querySelector('.field');

  if (isRegisterMode) {
    if (!document.getElementById('nameField')) {
      const nameField = document.createElement('div');
      nameField.className = 'field';
      nameField.id = 'nameField';
      nameField.style.opacity = '1';
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
        </div>`;
      emailField.parentNode.insertBefore(nameField, emailField);
    }
    heading.innerHTML   = 'CREATE <span>ACCOUNT</span>';
    subText.textContent = 'Join FitAI and start your journey';
    btnText.textContent = 'CREATE ACCOUNT ';
    regRow.innerHTML    = `Already have an account? <a href="javascript:void(0)" onclick="toggleRegister()">SIGN IN →</a>`;
  } else {
    const nameField = document.getElementById('nameField');
    if (nameField) nameField.remove();
    heading.innerHTML   = 'WELCOME <span>BACK</span>';
    subText.textContent = 'Sign in to continue your journey';
    btnText.textContent = 'ENTER ';
    regRow.innerHTML    = `New to FitAI? <a href="javascript:void(0)" onclick="toggleRegister()">CREATE ACCOUNT →</a>`;
  }
  clearFormError();
}

async function handleLogin() {
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!email || !password) { showFormError('Please enter email and password'); return; }
  if (!isValidEmail(email)) { showFormError('Please enter a valid email'); return; }
  if (password.length < 6)  { showFormError('Password must be at least 6 characters'); return; }

  setLoading(true);

  try {
    let data;
    if (isRegisterMode) {
      const name = document.getElementById('nameInput')?.value.trim();
      if (!name) { showFormError('Please enter your name'); setLoading(false); return; }
      data = await apiPost('/auth/register', { name, email, password });
    } else {
      data = await apiPost('/auth/login', { email, password });
    }

    const isChecked = document.getElementById('checkBox').dataset.checked === 'true';
    if (isChecked) localStorage.setItem('fitai_remember_email', email);
    else localStorage.removeItem('fitai_remember_email');

    localStorage.setItem('fitai_token', data.token);
    localStorage.setItem('fitai_user', JSON.stringify(data.user));
    triggerTransition(data.user.name);

  } catch (err) {
    setLoading(false);
    showFormError(err.message || 'Something went wrong. Try again.');
  }
}

async function apiPost(endpoint, body) {
  const res  = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function triggerTransition(userName) {
  const overlay = document.getElementById('transitionOverlay');
  const dash    = document.getElementById('dashboardPage');
  const welcome = document.getElementById('dashWelcome');
  const title   = document.getElementById('dashTitle');
  const cards   = document.getElementById('dashCards');
  const back    = document.getElementById('dashBack');

  welcome.textContent = `WELCOME, ${userName.toUpperCase()}`;
  overlay.classList.add('expanding');

  setTimeout(() => {
    overlay.classList.add('expanded');
    dash.classList.add('visible');
    setTimeout(() => {
      welcome.style.animation = 'dashFadeUp 0.5s ease forwards';
      title.style.animation   = 'dashFadeUp 0.6s ease 0.1s forwards';
      cards.style.animation   = 'dashFadeUp 0.6s ease 0.2s forwards';
      back.style.animation    = 'dashFadeUp 0.6s ease 0.35s forwards';
    }, 200);
    checkOnboardingAndRedirect();
  }, 400);
}

async function checkOnboardingAndRedirect() {
  try {
    const token = localStorage.getItem('fitai_token');
    const res   = await fetch(`${API_BASE}/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data  = await res.json();
    const done  = data.profile?.cal_target && data.profile.cal_target !== 2000;
    setTimeout(() => {
      window.location.href = done ? 'tracker.html' : 'onboarding.html';
    }, 1800);
  } catch {
    setTimeout(() => { window.location.href = 'onboarding.html'; }, 1800);
  }
}

function showFormError(msg) {
  const existing = document.getElementById('formError');
  if (existing) existing.remove();
  const err = document.createElement('div');
  err.id = 'formError';
  err.style.cssText = `background:rgba(232,0,13,0.08);border:1px solid rgba(232,0,13,0.3);border-left:3px solid #E8000D;color:#ff4444;padding:12px 16px;border-radius:2px;font-size:13px;margin-bottom:16px;font-family:'Barlow',sans-serif;`;
  err.textContent = '⚠ ' + msg;
  const submitBtn = document.getElementById('submitBtn');
  submitBtn.parentNode.insertBefore(err, submitBtn);
  setTimeout(() => err.remove(), 4000);
}

function clearFormError() {
  const err = document.getElementById('formError');
  if (err) err.remove();
}

function setLoading(loading) {
  const btn   = document.getElementById('submitBtn');
  const text  = document.getElementById('btnText');
  const arrow = document.getElementById('btnArrow');
  const dots  = document.getElementById('btnDots');
  if (loading) {
    btn.disabled = true; text.style.display = 'none';
    arrow.style.display = 'none'; dots.style.display = 'flex';
  } else {
    btn.disabled = false; text.style.display = 'inline';
    arrow.style.display = 'inline'; dots.style.display = 'none';
  }
}

function togglePw() {
  const input     = document.getElementById('password');
  const eyeOpen   = document.getElementById('eyeOpen');
  const eyeClosed = document.getElementById('eyeClosed');
  const isHidden  = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  eyeOpen.style.display   = isHidden ? 'none' : 'block';
  eyeClosed.style.display = isHidden ? 'block' : 'none';
}

function toggleCheck() {
  const box     = document.getElementById('checkBox');
  const checked = box.dataset.checked === 'true';
  box.dataset.checked = String(!checked);
  box.classList.toggle('checked', !checked);
}

function goBack() { window.location.reload(); }

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function initParticles() {
  const canvas = document.getElementById('particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width  = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  const particles = Array.from({ length: 40 }, () => ({
    x: Math.random() * canvas.width, y: Math.random() * canvas.height,
    r: Math.random() * 1.5 + 0.5,
    dx: (Math.random() - 0.5) * 0.4, dy: (Math.random() - 0.5) * 0.4,
    alpha: Math.random() * 0.4 + 0.1
  }));
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(232,0,13,${p.alpha})`; ctx.fill();
      p.x += p.dx; p.y += p.dy;
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