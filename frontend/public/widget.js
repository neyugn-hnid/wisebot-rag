(function () {
  var currentScript = document.currentScript;
  if (!currentScript) {
    return;
  }

  var widgetCode = currentScript.getAttribute('data-id');
  if (!widgetCode) {
    console.error('[WiseBot] Missing data-id attribute.');
    return;
  }

  var scriptUrl = new URL(currentScript.src, window.location.href);
  var apiBase = currentScript.getAttribute('data-api-base') || scriptUrl.origin;
  var apiUrl = apiBase.replace(/\/$/, '') + '/api/widget/public/widgets/code/' + encodeURIComponent(widgetCode);
  var widgetSessionStorageKey = 'wisebot_widget_analytics_session_v2_' + widgetCode;
  var chatSessionStorageKey = 'wisebot_chat_session_v2_' + widgetCode;
  var state = {
    config: null,
    widgetSessionId: window.localStorage.getItem(widgetSessionStorageKey) || '',
    chatSessionId: window.localStorage.getItem(chatSessionStorageKey) || '',
    isOpen: false,
    messages: [],
    isReplying: false,
  };

  var defaults = {
    primaryColor: '#2563EB',
    position: 'right',
    iconColor: '#ffffff',
    selectedIconId: 'bot',
    customIconUrl: null,
  };

  var style = document.createElement('style');
  style.textContent = [
    '.wisebot-widget-root{position:fixed;bottom:24px;z-index:2147483000;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}',
    '.wisebot-widget-root[data-position="left"]{left:24px;}',
    '.wisebot-widget-root[data-position="right"]{right:24px;}',
    '.wisebot-bubble{width:64px;height:64px;border-radius:20px;border:none;cursor:pointer;box-shadow:0 18px 45px rgba(15,23,42,.28);display:flex;align-items:center;justify-content:center;color:#fff;transition:transform .18s ease,box-shadow .18s ease;}',
    '.wisebot-bubble img{width:100%;height:100%;object-fit:cover;border-radius:20px;}',
    '.wisebot-bubble:hover{transform:translateY(-2px) scale(1.03);box-shadow:0 22px 55px rgba(15,23,42,.34);}',
    '.wisebot-bubble:active{transform:scale(.96);}',
    '.wisebot-panel{width:380px;max-width:calc(100vw - 32px);height:590px;max-height:calc(100vh - 104px);background:#fff;border-radius:22px;overflow:hidden;box-shadow:0 24px 70px rgba(15,23,42,.22);display:flex;flex-direction:column;border:1px solid rgba(203,213,225,.85);}',
    '.wisebot-header{padding:14px 16px;display:flex;align-items:center;justify-content:space-between;color:#fff;}',
    '.wisebot-header-main{display:flex;align-items:center;gap:12px;}',
    '.wisebot-avatar{width:44px;height:44px;border-radius:9999px;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;overflow:hidden;flex:none;font-weight:800;box-shadow:0 1px 2px rgba(15,23,42,.10);}',
    '.wisebot-avatar img{width:100%;height:100%;object-fit:cover;}',
    '.wisebot-title{font-size:14px;font-weight:800;line-height:1.1;letter-spacing:0;color:#fff;}',
    '.wisebot-status{margin-top:5px;display:inline-flex;align-items:center;gap:6px;border-radius:999px;background:rgba(255,255,255,.14);padding:3px 8px;font-size:10px;font-weight:700;opacity:.95;}',
    '.wisebot-status-dot{width:6px;height:6px;border-radius:999px;background:#6ee7b7;display:inline-block;}',
    '.wisebot-close{border:none;background:transparent;color:inherit;font-size:22px;cursor:pointer;line-height:1;border-radius:10px;padding:7px 9px;transition:background .15s ease;}',
    '.wisebot-close:hover{background:rgba(255,255,255,.12);}',
    '.wisebot-body{flex:1;padding:16px;background:#f6f7f9;overflow:auto;display:flex;flex-direction:column;gap:12px;}',
    '.wisebot-day{align-self:center;border-radius:999px;background:#fff;color:#94a3b8;font-size:10px;font-weight:700;padding:4px 12px;border:1px solid rgba(226,232,240,.85);box-shadow:0 1px 2px rgba(15,23,42,.04);}',
    '.wisebot-msg{max-width:85%;padding:12px 14px;border-radius:16px;font-size:14px;line-height:1.45;white-space:pre-wrap;box-shadow:0 1px 2px rgba(15,23,42,.05);}',
    '.wisebot-msg.bot{background:#fff;color:#0f172a;border-top-left-radius:5px;border:1px solid rgba(226,232,240,.9);}',
    '.wisebot-msg.user{color:#fff;border-top-right-radius:5px;align-self:flex-end;}',
    '.wisebot-typing{display:inline-flex;gap:4px;align-items:center;}',
    '.wisebot-typing span{width:6px;height:6px;border-radius:999px;background:#94a3b8;animation:wisebotTyping 1s infinite ease-in-out;}',
    '.wisebot-typing span:nth-child(2){animation-delay:.15s}.wisebot-typing span:nth-child(3){animation-delay:.3s}',
    '@keyframes wisebotTyping{0%,80%,100%{transform:translateY(0);opacity:.35}40%{transform:translateY(-3px);opacity:1}}',
    '.wisebot-input-wrap{padding:14px 16px;border-top:1px solid rgba(226,232,240,.85);background:#fff;}',
    '.wisebot-input-row{display:flex;gap:8px;align-items:center;background:#f6f7f9;border-radius:18px;padding:6px 8px;border:1px solid #e2e8f0;box-shadow:0 1px 2px rgba(15,23,42,.04);transition:background .15s ease,border-color .15s ease;}',
    '.wisebot-input-row:focus-within{background:#fff;border-color:#cbd5e1;}',
    '.wisebot-input{flex:1;border:none;background:transparent;outline:none;font-size:14px;color:#0f172a;}',
    '.wisebot-input::placeholder{color:#94a3b8;}',
    '.wisebot-send{border:none;background:transparent;cursor:pointer;font-size:18px;padding:7px;border-radius:999px;line-height:1;transition:opacity .15s ease,transform .15s ease;}',
    '.wisebot-send:hover{opacity:.82;transform:translateX(1px);}',
    '.wisebot-powered{margin-top:9px;text-align:center;font-size:10px;color:#64748b;letter-spacing:.01em;}',
    '@media (max-width:640px){.wisebot-widget-root{bottom:16px}.wisebot-widget-root[data-position="left"]{left:16px}.wisebot-widget-root[data-position="right"]{right:16px}.wisebot-panel{width:calc(100vw - 32px);height:min(72vh,620px);max-height:calc(100dvh - 96px);border-radius:22px;}.wisebot-bubble{width:60px;height:60px;border-radius:18px;}}'
  ].join('');
  document.head.appendChild(style);

  var root = document.createElement('div');
  root.className = 'wisebot-widget-root';
  document.body.appendChild(root);

  function createEl(tag, className, text) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (typeof text === 'string') el.textContent = text;
    return el;
  }

  function postJson(url, payload) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(function (response) {
      if (!response.ok) {
        throw new Error('Request failed');
      }
      return response.json();
    });
  }

  function getVisitorId() {
    var visitorId = window.localStorage.getItem('wisebot_widget_visitor_id');
    if (!visitorId) {
      visitorId = 'visitor_' + Math.random().toString(36).slice(2, 12);
      window.localStorage.setItem('wisebot_widget_visitor_id', visitorId);
    }
    return visitorId;
  }

  function ensureWidgetSession(widget) {
    if (state.widgetSessionId) {
      return Promise.resolve(state.widgetSessionId);
    }

    return postJson(apiUrl + '/sessions', {
      tenantId: widget.tenantId,
      visitorId: getVisitorId(),
      sourceUrl: window.location.href,
      referrerUrl: document.referrer || null,
      userAgent: navigator.userAgent,
    }).then(function (payload) {
      state.widgetSessionId = payload && payload.data && payload.data.id ? payload.data.id : '';
      if (state.widgetSessionId) {
        window.localStorage.setItem(widgetSessionStorageKey, state.widgetSessionId);
      }
      return state.widgetSessionId;
    }).catch(function () {
      return '';
    });
  }

  function ensureChatSession(widget) {
    if (state.chatSessionId) {
      return Promise.resolve(state.chatSessionId);
    }

    return postJson(apiBase.replace(/\/$/, '') + '/api/chat/public/widgets/' + encodeURIComponent(widget.id) + '/sessions', {
      tenantId: widget.tenantId,
      visitorId: getVisitorId(),
      title: 'Website Widget Chat',
    }).then(function (payload) {
      state.chatSessionId = payload && payload.data && payload.data.id ? payload.data.id : '';
      if (state.chatSessionId) {
        window.localStorage.setItem(chatSessionStorageKey, state.chatSessionId);
      }
      return state.chatSessionId;
    }).catch(function () {
      return '';
    });
  }

  function askAssistant(widget, question) {
    state.isReplying = true;
    render();
    return ensureChatSession(widget).then(function (sessionId) {
      if (!sessionId) {
        throw new Error('Missing widget chat session');
      }

      return postJson(apiBase.replace(/\/$/, '') + '/api/chat/public/sessions/' + encodeURIComponent(sessionId) + '/ask', {
        tenantId: widget.tenantId,
        widgetId: widget.id,
        question: question,
        knowledgeBaseId: widget.appearanceConfig && widget.appearanceConfig.knowledgeBaseId ? widget.appearanceConfig.knowledgeBaseId : null,
        topK: widget.appearanceConfig && widget.appearanceConfig.topK ? widget.appearanceConfig.topK : 5,
        temperature: widget.appearanceConfig && widget.appearanceConfig.temperature != null ? widget.appearanceConfig.temperature : 0.2,
      });
    }).then(function (payload) {
      var answer = payload && payload.data && payload.data.answer ? payload.data.answer : 'I could not generate a response.';
      state.messages.push({ role: 'bot', content: answer });
      state.isReplying = false;
      render();
      trackEvent(widget, 'ANSWER_RECEIVED', { sourceUrl: window.location.href });
    }).catch(function (error) {
      state.messages.push({ role: 'bot', content: 'The assistant is temporarily unavailable. Please try again.' });
      state.isReplying = false;
      render();
      console.error('[WiseBot] Ask failed.', error);
    });
  }

  function trackEvent(widget, eventType, extraPayload) {
    ensureWidgetSession(widget).then(function (sessionId) {
      return postJson(apiUrl + '/events', {
        tenantId: widget.tenantId,
        sessionId: sessionId || null,
        eventType: eventType,
        payload: JSON.stringify(extraPayload || {}),
      });
    }).catch(function () {
      return null;
    });
  }

  function getIconSvg(iconId, size) {
    var iconSize = size || 20;
    var common = 'width="' + iconSize + '" height="' + iconSize + '" viewBox="0 0 24 24" fill="none" aria-hidden="true"';
    var icons = {
      bot: '<svg ' + common + '><rect x="5" y="7" width="14" height="11" rx="3" stroke="currentColor" stroke-width="1.8"/><path d="M12 4v3M9 4h6M9 12h.01M15 12h.01M9.5 15h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
      sparkles: '<svg ' + common + '><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3ZM5 15l.8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8L5 15ZM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
      brain: '<svg ' + common + '><path d="M9 4.5a3 3 0 0 0-3 3 3 3 0 0 0-1.5 5.6A3.3 3.3 0 0 0 8 18h1V4.5ZM15 4.5a3 3 0 0 1 3 3 3 3 0 0 1 1.5 5.6A3.3 3.3 0 0 1 16 18h-1V4.5Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M9 8H7.5M15 8h1.5M9 12H7M15 12h2M9 16H7.5M15 16h1.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
      cpu: '<svg ' + common + '><rect x="7" y="7" width="10" height="10" rx="2" stroke="currentColor" stroke-width="1.8"/><rect x="10" y="10" width="4" height="4" rx="1" stroke="currentColor" stroke-width="1.6"/><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
      message: '<svg ' + common + '><path d="M7.5 18.5 4 21v-4.4A7.7 7.7 0 0 1 2.5 12C2.5 7.6 6.5 4 11.5 4s9 3.6 9 8-4 8-9 8a10.2 10.2 0 0 1-4-.8Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8 11.5h7.5M8 14.5h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
      zap: '<svg ' + common + '><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
      smile: '<svg ' + common + '><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M8.5 10h.01M15.5 10h.01M8 14c1 1.5 2.3 2.2 4 2.2s3-.7 4-2.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
      star: '<svg ' + common + '><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.2l-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
      user: '<svg ' + common + '><path d="M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    };
    return icons[iconId] || icons.bot;
  }

  function renderAvatar(container, config, name, size) {
    container.innerHTML = '';
    if (config.selectedIconId === 'custom' && config.customIconUrl) {
      var image = document.createElement('img');
      image.src = config.customIconUrl;
      image.alt = name;
      container.appendChild(image);
      return;
    }
    container.innerHTML = getIconSvg(config.selectedIconId, size || 20);
  }

  function renderBubbleIcon(container) {
    container.innerHTML = '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7.5 18.5 4 21v-4.4A7.7 7.7 0 0 1 2.5 12C2.5 7.6 6.5 4 11.5 4s9 3.6 9 8-4 8-9 8a10.2 10.2 0 0 1-4-.8Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8 11.5h7.5M8 14.5h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  }

  function renderSendIcon(container) {
    container.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m4 12 16-8-5 16-3.2-6.8L4 12Z" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/><path d="m11.8 13.2 3.4-3.4" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>';
  }

  function render() {
    if (!state.config) {
      return;
    }

    var widget = state.config;
    var config = Object.assign({}, defaults, widget.appearanceConfig || {});
    root.setAttribute('data-position', config.position === 'left' ? 'left' : 'right');
    root.innerHTML = '';

    if (!state.isOpen) {
      var bubble = createEl('button', 'wisebot-bubble', null);
      bubble.style.background = config.primaryColor;
      renderAvatar(bubble, config, widget.name, 30);
      bubble.addEventListener('click', function () {
        state.isOpen = true;
        render();
        trackEvent(widget, 'WIDGET_OPENED', { sourceUrl: window.location.href });
      });
      root.appendChild(bubble);
      return;
    }

    var panel = createEl('div', 'wisebot-panel', null);
    var header = createEl('div', 'wisebot-header', null);
    header.style.background = config.primaryColor;

    var headerMain = createEl('div', 'wisebot-header-main', null);
    var avatar = createEl('div', 'wisebot-avatar', null);
    avatar.style.color = config.iconColor;
    renderAvatar(avatar, config, widget.name, 21);

    var titleWrap = createEl('div', '', null);
    var title = createEl('div', 'wisebot-title', widget.name || 'WiseBot Assistant');
    var status = createEl('div', 'wisebot-status', null);
    status.appendChild(createEl('span', 'wisebot-status-dot', null));
    status.appendChild(document.createTextNode('Online'));
    titleWrap.appendChild(title);
    titleWrap.appendChild(status);
    headerMain.appendChild(avatar);
    headerMain.appendChild(titleWrap);

    var close = createEl('button', 'wisebot-close', '×');
    close.addEventListener('click', function () {
      state.isOpen = false;
      render();
    });

    header.appendChild(headerMain);
    header.appendChild(close);

    var body = createEl('div', 'wisebot-body', null);
    body.appendChild(createEl('div', 'wisebot-day', 'WiseBot'));
    if (!state.messages.length) {
      state.messages.push({ role: 'bot', content: widget.welcomeMessage || 'Hello! How can I help you today?' });
    }
    state.messages.forEach(function (message) {
      var msg = createEl('div', 'wisebot-msg ' + message.role, message.content);
      if (message.role === 'user') {
        msg.style.background = config.primaryColor;
      }
      body.appendChild(msg);
    });
    if (state.isReplying) {
      var thinking = createEl('div', 'wisebot-msg bot', null);
      thinking.innerHTML = '<span class="wisebot-typing"><span></span><span></span><span></span></span>';
      body.appendChild(thinking);
    }

    var inputWrap = createEl('div', 'wisebot-input-wrap', null);
    var inputRow = createEl('div', 'wisebot-input-row', null);
    var input = createEl('input', 'wisebot-input', null);
    input.type = 'text';
    input.placeholder = 'Type your message...';
    var send = createEl('button', 'wisebot-send', null);
    send.style.color = config.primaryColor;
    renderSendIcon(send);

    function submitMessage() {
      var value = input.value.trim();
      if (!value || state.isReplying) {
        return;
      }
      state.messages.push({ role: 'user', content: value });
      input.value = '';
      render();
      trackEvent(widget, 'MESSAGE_SENT', { message: value, sourceUrl: window.location.href });
      askAssistant(widget, value);
    }

    send.addEventListener('click', submitMessage);
    input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        submitMessage();
      }
    });

    inputRow.appendChild(input);
    inputRow.appendChild(send);
    inputWrap.appendChild(inputRow);
    inputWrap.appendChild(createEl('div', 'wisebot-powered', 'Powered by WiseBot'));

    panel.appendChild(header);
    panel.appendChild(body);
    panel.appendChild(inputWrap);
    root.appendChild(panel);
  }

  fetch(apiUrl)
    .then(function (response) {
      if (!response.ok) {
        throw new Error('Failed to load widget');
      }
      return response.json();
    })
    .then(function (payload) {
      state.config = payload && payload.data ? payload.data : null;
      if (!state.config) {
        throw new Error('Missing widget config');
      }
      render();
      trackEvent(state.config, 'WIDGET_LOADED', { sourceUrl: window.location.href });
    })
    .catch(function (error) {
      console.error('[WiseBot] Unable to initialize widget.', error);
    });
})();
