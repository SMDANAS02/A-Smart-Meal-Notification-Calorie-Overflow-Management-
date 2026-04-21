// ─────────────────────────────────────────
// PROGRESS PAGE — Daily Calories History Chart
// ─────────────────────────────────────────

const API_BASE = 'http://localhost:3000/api';
const token = localStorage.getItem('fitai_token');

// Redirect if not authenticated
if (!token) {
  window.location.href = 'login.html';
}

// ─────────────────────────────────────────
// STATE MANAGEMENT
// ─────────────────────────────────────────

/**
 * Global state object for the progress page
 * @type {Object}
 * @property {number} period - Selected time period (7 or 30 days)
 * @property {Array} data - Array of DailyCalorieData objects
 * @property {Object} selectedDay - Currently selected day for tooltip
 * @property {boolean} isLoading - Loading state flag
 * @property {string} error - Error message if any
 * @property {Object} userProfile - User profile with calorie target
 * @property {number} animationProgress - Animation progress (0-1)
 */
const STATE = {
  period: parseInt(localStorage.getItem('fitai_history_period')) || 7,
  data: [],
  selectedDay: null,
  isLoading: false,
  error: null,
  userProfile: null,
  animationProgress: 0,
};

// ─────────────────────────────────────────
// INITIALIZATION
// ─────────────────────────────────────────

/**
 * Initialize the progress page on DOM load
 * Sets up navigation, event listeners, and loads history data
 */
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  setupEventListeners();
  loadHistoryData();
});

// ─────────────────────────────────────────
// SETUP FUNCTIONS
// ─────────────────────────────────────────

/**
 * Setup navigation bar with user information
 * Displays user name and avatar, sets active nav link
 */
function setupNavigation() {
  const name = JSON.parse(localStorage.getItem('fitai_user'))?.name || 'User';
  document.getElementById('navUser').textContent = name.toUpperCase();
  document.getElementById('navAvatar').textContent = name.charAt(0).toUpperCase();

  // Set active nav link
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
    if (link.href.includes('progress.html')) {
      link.classList.add('active');
    }
  });
}

/**
 * Setup event listeners for interactive elements
 * Handles time toggle, retry button, and window resize
 */
function setupEventListeners() {
  // Time toggle buttons
  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const newPeriod = parseInt(e.target.dataset.period);
      if (newPeriod !== STATE.period) {
        STATE.period = newPeriod;
        localStorage.setItem('fitai_history_period', newPeriod);
        updateToggleButtons();
        loadHistoryData();
      }
    });
  });

  // Retry button
  document.getElementById('retryBtn').addEventListener('click', loadHistoryData);

  // Window resize (debounced)
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (STATE.data.length > 0) {
        renderChart();
      }
    }, 250);
  });
}

/**
 * Update toggle button active states
 * Highlights the currently selected time period
 */
function updateToggleButtons() {
  document.querySelectorAll('.toggle-btn').forEach(btn => {
    const period = parseInt(btn.dataset.period);
    btn.classList.toggle('active', period === STATE.period);
  });
}

// ─────────────────────────────────────────
// DATA FETCHING
// ─────────────────────────────────────────

/**
 * Load history data from API
 * Fetches user profile and meal data for selected period
 * Transforms data and renders chart
 * @async
 */
