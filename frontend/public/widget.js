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

  // ── Page context (tự động detect hoặc từ data-page-context) ────────
  var pageContext = {};
  var contextRaw = currentScript.getAttribute('data-page-context');
  if (contextRaw) {
    try { pageContext = JSON.parse(contextRaw); } catch(e) { pageContext = {}; }
  }
  // Auto-detect từ meta tags nếu chưa có
  if (!pageContext.productName) {
    var metaTitle = document.querySelector('meta[property="og:title"]');
    if (metaTitle) pageContext.productName = metaTitle.getAttribute('content');
  }
  if (!pageContext.productCategory) {
    var metaCategory = document.querySelector('meta[property="product:category"]');
      if (metaCategory) pageContext.productCategory = metaCategory.getAttribute('content');
    }
    pageContext.pageUrl = window.location.href;
    pageContext.pageTitle = document.title;

  var scriptUrl = new URL(currentScript.src, window.location.href);
  var apiBase = currentScript.getAttribute('data-api-base') || scriptUrl.origin;
  var apiUrl = apiBase.replace(/\/$/, '') + '/api/widget/public/widgets/code/' + encodeURIComponent(widgetCode);
  var sessionTtlHours = Number(currentScript.getAttribute('data-session-ttl-hours') || '24');
  var sessionTtlMs = Math.max(1, sessionTtlHours) * 60 * 60 * 1000;
  var widgetSessionStorageKey = 'wisebot_widget_analytics_session_v2_' + widgetCode;
  var widgetSessionCreatedAtKey = widgetSessionStorageKey + '_created_at';
  var chatSessionStorageKey = 'wisebot_chat_session_v2_' + widgetCode;
  var chatSessionCreatedAtKey = chatSessionStorageKey + '_created_at';
  var state = {
    config: null,
    widgetSessionId: getStoredSession(widgetSessionStorageKey, widgetSessionCreatedAtKey),
    chatSessionId: getStoredSession(chatSessionStorageKey, chatSessionCreatedAtKey),
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
    '.wisebot-bubble{width:64px;height:64px;border:none;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;color:inherit;padding:0;transition:transform .18s ease;}',
    '.wisebot-bubble svg{width:100%;height:100%;display:block;}',
    '.wisebot-bubble img{width:100%;height:100%;object-fit:cover;display:block;}',
    '.wisebot-bubble:hover{transform:translateY(-2px) scale(1.03);}',
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
    '.wisebot-body{flex:1;padding:16px;background:#f6f7f9;overflow:auto;display:flex;flex-direction:column;gap:12px;scrollbar-width:none;-ms-overflow-style:none;}',
    '.wisebot-body::-webkit-scrollbar{display:none;}',
    '.wisebot-day{align-self:center;border-radius:999px;background:#fff;color:#94a3b8;font-size:10px;font-weight:700;padding:4px 12px;border:1px solid rgba(226,232,240,.85);box-shadow:0 1px 2px rgba(15,23,42,.04);}',
    '.wisebot-msg{max-width:85%;padding:12px 14px;border-radius:16px;font-size:14px;line-height:1.45;overflow-wrap:break-word;word-break:normal;box-sizing:border-box;box-shadow:0 1px 2px rgba(15,23,42,.05);}',
    '.wisebot-msg.bot{background:#fff;color:#0f172a;border-top-left-radius:5px;border:1px solid rgba(226,232,240,.9);}',
    '.wisebot-msg.user{color:#fff;border-top-right-radius:5px;align-self:flex-end;white-space:pre-wrap;}',
    '.wisebot-rich{display:flex;flex-direction:column;gap:10px;}',
    '.wisebot-rich p{margin:0;line-height:1.5;}',
    '.wisebot-rich h4{margin:0;font-size:14px;line-height:1.45;font-weight:800;color:#0f172a;}',
    '.wisebot-rich ul,.wisebot-rich ol{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:6px;line-height:1.45;}',
    '.wisebot-rich li{padding-left:2px;}',
    '.wisebot-rich strong{font-weight:800;color:#0f172a;}',
    '.wisebot-thinking{align-self:flex-start;display:inline-flex;align-items:center;padding:6px 2px;box-shadow:none;background:transparent;border:none;}',
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
    '.wisebot-product-card{display:flex;gap:10px;padding:10px;background:#fff;border-radius:14px;border:1px solid #e2e8f0;cursor:pointer;transition:box-shadow .15s ease,transform .15s ease;text-decoration:none;color:inherit;}',
    '.wisebot-product-card:hover{box-shadow:0 4px 16px rgba(15,23,42,.1);transform:translateY(-1px);}',
    '.wisebot-product-img{width:64px;height:64px;border-radius:10px;object-fit:cover;flex:none;background:#f1f5f9;}',
    '.wisebot-product-info{flex:1;min-width:0;}',
    '.wisebot-product-name{font-size:13px;font-weight:700;color:#0f172a;line-height:1.3;margin-bottom:4px;}',
    '.wisebot-product-price{font-size:14px;font-weight:800;color:#2563eb;margin-bottom:3px;}',
    '.wisebot-product-reason{font-size:11px;color:#64748b;line-height:1.4;}',
    '.wisebot-product-list{display:flex;flex-direction:column;gap:8px;margin-top:8px;}',
    '.wisebot-suggestions{display:flex;flex-direction:column;align-items:flex-end;gap:6px;padding-top:4px;}',
    '.wisebot-suggestion-chip{padding:8px 14px;border-radius:16px 5px 16px 16px;background:#e8f0fe;border:1px solid #d0dff5;font-size:13px;color:#1a56db;cursor:pointer;transition:all .15s ease;text-align:left;max-width:85%;}',
    '.wisebot-suggestion-chip:hover{background:#d0dff5;border-color:#9bb7e8;}',
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

  function appendSourceUrl(url) {
    var separator = url.indexOf('?') === -1 ? '?' : '&';
    return url + separator + 'sourceUrl=' + encodeURIComponent(window.location.href);
  }

  function getVisitorId() {
    var visitorId = window.localStorage.getItem('wisebot_widget_visitor_id');
    if (!visitorId) {
      visitorId = 'visitor_' + Math.random().toString(36).slice(2, 12);
      window.localStorage.setItem('wisebot_widget_visitor_id', visitorId);
    }
    return visitorId;
  }

  function getStoredSession(storageKey, createdAtKey) {
    var sessionId = window.localStorage.getItem(storageKey) || '';
    var createdAt = Number(window.localStorage.getItem(createdAtKey) || '0');
    if (!sessionId) {
      return '';
    }
    if (!createdAt || Date.now() - createdAt > sessionTtlMs) {
      window.localStorage.removeItem(storageKey);
      window.localStorage.removeItem(createdAtKey);
      return '';
    }
    return sessionId;
  }

  function rememberSession(storageKey, createdAtKey, sessionId) {
    if (!sessionId) {
      return;
    }
    window.localStorage.setItem(storageKey, sessionId);
    if (!window.localStorage.getItem(createdAtKey)) {
      window.localStorage.setItem(createdAtKey, String(Date.now()));
    }
  }

  function ensureWidgetSession(widget) {
    if (state.widgetSessionId) {
      return Promise.resolve(state.widgetSessionId);
    }

    return postJson(appendSourceUrl(apiUrl + '/sessions'), {
      tenantId: widget.tenantId,
      visitorId: getVisitorId(),
      sourceUrl: window.location.href,
      referrerUrl: document.referrer || null,
      userAgent: navigator.userAgent,
    }).then(function (payload) {
      state.widgetSessionId = payload && payload.data && payload.data.id ? payload.data.id : '';
      if (state.widgetSessionId) {
        rememberSession(widgetSessionStorageKey, widgetSessionCreatedAtKey, state.widgetSessionId);
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

    return postJson(appendSourceUrl(apiBase.replace(/\/$/, '') + '/api/chat/public/widgets/' + encodeURIComponent(widget.id) + '/sessions'), {
      tenantId: widget.tenantId,
      visitorId: getVisitorId(),
      sourceUrl: window.location.href,
      title: 'Website Widget Chat',
    }).then(function (payload) {
      state.chatSessionId = payload && payload.data && payload.data.id ? payload.data.id : '';
      if (state.chatSessionId) {
        rememberSession(chatSessionStorageKey, chatSessionCreatedAtKey, state.chatSessionId);
      }
      return state.chatSessionId;
    }).catch(function () {
      return '';
    });
  }

  // ── Parse JSON products from AI response ─────────────────────────────
  function parseProducts(content) {
    var jsonMatch = content.match(/__JSON_PRODUCTS__\s*([\s\S]*?)\s*__END_JSON__/);
    if (!jsonMatch) return { text: content, products: null };
    try {
      var products = JSON.parse(jsonMatch[1]);
      if (!Array.isArray(products) || products.length === 0) return { text: content, products: null };
      var text = content.replace(/__JSON_PRODUCTS__[\s\S]*?__END_JSON__/g, '').trim();
      return { text: text, products: products };
    } catch(e) {
      return { text: content, products: null };
    }
  }

  function askAssistant(widget, question) {
    state.isReplying = true;
    render();
    return ensureChatSession(widget).then(function (sessionId) {
      if (!sessionId) {
        throw new Error('Missing widget chat session');
      }

      var body = JSON.stringify({
        tenantId: widget.tenantId,
        widgetId: widget.id,
        question: question,
        knowledgeBaseId: widget.appearanceConfig && widget.appearanceConfig.knowledgeBaseId ? widget.appearanceConfig.knowledgeBaseId : null,
        topK: widget.appearanceConfig && widget.appearanceConfig.topK ? widget.appearanceConfig.topK : 5,
        temperature: widget.appearanceConfig && widget.appearanceConfig.temperature != null ? widget.appearanceConfig.temperature : 0.2,
        pageContext: pageContext,
      });

      var url = apiBase.replace(/\/$/, '') + '/api/chat/public/sessions/' + encodeURIComponent(sessionId) + '/ask-stream';
      var answerText = '';
      var botMsg = { role: 'bot', content: '', products: null };
      var hasRenderedAnswer = false;
      state.messages.push(botMsg);

        return fetch(appendSourceUrl(url), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body,
      }).then(function (response) {
        if (!response.ok || !response.body) {
          throw new Error('Stream not available');
        }

        var reader = response.body.getReader();
        var decoder = new TextDecoder();
        var buffer = '';

        function readStream() {
          return reader.read().then(function (result) {
            if (result.done) {
              var parsed = parseProducts(answerText);
              botMsg.content = parsed.text;
              botMsg.products = parsed.products;
              state.isReplying = false;
              render();
              trackEvent(widget, 'ANSWER_RECEIVED', { sourceUrl: window.location.href });
              return;
            }

            buffer += decoder.decode(result.value, { stream: true });
            var events = buffer.split(/\r?\n\r?\n/);
            buffer = events.pop() || '';

            events.forEach(function (rawEvent) {
              var dataLines = rawEvent.split(/\r?\n/).filter(function (line) {
                return line.startsWith('data:');
              }).map(function (line) {
                return line.slice(5).trim();
              });
              if (dataLines.length === 0) return;

              var data = dataLines.join('\n');
              if (!data || data === '[DONE]') return;

              try {
                var payload = JSON.parse(data);
                if (typeof payload.token === 'string') {
                  answerText += payload.token;
                  botMsg.content = answerText;
                  if (!hasRenderedAnswer) {
                    hasRenderedAnswer = true;
                    state.isReplying = false;
                    render();
                  }
                  var bodyEl = root.querySelector('.wisebot-body');
                  if (bodyEl) {
                    var botMsgs = bodyEl.querySelectorAll('.wisebot-msg.bot');
                    var lastBot = botMsgs[botMsgs.length - 1];
                    if (lastBot) {
                      lastBot.innerHTML = '';
                      appendFormattedContent(lastBot, answerText);
                    }
                    scrollToLatestMessage();
                  }
                }
              } catch(e) {}
            });

            return readStream();
          });
        }

        return readStream();
      }).catch(function (error) {
        state.messages.pop(); // remove empty bot msg
        state.messages.push({ role: 'bot', content: 'The assistant is temporarily unavailable. Please try again.' });
        state.isReplying = false;
        render();
        console.error('[WiseBot] Ask failed.', error);
      });
    });
  }

  function trackEvent(widget, eventType, extraPayload) {
    ensureWidgetSession(widget).then(function (sessionId) {
      return postJson(appendSourceUrl(apiUrl + '/events'), {
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
    var robotLogo = '<svg width="' + iconSize + '" height="' + iconSize + '" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="wisebotBlueGrad" x1="0" y1="0" x2="100" y2="100"><stop offset="0%" stop-color="#10b981"/><stop offset="100%" stop-color="#6366f1"/></linearGradient><linearGradient id="wisebotFaceGrad" x1="0" y1="0" x2="0" y2="100"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#c4d5e8"/></linearGradient><filter id="wisebotShadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/></filter></defs><path d="M 35 75 L 30 100 L 60 78 Z" fill="url(#wisebotBlueGrad)"/><path fill-rule="evenodd" clip-rule="evenodd" d="M50 5C25.147 5 5 25.147 5 50C5 74.853 25.147 95 50 95C74.853 95 95 74.853 95 50C95 25.147 74.853 5 50 5ZM50 17C31.775 17 17 31.775 17 50C17 68.225 31.775 83 50 83C68.225 83 83 68.225 83 50C83 31.775 68.225 17 50 17Z" fill="url(#wisebotBlueGrad)"/><path d="M 38 75 L 34 94 L 56 79 Z" fill="url(#wisebotFaceGrad)"/><ellipse cx="50" cy="53" rx="34" ry="29" fill="url(#wisebotFaceGrad)" filter="url(#wisebotShadow)"/><rect x="25" y="42" width="50" height="24" rx="12" fill="#030712"/><circle cx="37" cy="52" r="4.5" fill="#10b981"/><circle cx="63" cy="52" r="4.5" fill="#10b981"/><path d="M 45 60 Q 50 64 55 60" stroke="#10b981" stroke-width="2.5" stroke-linecap="round"/><path d="M 15 51 C 9 51 9 61 15 61 Z" fill="#030712"/><path d="M 85 51 C 91 51 91 61 85 61 Z" fill="#030712"/><path d="M 45 28 L 55 28 L 53 24 L 47 24 Z" fill="url(#wisebotFaceGrad)"/><rect x="48.5" y="12" width="3" height="15" fill="url(#wisebotBlueGrad)"/><circle cx="50" cy="12" r="4.5" fill="url(#wisebotBlueGrad)"/><circle cx="50" cy="12" r="2.5" fill="#10b981"/></svg>';
    var icons = {
      bot: robotLogo,
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

  function scrollToLatestMessage() {
    var body = root.querySelector('.wisebot-body');
    if (body) {
      body.scrollTop = body.scrollHeight;
    }
  }

  function appendInlineText(parent, text) {
    String(text || '').split(/(\*\*[^*]+\*\*)/g).forEach(function (part) {
      if (!part) return;
      if (part.indexOf('**') === 0 && part.lastIndexOf('**') === part.length - 2) {
        var strong = createEl('strong', '', part.slice(2, -2));
        parent.appendChild(strong);
        return;
      }
      parent.appendChild(document.createTextNode(part));
    });
  }

  function appendFormattedContent(container, content) {
    var rich = createEl('div', 'wisebot-rich', null);
    var lines = String(content || '').trim().split(/\r?\n/);
    var paragraph = [];
    var list = null;
    var listType = '';

    function flushParagraph() {
      if (paragraph.length === 0) return;
      var text = paragraph.join(' ').replace(/\s+/g, ' ').trim();
      if (text) {
        var p = createEl('p', '', null);
        appendInlineText(p, text);
        rich.appendChild(p);
      }
      paragraph = [];
    }

    function flushList() {
      if (!list) return;
      rich.appendChild(list);
      list = null;
      listType = '';
    }

    lines.forEach(function (rawLine) {
      var line = rawLine.trim();
      if (!line) {
        flushParagraph();
        flushList();
        return;
      }

      var heading = line.match(/^#{1,3}\s+(.+)$/);
      if (heading) {
        flushParagraph();
        flushList();
        var h = createEl('h4', '', null);
        appendInlineText(h, heading[1]);
        rich.appendChild(h);
        return;
      }

      var bullet = line.match(/^[-*]\s+(.+)$/);
      var numbered = line.match(/^\d+[.)]\s+(.+)$/);
      if (bullet || numbered) {
        flushParagraph();
        var nextType = bullet ? 'ul' : 'ol';
        if (list && listType !== nextType) {
          flushList();
        }
        if (!list) {
          list = document.createElement(nextType);
          listType = nextType;
        }
        var li = createEl('li', '', null);
        appendInlineText(li, (bullet && bullet[1] ? bullet[1] : numbered && numbered[1] ? numbered[1] : '').trim());
        list.appendChild(li);
        return;
      }

      flushList();
      paragraph.push(line);
    });

    flushParagraph();
    flushList();

    if (rich.childNodes.length === 0) {
      rich.textContent = content || '';
    }
    container.appendChild(rich);
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
      bubble.style.color = config.primaryColor;
      renderAvatar(bubble, config, widget.name, 64);
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

    // Render welcome message trước
    var hasUserMsg = false;
    state.messages.forEach(function (message) {
      if (message === state.messages[0] && !message._isWelcome) {
        // First message = welcome, render it
      }
      renderMessage(body, message, config);
      if (message.role === 'user') hasUserMsg = true;
    });

    // Welcome message nếu chưa có
    if (!state.messages.length) {
      var welcomeText = widget.welcomeMessage || 'Hello! How can I help you today?';
      var welcomeMsg = { role: 'bot', content: welcomeText, _isWelcome: true };
      state.messages.push(welcomeMsg);
      renderMessage(body, welcomeMsg, config);
    }

    // Suggested questions ngay dưới welcome message
    if (!hasUserMsg) {
      var sq = config.suggestedQuestions;
      if (Array.isArray(sq) && sq.length > 0) {
        var sqWrap = createEl('div', 'wisebot-suggestions', null);
        sq.forEach(function (question) {
          if (!question || !question.trim()) return;
          var chip = createEl('span', 'wisebot-suggestion-chip', question.trim());
          chip.addEventListener('click', function () {
            state.messages.push({ role: 'user', content: question.trim() });
            render();
            trackEvent(widget, 'MESSAGE_SENT', { message: question, sourceUrl: window.location.href });
            askAssistant(widget, question.trim());
          });
          sqWrap.appendChild(chip);
        });
        if (sqWrap.children.length > 0) {
          body.appendChild(sqWrap);
        }
      }
    }

    function renderMessage(container, message, config) {
      var msgWrap = createEl('div', '', null);
      msgWrap.style.width = '100%';
      msgWrap.style.display = 'flex';
      msgWrap.style.justifyContent = message.role === 'bot' ? 'flex-start' : 'flex-end';

      // Text message
      if (message.content) {
        var msg = createEl('div', 'wisebot-msg ' + message.role, null);
        if (message.role === 'user') {
          msg.style.background = config.primaryColor;
          msg.textContent = message.content;
        } else {
          appendFormattedContent(msg, message.content);
        }
        msgWrap.appendChild(msg);
      }

      // Product cards
      if (message.products && message.products.length > 0) {
        var cardList = createEl('div', 'wisebot-product-list', null);
        message.products.forEach(function (product) {
          var card = createEl('a', 'wisebot-product-card', null);
          card.href = product.detailUrl || '#';
          if (product.detailUrl) {
            card.target = '_blank';
            card.rel = 'noopener';
          }

          var img = createEl('img', 'wisebot-product-img', null);
          img.src = product.imageUrl || '';
          img.alt = product.name || '';
          img.loading = 'lazy';
          img.onerror = function () { this.style.display = 'none'; };

          var info = createEl('div', 'wisebot-product-info', null);
          var name = createEl('div', 'wisebot-product-name', product.name || '');
          var price = createEl('div', 'wisebot-product-price', null);
          if (product.price) {
            price.textContent = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price);
          }
          var reason = createEl('div', 'wisebot-product-reason', product.reason || '');

          info.appendChild(name);
          info.appendChild(price);
          info.appendChild(reason);
          card.appendChild(img);
          card.appendChild(info);
          cardList.appendChild(card);
        });
        msgWrap.appendChild(cardList);
      }

      container.appendChild(msgWrap);
    }

    if (state.isReplying) {
      var thinking = createEl('div', 'wisebot-thinking', null);
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
    window.setTimeout(scrollToLatestMessage, 0);
  }

  fetch(appendSourceUrl(apiUrl))
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
