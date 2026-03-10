// ── Password toggle
function togglePw() {
  const input = document.getElementById('password');
  const open  = document.getElementById('eyeOpen');
  const closed = document.getElementById('eyeClosed');
  if (input.type === 'password') {
    input.type = 'text'; open.style.display = 'none'; closed.style.display = 'block';
  } else {
    input.type = 'password'; open.style.display = 'block'; closed.style.display = 'none';
  }
}

// ── Checkbox
let isChecked = false;
function toggleCheck() {
  isChecked = !isChecked;
  const box = document.getElementById('checkBox');
  box.className = 'custom-check' + (isChecked ? ' checked' : '');
  box.innerHTML = isChecked ? `<svg width="9" height="9" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>` : '';
}

// ══════════════════════════════════════════
// CENTER EXPAND LOGIN TRANSITION
// Step 1: Button click → loading dots
// Step 2: Red circle screen center-ல expand
// Step 3: Dashboard fade in
// Step 4: Red circle fade out
// ══════════════════════════════════════════
function handleLogin() {
  const btn   = document.getElementById('submitBtn');
  const text  = document.getElementById('btnText');
  const arrow = document.getElementById('btnArrow');
  const dots  = document.getElementById('btnDots');

  // Step 1 — Loading state
  text.style.display  = 'none';
  arrow.style.display = 'none';
  dots.style.display  = 'flex';
  btn.style.pointerEvents = 'none';

  // Step 2 — Red circle expand from center (after 800ms)
  setTimeout(() => {
    const overlay = document.getElementById('transitionOverlay');
    overlay.classList.add('expanding');

    // Step 3 — Show onboarding page (after circle covers screen)
    setTimeout(() => {
      overlay.classList.add('expanded');

      // Step 4 — Redirect to onboarding page
      setTimeout(() => {
        // Test mode — login check skip, direct onboarding
window.location.href = 'onboarding.html';
      }, 400);

    }, 700);

  }, 800);
}

// Animate dashboard elements one by one
function animateDashboard() {
  const elements = [
    { el: document.getElementById('dashWelcome'), delay: 100 },
    { el: document.getElementById('dashTitle'),   delay: 250 },
    { el: document.getElementById('dashCards'),   delay: 450 },
    { el: document.getElementById('dashBack'),    delay: 650 },
  ];

  elements.forEach(({ el, delay }) => {
    setTimeout(() => {
      el.style.animation = 'dashFadeUp 0.6s ease forwards';
    }, delay);
  });
}

// ── Go back to login
function goBack() {
  const overlay = document.getElementById('transitionOverlay');
  const loginPage = document.getElementById('loginPage');
  const dashPage  = document.getElementById('dashboardPage');

  // Reset overlay
  overlay.style.display   = 'block';
  overlay.style.opacity   = '1';
  overlay.style.transition = 'none';
  overlay.classList.add('expanded');

  setTimeout(() => {
    overlay.style.transition = 'opacity 0.4s ease';
    overlay.style.opacity = '0';
    loginPage.style.opacity = '1';
    dashPage.classList.remove('visible');

    // Reset dashboard elements
    ['dashWelcome','dashTitle','dashCards','dashBack'].forEach(id => {
      document.getElementById(id).style.animation = 'none';
      document.getElementById(id).style.opacity = '0';
    });

    // Reset button
    const btn   = document.getElementById('submitBtn');
    const text  = document.getElementById('btnText');
    const arrow = document.getElementById('btnArrow');
    const dots  = document.getElementById('btnDots');
    text.style.display  = 'inline';
    arrow.style.display = 'inline';
    dots.style.display  = 'none';
    btn.style.pointerEvents = 'auto';

    setTimeout(() => {
      overlay.style.display = 'none';
      overlay.classList.remove('expanding','expanded');
      overlay.style.transition = 'none';
      overlay.style.opacity = '1';
    }, 400);
  }, 100);
}