async function loadHistoryData() {
  STATE.isLoading = true;
  STATE.error = null;
  showLoadingState();

  try {
    // Fetch user profile for calorie target
    if (!STATE.userProfile) {
      const profileRes = await fetch(`${API_BASE}/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!profileRes.ok) throw new Error('Failed to fetch profile');
      const profileData = await profileRes.json();
      STATE.userProfile = profileData.profile;
    }

    // Get date range
    const dates = getDateRange(STATE.period);

    // Fetch meal data for all dates in parallel
    const promises = dates.map(date =>
      fetch(`${API_BASE}/meals?date=${date}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .catch(err => {
          console.error(`Failed to fetch meals for ${date}:`, err);
          return { date, meals: [], totals: { calories: 0, protein: 0, carbs: 0, fat: 0 } };
        })
    );

    const responses = await Promise.all(promises);

    // Transform responses into DailyCalorieData
    STATE.data = responses.map((response, index) => {
      const date = dates[index];
      const totals = response.totals || { calories: 0, protein: 0, carbs: 0, fat: 0 };
      const target = STATE.userProfile?.cal_target || 2000;
      const consumed = totals.calories || 0;

      return {
        date,
        label: formatDateLabel(date),
        consumed,
        target,
        protein: totals.protein || 0,
        carbs: totals.carbs || 0,
        fat: totals.fat || 0,
        status: getStatus(consumed, target),
        color: getBarColor(consumed, target),
      };
    });

    // Cache the data
    cacheHistoryData(STATE.data);

    // Render chart
    hideLoadingState();
    renderChart();

  } catch (err) {
    console.error('Load history error:', err);
    STATE.error = err.message || 'Failed to load history. Please refresh the page.';
    showErrorState(STATE.error);
  } finally {
    STATE.isLoading = false;
  }
}

// ─────────────────────────────────────────
// DATE UTILITIES
// ─────────────────────────────────────────

/**
 * Get array of dates for the selected period
 * @param {number} period - Number of days (7 or 30)
 * @returns {Array<string>} Array of YYYY-MM-DD date strings in IST
 */
function getDateRange(period) {
  const dates = [];
  for (let i = period - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    dates.push(dateStr);
  }
  return dates;
}

/**
 * Format date string to short label (e.g., "Mon 15")
 * @param {string} dateStr - YYYY-MM-DD date string
 * @returns {string} Formatted date label
 */
function formatDateLabel(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  return `${day} ${month}`;
}

/**
 * Format date string to full label (e.g., "Monday, January 15")
 * @param {string} dateStr - YYYY-MM-DD date string
 * @returns {string} Formatted full date label
 */
function formatDateFull(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  const options = { weekday: 'long', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

// ─────────────────────────────────────────
// STATUS & COLOR LOGIC
// ─────────────────────────────────────────

/**
 * Determine status based on consumed vs target calories
 * @param {number} consumed - Consumed calories
 * @param {number} target - Target calories
 * @returns {string} Status: ON_TARGET, OVER, UNDER, or NO_DATA
 */
function getStatus(consumed, target) {
  if (consumed === 0) return 'NO_DATA';

  const percentage = consumed / target;

  if (percentage >= 0.95 && percentage <= 1.05) {
    return 'ON_TARGET';
  } else if (percentage > 1.05) {
    return 'OVER';
  } else {
    return 'UNDER';
  }
}

/**
 * Get bar color based on status
 * @param {number} consumed - Consumed calories
 * @param {number} target - Target calories
 * @returns {string} Hex color code
 */
function getBarColor(consumed, target) {
  if (consumed === 0) return '#333333'; // Grey
  if (getStatus(consumed, target) === 'ON_TARGET') return '#22c55e'; // Green
  if (getStatus(consumed, target) === 'OVER') return '#E8000D'; // Red
  return '#eab308'; // Yellow
}

// ─────────────────────────────────────────
// CHART RENDERING
// ─────────────────────────────────────────

/**
 * Render SVG bar chart with responsive sizing
 * Draws bars, labels, target line, and axes
 */
function renderChart() {
  const svg = document.getElementById('historyChart');
  svg.innerHTML = ''; // Clear previous chart

  if (STATE.data.length === 0) {
    svg.innerHTML = '<text x="500" y="200" text-anchor="middle" fill="#999">No data available</text>';
    return;
  }

  const width = svg.clientWidth || 1000;
  const height = svg.clientHeight || 400;
  const margin = { top: 30, right: 30, bottom: 80, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Calculate max calories for scaling
  const maxCalories = Math.max(
    ...STATE.data.map(d => Math.max(d.consumed, d.target)),
    STATE.userProfile?.cal_target || 2000
  ) * 1.1; // Add 10% padding

  // Create main group
  const mainGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  mainGroup.setAttribute('transform', `translate(${margin.left},${margin.top})`);

  // Draw target reference line
  const targetY = chartHeight - (STATE.userProfile?.cal_target || 2000) / maxCalories * chartHeight;
  const targetLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  targetLine.setAttribute('class', 'target-line');
  targetLine.setAttribute('x1', '0');
  targetLine.setAttribute('y1', targetY);
  targetLine.setAttribute('x2', chartWidth);
  targetLine.setAttribute('y2', targetY);
  mainGroup.appendChild(targetLine);

  // Draw target label
  const targetLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  targetLabel.setAttribute('class', 'target-label');
  targetLabel.setAttribute('x', chartWidth + 5);
  targetLabel.setAttribute('y', targetY + 4);
  targetLabel.textContent = `${STATE.userProfile?.cal_target || 2000} KCAL TARGET`;
  mainGroup.appendChild(targetLabel);

  // Draw bars
  const barWidth = chartWidth / STATE.data.length * 0.7;
  const barSpacing = chartWidth / STATE.data.length;

  STATE.data.forEach((day, index) => {
    const barX = index * barSpacing + (barSpacing - barWidth) / 2;
    const barHeight = (day.consumed / maxCalories) * chartHeight;
    const barY = chartHeight - barHeight;

    // Bar rectangle
    const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bar.setAttribute('class', 'bar');
    bar.setAttribute('x', barX);
    bar.setAttribute('y', barY);
    bar.setAttribute('width', barWidth);
    bar.setAttribute('height', barHeight);
    bar.setAttribute('fill', day.color);
    bar.setAttribute('rx', '4');
    bar.setAttribute('data-index', index);

    // Add hover event
    bar.addEventListener('mouseenter', (e) => showTooltip(e, day, barX + barWidth / 2, barY));
    bar.addEventListener('mouseleave', hideTooltip);

    mainGroup.appendChild(bar);

    // Bar label (calorie value)
    if (day.consumed > 0) {
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('class', 'bar-label');
      label.setAttribute('x', barX + barWidth / 2);
      label.setAttribute('y', barY - 8);
      label.textContent = Math.round(day.consumed);
      mainGroup.appendChild(label);
    }

    // X-axis label - rotated for clarity
    const xLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    xLabel.setAttribute('class', 'axis-label');
    xLabel.setAttribute('x', barX + barWidth / 2);
    xLabel.setAttribute('y', chartHeight + 10);
    xLabel.setAttribute('text-anchor', 'start');
    xLabel.setAttribute('transform', `rotate(45 ${barX + barWidth / 2} ${chartHeight + 10})`);
    xLabel.textContent = day.label;
    mainGroup.appendChild(xLabel);
  });

  // Draw Y-axis labels
  const ySteps = 5;
  for (let i = 0; i <= ySteps; i++) {
    const value = Math.round((maxCalories / ySteps) * i);
    const y = chartHeight - (value / maxCalories) * chartHeight;

    const yLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    yLabel.setAttribute('class', 'y-axis-label');
    yLabel.setAttribute('x', -10);
    yLabel.setAttribute('y', y + 4);
    yLabel.textContent = value;
    mainGroup.appendChild(yLabel);
  }

  svg.appendChild(mainGroup);

  // Animate bars
  animateBars();
}

// ─────────────────────────────────────────
// ANIMATION
// ─────────────────────────────────────────

function animateBars() {
  const bars = document.querySelectorAll('.bar');
  const duration = 600;
  const startTime = performance.now();

  function animate(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Cubic-bezier easing: cubic-bezier(0.4, 0, 0.2, 1)
    const eased = cubicBezier(0.4, 0, 0.2, 1, progress);

    bars.forEach((bar, index) => {
      const staggerDelay = index * 30; // 30ms per bar
      const barProgress = Math.max(0, eased - (staggerDelay / duration));

      if (barProgress > 0) {
        const originalHeight = parseFloat(bar.getAttribute('data-height') || bar.getAttribute('height'));
        const originalY = parseFloat(bar.getAttribute('data-y') || bar.getAttribute('y'));

        if (!bar.hasAttribute('data-height')) {
          bar.setAttribute('data-height', bar.getAttribute('height'));
          bar.setAttribute('data-y', bar.getAttribute('y'));
        }

        const animatedHeight = originalHeight * barProgress;
        const animatedY = originalY + (originalHeight - animatedHeight);

        bar.setAttribute('height', animatedHeight);
        bar.setAttribute('y', animatedY);
      }
    });

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }

  requestAnimationFrame(animate);
}

function cubicBezier(p0, p1, p2, p3, t) {
  const mt = 1 - t;
  return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
}

// ─────────────────────────────────────────
// TOOLTIP
// ─────────────────────────────────────────

let tooltipTimeout;

function showTooltip(event, day, x, y) {
  clearTimeout(tooltipTimeout);

  const tooltip = document.getElementById('tooltip');
  const remaining = day.target - day.consumed;
  const over = day.consumed - day.target;

  let statusText = '';
  let statusClass = '';

  if (day.status === 'ON_TARGET') {
    statusText = '✓ ON TARGET';
    statusClass = 'on-target';
  } else if (day.status === 'OVER') {
    statusText = '⚠ OVER TARGET';
    statusClass = 'over';
  } else if (day.status === 'UNDER') {
    statusText = '— UNDER TARGET';
    statusClass = 'under';
  } else {
    statusText = '— NO DATA';
    statusClass = 'no-data';
  }

  const macroPercentages = calculateMacroPercentages(day);

  tooltip.innerHTML = `
    <div class="tooltip-date">${formatDateFull(day.date)}</div>
    <div class="tooltip-status ${statusClass}">${statusText}</div>
    
    <div class="tooltip-calories">
      <span class="tooltip-calories-label">Consumed:</span>
      <span class="tooltip-calories-value">${Math.round(day.consumed)} kcal</span>
    </div>
    
    <div class="tooltip-calories">
      <span class="tooltip-calories-label">Target:</span>
      <span class="tooltip-calories-value">${day.target} kcal</span>
    </div>
    
    <div class="tooltip-remaining">
      ${day.status === 'OVER' ? `<strong>${Math.round(over)} kcal over</strong>` : `<strong>${Math.round(remaining)} kcal remaining</strong>`}
    </div>
    
    <div class="tooltip-macros">
      <div class="tooltip-macros-title">Macros</div>
      
      <div class="macro-item">
        <span class="macro-label">Protein:</span>
        <span class="macro-value">${Math.round(day.protein)}g</span>
      </div>
      <div class="macro-bar">
        <div class="macro-bar-segment macro-protein" style="width: ${macroPercentages.protein}%"></div>
      </div>
      
      <div class="macro-item">
        <span class="macro-label">Carbs:</span>
        <span class="macro-value">${Math.round(day.carbs)}g</span>
      </div>
      <div class="macro-bar">
        <div class="macro-bar-segment macro-carbs" style="width: ${macroPercentages.carbs}%"></div>
      </div>
      
      <div class="macro-item">
        <span class="macro-label">Fat:</span>
        <span class="macro-value">${Math.round(day.fat)}g</span>
      </div>
      <div class="macro-bar">
        <div class="macro-bar-segment macro-fat" style="width: ${macroPercentages.fat}%"></div>
      </div>
    </div>
  `;

  // Position tooltip
  const chartContainer = document.querySelector('.chart-container');
  const rect = chartContainer.getBoundingClientRect();

  let tooltipX = x + rect.left - tooltip.offsetWidth / 2;
  let tooltipY = y + rect.top - tooltip.offsetHeight - 10;

  // Adjust if tooltip goes off-screen
  if (tooltipX < rect.left) tooltipX = rect.left + 10;
  if (tooltipX + tooltip.offsetWidth > rect.right) tooltipX = rect.right - tooltip.offsetWidth - 10;
  if (tooltipY < rect.top) tooltipY = y + rect.top + 10;

  tooltip.style.left = tooltipX + 'px';
  tooltip.style.top = tooltipY + 'px';
  tooltip.style.display = 'block';
}

function hideTooltip() {
  tooltipTimeout = setTimeout(() => {
    document.getElementById('tooltip').style.display = 'none';
  }, 100);
}

function calculateMacroPercentages(day) {
  const total = day.protein + day.carbs + day.fat;
  if (total === 0) return { protein: 0, carbs: 0, fat: 0 };

  return {
    protein: (day.protein / total) * 100,
    carbs: (day.carbs / total) * 100,
    fat: (day.fat / total) * 100,
  };
}

// ─────────────────────────────────────────
// UI STATE MANAGEMENT
// ─────────────────────────────────────────

function showLoadingState() {
  document.getElementById('loadingState').style.display = 'flex';
  document.getElementById('errorState').style.display = 'none';
  document.querySelector('.chart-wrapper').style.display = 'none';
}

function hideLoadingState() {
  document.getElementById('loadingState').style.display = 'none';
  document.querySelector('.chart-wrapper').style.display = 'block';
}

function showErrorState(message) {
  document.getElementById('errorMessage').textContent = message;
  document.getElementById('errorState').style.display = 'block';
  document.getElementById('loadingState').style.display = 'none';
  document.querySelector('.chart-wrapper').style.display = 'none';
}

// ─────────────────────────────────────────
// CACHING
// ─────────────────────────────────────────

function cacheHistoryData(data) {
  try {
    const cacheData = {
      data,
      timestamp: Date.now(),
      period: STATE.period,
    };
    localStorage.setItem('fitai_history_cache', JSON.stringify(cacheData));
  } catch (err) {
    console.warn('Failed to cache history data:', err);
  }
}

function getCachedHistoryData() {
  try {
    const cached = localStorage.getItem('fitai_history_cache');
    if (!cached) return null;

    const cacheData = JSON.parse(cached);
    const now = Date.now();
    const ttl = 3600000; // 1 hour

    // Check if cache is still valid
    if (now - cacheData.timestamp < ttl && cacheData.period === STATE.period) {
      return cacheData.data;
    }
  } catch (err) {
    console.warn('Failed to retrieve cached history data:', err);
  }

  return null;
}

// ─────────────────────────────────────────
// EXPORT FUNCTIONALITY
// ─────────────────────────────────────────

function exportToCSV() {
  if (STATE.data.length === 0) {
    alert('No data to export');
    return;
  }

  // Generate CSV content
  let csv = 'Date,Consumed (kcal),Target (kcal),Protein (g),Carbs (g),Fat (g)\n';

  STATE.data.forEach(day => {
    csv += `"${day.date}",${Math.round(day.consumed)},${day.target},${Math.round(day.protein)},${Math.round(day.carbs)},${Math.round(day.fat)}\n`;
  });

  // Add summary
  csv += '\n\nSummary\n';
  csv += `Period,${STATE.period} days\n`;
  csv += `Generated,${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}\n`;
  csv += `Exported from FitAI\n`;

  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `fitai_history_${timestamp}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Setup export button
document.addEventListener('DOMContentLoaded', () => {
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', exportToCSV);
  }
});
