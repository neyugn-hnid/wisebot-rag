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
  var sessionStorageKey = 'wisebot_widget_session_' + widgetCode;
  var state = {
    config: null,
    sessionId: window.localStorage.getItem(sessionStorageKey) || '',
    isOpen: false,
    messages: [],
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
    '.wisebot-widget-root{position:fixed;bottom:24px;z-index:2147483000;font-family:Inter,system-ui,sans-serif;}',
    '.wisebot-widget-root[data-position="left"]{left:24px;}',
    '.wisebot-widget-root[data-position="right"]{right:24px;}',
    '.wisebot-bubble{width:64px;height:64px;border-radius:9999px;border:none;cursor:pointer;box-shadow:0 20px 45px rgba(15,23,42,.28);display:flex;align-items:center;justify-content:center;color:#fff;}',
    '.wisebot-panel{width:360px;max-width:calc(100vw - 32px);height:560px;max-height:calc(100vh - 110px);background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 28px 60px rgba(15,23,42,.28);display:flex;flex-direction:column;border:1px solid rgba(148,163,184,.25);}',
    '.wisebot-header{padding:16px;display:flex;align-items:center;justify-content:space-between;color:#fff;}',
    '.wisebot-header-main{display:flex;align-items:center;gap:12px;}',
    '.wisebot-avatar{width:40px;height:40px;border-radius:9999px;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;overflow:hidden;flex:none;font-weight:700;}',
    '.wisebot-avatar img{width:100%;height:100%;object-fit:cover;}',
    '.wisebot-status{font-size:12px;opacity:.9;}',
    '.wisebot-close{border:none;background:transparent;color:inherit;font-size:22px;cursor:pointer;line-height:1;}',
    '.wisebot-body{flex:1;padding:16px;background:#f8fafc;overflow:auto;display:flex;flex-direction:column;gap:12px;}',
    '.wisebot-msg{max-width:85%;padding:12px 14px;border-radius:16px;font-size:14px;line-height:1.45;white-space:pre-wrap;}',
    '.wisebot-msg.bot{background:#fff;color:#0f172a;border-top-left-radius:4px;border:1px solid #e2e8f0;}',
    '.wisebot-msg.user{color:#fff;border-top-right-radius:4px;align-self:flex-end;}',
    '.wisebot-input-wrap{padding:14px;border-top:1px solid #e2e8f0;background:#fff;}',
    '.wisebot-input-row{display:flex;gap:8px;align-items:center;background:#f1f5f9;border-radius:9999px;padding:6px 8px;}',
    '.wisebot-input{flex:1;border:none;background:transparent;outline:none;font-size:14px;color:#0f172a;}',
    '.wisebot-send{border:none;background:transparent;cursor:pointer;font-size:18px;padding:6px;}',
    '.wisebot-powered{margin-top:8px;text-align:center;font-size:11px;color:#64748b;}',
    '@media (max-width:640px){.wisebot-widget-root{bottom:16px}.wisebot-widget-root[data-position="left"]{left:16px}.wisebot-widget-root[data-position="right"]{right:16px}.wisebot-panel{height:70vh;}}'
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

  function ensureSession(widget) {
    if (state.sessionId) {
      return Promise.resolve(state.sessionId);
    }

    var visitorId = window.localStorage.getItem('wisebot_widget_visitor_id');
    if (!visitorId) {
      visitorId = 'visitor_' + Math.random().toString(36).slice(2, 12);
      window.localStorage.setItem('wisebot_widget_visitor_id', visitorId);
    }

    return postJson(apiUrl + '/sessions', {
      tenantId: widget.tenantId || widget.id,
      visitorId: visitorId,
      sourceUrl: window.location.href,
      referrerUrl: document.referrer || null,
      userAgent: navigator.userAgent,
    }).then(function (payload) {
      state.sessionId = payload && payload.data && payload.data.id ? payload.data.id : '';
      if (state.sessionId) {
        window.localStorage.setItem(sessionStorageKey, state.sessionId);
      }
      return state.sessionId;
    }).catch(function () {
      return '';
    });
  }

  function trackEvent(widget, eventType, extraPayload) {
    ensureSession(widget).then(function (sessionId) {
      return postJson(apiUrl + '/events', {
        tenantId: widget.tenantId || widget.id,
        sessionId: sessionId || null,
        eventType: eventType,
        payload: JSON.stringify(extraPayload || {}),
      });
    }).catch(function () {
      return null;
    });
  }

  function renderAvatar(container, config, name) {
    container.innerHTML = '';
    if (config.customIconUrl) {
      var image = document.createElement('img');
      image.src = config.customIconUrl;
      image.alt = name;
      container.appendChild(image);
      return;
    }
    container.textContent = (name || 'W').slice(0, 1).toUpperCase();
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
      bubble.innerHTML = '&#128172;';
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
    renderAvatar(avatar, config, widget.name);

    var titleWrap = createEl('div', '', null);
    var title = createEl('div', '', widget.name || 'WiseBot Assistant');
    title.style.fontWeight = '700';
    var status = createEl('div', 'wisebot-status', 'Online');
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

    var inputWrap = createEl('div', 'wisebot-input-wrap', null);
    var inputRow = createEl('div', 'wisebot-input-row', null);
    var input = createEl('input', 'wisebot-input', null);
    input.type = 'text';
    input.placeholder = 'Type your message...';
    var send = createEl('button', 'wisebot-send', '➤');
    send.style.color = config.primaryColor;

    function submitMessage() {
      var value = input.value.trim();
      if (!value) {
        return;
      }
      state.messages.push({ role: 'user', content: value });
      input.value = '';
      render();
      trackEvent(widget, 'MESSAGE_SENT', { message: value, sourceUrl: window.location.href });
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
