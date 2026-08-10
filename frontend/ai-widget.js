/**
 * FitAI Grok Assistant Chatbot Widget
 * Intelligent AI Chatbot powered by xAI Grok API
 */

(function () {
  'use strict';

  // State
  let chatHistory = [];
  let isPanelOpen = false;
  let isWaitingResponse = false;

  // DOM Elements
  let fab, panel, messagesFeed, inputField, sendBtn, keyDrawer, keyInput, keySaveBtn, keyToggleBtn;

  // Initialize widget when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }

  function initWidget() {
    // Prevent duplicate injection
    if (document.getElementById('aiChatFab')) return;

    // Inject CSS stylesheet link if not present
    if (!document.querySelector('link[href*="ai-widget.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'ai-widget.css';
      document.head.appendChild(link);
    }

    // Build DOM HTML
    const container = document.createElement('div');
    container.id = 'fitaiAiWidgetContainer';
    container.innerHTML = `
      <!-- Floating Circle FAB Button -->
      <button id="aiChatFab" aria-label="Open fitAi Assistant" title="fitAi Assistant">
        <svg class="fab-icon fab-icon-robot" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 9a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1H4zm3-2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1H7zm10 0a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-1zm3 2a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-1zM9 11h6v2H9v-2z"/>
        </svg>
        <svg class="fab-icon fab-icon-close" style="display:none;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
        <span class="fab-badge"></span>
      </button>

      <!-- Popup Chat Window Panel -->
      <div id="aiChatPanel">
        <!-- Header -->
        <div class="ai-header">
          <div class="ai-brand">
            <div class="ai-avatar-icon">⚡</div>
            <div class="ai-title-wrap">
              <span class="ai-title">FITAI ASSISTANT</span>
              <span class="ai-subtitle"><span class="ai-status-dot"></span> Powered by Groq AI / xAI</span>
            </div>
          </div>
          <div class="ai-controls">
            <button class="ai-btn-icon" id="aiKeyToggleBtn" title="Set Grok API Key">🔑</button>
            <button class="ai-btn-icon" id="aiCloseBtn" title="Close">✕</button>
          </div>
        </div>

        <!-- Grok Key Drawer -->
        <div class="ai-key-drawer" id="aiKeyDrawer">
          <div class="ai-key-label">
            <span>xAI / Groq API Key:</span>
            <small><a href="https://console.groq.com" target="_blank" style="color:#e8000d; text-decoration:none;">Get Key ↗</a></small>
          </div>
          <div class="ai-key-input-group">
            <input type="password" class="ai-key-input" id="aiKeyInput" placeholder="gsk_... or xai-..." />
            <button class="ai-key-save" id="aiKeySaveBtn">SAVE</button>
          </div>
        </div>

        <!-- Quick Suggestion Chips -->
        <div class="ai-chips-bar">
          <button class="ai-chip" data-msg="Add 2 eggs to breakfast">➕ Log 2 Eggs</button>
          <button class="ai-chip" data-msg="How many calories do I have left today?">📊 Calorie Status</button>
          <button class="ai-chip" data-msg="What did I eat earlier today?">🍽️ Meal History</button>
          <button class="ai-chip" data-msg="Log 1 apple 52 cal to snack">🍎 Log Apple</button>
        </div>

        <!-- Messages Feed -->
        <div class="ai-messages-feed" id="aiMessagesFeed">
          <!-- Initial bot greeting -->
          <div class="ai-msg ai-msg-bot">
            <div class="ai-msg-avatar">⚡</div>
            <div class="ai-msg-content">
              <div class="ai-msg-bubble">
                👋 Hello! I am your <strong>fitAi Calorie & Nutrition Assistant</strong>.
                <br/><br/>
                Ask me about your daily calories, meal plans, or tell me to log your meals!
                <br/><br/>
                <em>Try asking:</em><br/>
                • <em>"Add 2 eggs to breakfast"</em><br/>
                • <em>"How many calories remaining?"</em><br/>
                • <em>"What did I eat earlier?"</em>
              </div>
            </div>
          </div>
        </div>

        <!-- Input Box -->
        <div class="ai-input-area">
          <input type="text" class="ai-input-field" id="aiInputField" placeholder="Ask Grok or say 'Add 2 eggs to breakfast'..." />
          <button class="ai-send-btn" id="aiSendBtn" aria-label="Send">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    // Cache elements
    fab = document.getElementById('aiChatFab');
    panel = document.getElementById('aiChatPanel');
    messagesFeed = document.getElementById('aiMessagesFeed');
    inputField = document.getElementById('aiInputField');
    sendBtn = document.getElementById('aiSendBtn');
    keyDrawer = document.getElementById('aiKeyDrawer');
    keyInput = document.getElementById('aiKeyInput');
    keySaveBtn = document.getElementById('aiKeySaveBtn');
    keyToggleBtn = document.getElementById('aiKeyToggleBtn');

    // Load saved API key into input
    const savedKey = localStorage.getItem('fitai_grok_key') || '';
    if (savedKey) keyInput.value = savedKey;

    // Event listeners
    fab.addEventListener('click', togglePanel);
    document.getElementById('aiCloseBtn').addEventListener('click', togglePanel);

    keyToggleBtn.addEventListener('click', () => {
      keyDrawer.classList.toggle('open');
    });

    keySaveBtn.addEventListener('click', () => {
      const val = keyInput.value.trim();
      if (val) {
        localStorage.setItem('fitai_grok_key', val);
        addBotMessage("🔑 **Grok API Key saved successfully!** I will now use your Grok API key for responses.");
      } else {
        localStorage.removeItem('fitai_grok_key');
        addBotMessage("ℹ️ Grok API Key cleared.");
      }
      keyDrawer.classList.remove('open');
    });

    sendBtn.addEventListener('click', handleSendMessage);
    inputField.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSendMessage();
    });

    // Chip click handlers
    document.querySelectorAll('.ai-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const msg = chip.getAttribute('data-msg');
        if (msg) {
          inputField.value = msg;
          handleSendMessage();
        }
      });
    });
  }

  function togglePanel() {
    isPanelOpen = !isPanelOpen;
    if (isPanelOpen) {
      panel.classList.add('open');
      fab.classList.add('open');
      inputField.focus();
    } else {
      panel.classList.remove('open');
      fab.classList.remove('open');
    }
  }

  async function handleSendMessage() {
    const message = inputField.value.trim();
    if (!message || isWaitingResponse) return;

    inputField.value = '';
    addUserMessage(message);

    // Save history
    chatHistory.push({ role: 'user', content: message });

    showTypingIndicator();
    isWaitingResponse = true;

    try {
      const token = localStorage.getItem('fitai_token');
      const grokKey = localStorage.getItem('fitai_grok_key') || '';

      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          message,
          history: chatHistory,
          clientApiKey: grokKey
        })
      });

      removeTypingIndicator();
      isWaitingResponse = false;

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        addBotMessage(`⚠️ Error: ${errData.error || 'Server request failed'}`);
        return;
      }

      const data = await response.json();
      chatHistory.push({ role: 'assistant', content: data.reply });

      addBotMessage(data.reply, data.actionResult);

      // If action logged a food, trigger active page UI updates!
      if (data.actionResult && data.actionResult.success) {
        notifyPageDataChanged();
      }

    } catch (err) {
      removeTypingIndicator();
      isWaitingResponse = false;
      addBotMessage(`⚠️ Connection error: ${err.message}. Please check if the server is running.`);
    }
  }

  function addUserMessage(text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'ai-msg ai-msg-user';
    msgDiv.innerHTML = `
      <div class="ai-msg-avatar">U</div>
      <div class="ai-msg-content">
        <div class="ai-msg-bubble">${escapeHtml(text)}</div>
      </div>
    `;
    messagesFeed.appendChild(msgDiv);
    scrollToBottom();
  }

  function addBotMessage(text, actionResult = null) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'ai-msg ai-msg-bot';

    let actionCardHtml = '';
    if (actionResult && actionResult.success) {
      actionCardHtml = `
        <div class="ai-action-card">
          <span>✓</span>
          <span>${escapeHtml(actionResult.message)}</span>
        </div>
      `;
    }

    const formattedText = formatMarkdown(text);

    msgDiv.innerHTML = `
      <div class="ai-msg-avatar">⚡</div>
      <div class="ai-msg-content">
        <div class="ai-msg-bubble">${formattedText}${actionCardHtml}</div>
      </div>
    `;
    messagesFeed.appendChild(msgDiv);
    scrollToBottom();
  }

  function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'aiTypingIndicator';
    indicator.className = 'ai-msg ai-msg-bot';
    indicator.innerHTML = `
      <div class="ai-msg-avatar">⚡</div>
      <div class="ai-typing-indicator">
        <div class="ai-typing-dot"></div>
        <div class="ai-typing-dot"></div>
        <div class="ai-typing-dot"></div>
      </div>
    `;
    messagesFeed.appendChild(indicator);
    scrollToBottom();
  }

  function removeTypingIndicator() {
    const el = document.getElementById('aiTypingIndicator');
    if (el) el.remove();
  }

  function scrollToBottom() {
    messagesFeed.scrollTop = messagesFeed.scrollHeight;
  }

  function notifyPageDataChanged() {
    // Dispatch custom event for tracker.js / diet.js
    window.dispatchEvent(new CustomEvent('fitai:data-updated'));

    // Directly trigger window functions if available on tracker page
    if (typeof window.loadBackendData === 'function') {
      window.loadBackendData();
    }
  }

  function formatMarkdown(str) {
    if (!str) return '';
    let text = escapeHtml(str);
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    text = text.replace(/\n/g, '<br/>');
    return text;
  }

  function escapeHtml(unsafe) {
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

})();
