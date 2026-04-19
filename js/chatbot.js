/**
 * chatbot.js — 3D skin viewer + Gemini AI chatbot
 */
var Chatbot = (function () {
  var skinViewer = null;
  var typingTimer = null;
  var cursorInterval = null;
  var chatHistory = [];

  var fallbackResponses = [
    'I love working with JavaScript and Three.js the most!',
    'My favorite project so far is this Minecraft portfolio.',
    'I started coding when I was in high school.',
    'I\'m currently studying Computer Science at university.',
    'I built this whole site from scratch with HTML, CSS, and JavaScript.',
    'Feel free to check out my projects page for more of my work!',
  ];

  function getFallback() {
    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  }

  async function getGeminiResponse(userMessage) {
    chatHistory.push({ role: 'user', parts: [{ text: userMessage }] });

    try {
      var res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatHistory }),
      });

      if (!res.ok) throw new Error('API returned ' + res.status);

      var data = await res.json();
      var reply = data.reply;

      chatHistory.push({ role: 'model', parts: [{ text: reply }] });
      return reply;
    } catch (err) {
      console.warn('Chat API error:', err);
      chatHistory.pop();
      return getFallback();
    }
  }

  /* ── Chat UI ── */

  function addMessage(text, type) {
    var messagesEl = document.getElementById('chat-messages');
    if (!messagesEl) return null;
    var msg = document.createElement('div');
    msg.className = 'chat-msg ' + type;
    msg.textContent = text;
    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return msg;
  }

  function typeMessage(text, callback) {
    var messagesEl = document.getElementById('chat-messages');
    if (!messagesEl) return;
    var msg = document.createElement('div');
    msg.className = 'chat-msg bot';
    msg.textContent = '_';
    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    var typed = '';
    var idx = 0;
    var speed = 25;
    var showCursor = true;

    cursorInterval = setInterval(function () {
      showCursor = !showCursor;
      msg.textContent = typed + (showCursor ? '_' : '');
    }, 400);

    function tick() {
      if (idx < text.length) {
        typed += text.charAt(idx);
        idx++;
        msg.textContent = typed + '_';
        showCursor = true;
        messagesEl.scrollTop = messagesEl.scrollHeight;
        typingTimer = setTimeout(tick, speed);
      } else {
        clearInterval(cursorInterval);
        cursorInterval = null;
        msg.textContent = typed;
        if (callback) callback();
      }
    }
    typingTimer = setTimeout(tick, speed);
  }

  var isSending = false;

  function handleSend() {
    if (isSending) return;
    var inputEl = document.getElementById('chat-input');
    if (!inputEl) return;
    var text = inputEl.value.trim();
    if (!text) return;
    inputEl.value = '';
    addMessage(text, 'user');

    isSending = true;
    getGeminiResponse(text).then(function (reply) {
      typeMessage(reply, function () {
        isSending = false;
      });
    });
  }

  /* ── Init / Destroy ── */

  function initChat() {
    chatHistory = [];
    var sendBtn = document.getElementById('chat-send');
    var inputEl = document.getElementById('chat-input');
    if (sendBtn) {
      sendBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        e.preventDefault();
        AudioManager.playClick();
        handleSend();
      });
    }
    if (inputEl) {
      inputEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.stopPropagation();
          e.preventDefault();
          handleSend();
        }
      });
      inputEl.addEventListener('click', function (e) {
        e.stopPropagation();
      });
      inputEl.addEventListener('mousedown', function (e) {
        e.stopPropagation();
      });
    }
  }

  function initSkin() {
    var container = document.getElementById('skin-viewer');
    if (!container || typeof skinview3d === 'undefined') return;

    skinViewer = new skinview3d.SkinViewer({
      canvas: document.createElement('canvas'),
      width: container.clientWidth,
      height: container.clientHeight,
      skin: 'assets/skin.png',
      model: 'default',
    });

    skinViewer.autoRotate = false;
    skinViewer.animation = new skinview3d.IdleAnimation();
    skinViewer.animation.speed = 0.8;

    skinViewer.fov = 40;
    skinViewer.playerObject.position.y = -8;
    skinViewer.nameTag = 'Ethan';
    if (skinViewer.nameTag && skinViewer.nameTag.position) {
      skinViewer.nameTag.position.y -= 4;
    }

    container.appendChild(skinViewer.canvas);

    var bodyTargetY = 0;
    var bodyCurrent = 0;

    document.addEventListener('mousemove', function (e) {
      if (!skinViewer) return;
      var rect = container.getBoundingClientRect();
      var cx = rect.left + rect.width / 2;
      var cy = rect.top + rect.height / 2;
      var x = Math.max(-1, Math.min(1, (e.clientX - cx) / (window.innerWidth / 2)));
      var y = Math.max(-1, Math.min(1, (e.clientY - cy) / (window.innerHeight / 2)));
      skinViewer.playerObject.skin.head.rotation.y = x * 0.8;
      skinViewer.playerObject.skin.head.rotation.x = y * 0.5;
      bodyTargetY = x * 0.2;
    });

    function updateBody() {
      if (!skinViewer) return;
      bodyCurrent += (bodyTargetY - bodyCurrent) * 0.06;
      skinViewer.playerObject.rotation.y = bodyCurrent;
      requestAnimationFrame(updateBody);
    }
    requestAnimationFrame(updateBody);
  }

  function init() {
    try { initSkin(); } catch (err) { console.warn('Skin viewer failed:', err); }
    initChat();
  }

  function destroy() {
    if (typingTimer) {
      clearTimeout(typingTimer);
      typingTimer = null;
    }
    if (cursorInterval) {
      clearInterval(cursorInterval);
      cursorInterval = null;
    }
    if (skinViewer) {
      try { skinViewer.dispose(); } catch (e) {}
      skinViewer = null;
    }
    chatHistory = [];
    isSending = false;
  }

  return {
    init: init,
    destroy: destroy,
  };
})();
