/**
 * chatbot.js - 3D skin viewer + Gemini AI chatbot
 */
var Chatbot = (function () {
  var skinViewer = null;
  var skinResizeObserver = null;
  var typingTimer = null;
  var cursorInterval = null;
  var skinAnimRandomTimer = null;
  var chatHistory = [];
  /** When true (crouch/hit “responding”), head/body blend toward facing straight forward. */
  var skinResponding = false;
  /** 1 = full cursor look, 0 = forward; lerped for smooth transitions. */
  var skinLookInfluence = 1;

  var chatApiErrorMessage =
    'Sorry, chat isn\'t working right now. Use the preset questions to learn more!';

  var PRESET_QA = [
    { q: 'What are you studying?', a: 'First year Computer Engineering at the University of Toronto.' },
    { q: 'Where are you interning?', a: 'Incoming API Development Intern at Sun Life. Looking forward to real backend and integration work.' },
    { q: 'How do I see your projects?', a: 'Open Projects from the main menu. You get the list with blurbs, and you can open a card for more detail.' },
    { q: 'Where is your resume?', a: 'Pick Resume on the main menu. It is the crafting table page, then craft the pattern to open the PDF.' },
    { q: 'How can I contact you?', a: 'Email ethn.yang@mail.utoronto.ca, LinkedIn linkedin.com/in/ey6, or GitHub github.com/e-yang6.' },
    { q: 'What is this site built with?', a: 'HTML, CSS, and Three.js for the panorama and the small skin viewer, plus plain JavaScript. The menu is styled like Minecraft Java.' },
    { q: 'What is BeaverTrails?', a: 'An AI travel planner with TypeScript, Next.js, and Three.js. It builds itineraries and leans on 3D style maps and previews.' },
    { q: 'What is Polymolt?', a: 'A multi agent prediction market idea with RAG and LMSR style scoring, built with Python, FastAPI, TypeScript, and GCP.' },
    { q: 'Any hackathon wins?', a: 'Lock Block was a winner at HackHive 2026. HATSEYE was a DeltaHacks 12 finalist. Details are on the Projects page.' },
    { q: 'What was the EngSoc project?', a: 'Digitizing cheque requisitions for U of T EngSoc with OCR on receipts, Next.js, TypeScript, PostgreSQL, and AWS.' },
    { q: 'What are your hobbies?', a: 'Volleyball, making music, and cats. Random side projects when an idea hooks me.' },
    { q: 'Favorite language to code in?', a: 'Lots of TypeScript lately. Python is still my comfort pick for quick experiments and ML style scripts.' },
    { q: 'Why Computer Engineering?', a: 'I like systems that actually run in the real world. This program felt like the best fit for that kind of curiosity.' },
    { q: 'What do you do outside tech?', a: 'Volleyball, music, and hanging out with my cats.' },
    { q: 'Cats or dogs?', a: 'Cats. I still like dogs when a friend brings one over.' },
    { q: 'Is this site official Minecraft?', a: 'No. It is a fan style portfolio. Not affiliated with Mojang.' },
    { q: 'What is the bell on the resume page?', a: 'Just a fun easter egg. Ring it if you want. There is a counter if the small API is running.' },
    { q: 'What tech are you into?', a: 'Systems, AI and ML, and backend work. Anything where I can chase how things work under the hood.' },
    { q: 'Tell me about Sinatra.', a: 'Browser DAW that turns your voice into instruments in real time. Python, TypeScript, React, FastAPI. More on Projects.' },
    { q: 'Morning or night person?', a: 'More of a night owl, especially when I am deep in a build.' },
    { q: 'What music do you listen to?', a: 'A bit of everything. I make music too so I borrow ideas from all over.' },
    { q: 'What is the friendly font button?', a: 'Bottom right toggle. It switches the UI to a more readable system font if the pixel font is hard on your eyes.' },
    { q: 'What are the world buttons?', a: 'Bottom center Scene row. Overworld, Nether, and End swap the sky, music, and a few colors. Just for fun.' },
  ];

  function shufflePresetIndices(len) {
    var a = [];
    for (var i = 0; i < len; i++) a.push(i);
    for (var j = a.length - 1; j > 0; j--) {
      var k = Math.floor(Math.random() * (j + 1));
      var t = a[j];
      a[j] = a[k];
      a[k] = t;
    }
    return a;
  }

  function pickThreePresets() {
    var n = PRESET_QA.length;
    var take = Math.min(3, n);
    var ix = shufflePresetIndices(n).slice(0, take);
    return ix.map(function (i) {
      return PRESET_QA[i];
    });
  }

  function bindSuggestionsContainerOnce() {
    var wrap = document.getElementById('chat-suggestions');
    if (!wrap || wrap.dataset.bound === '1') return;
    wrap.dataset.bound = '1';
    wrap.addEventListener('mousedown', function (e) {
      e.stopPropagation();
    });
  }

  function setSuggestionsHidden(hidden) {
    var wrap = document.getElementById('chat-suggestions');
    if (!wrap) return;
    wrap.classList.toggle('chat-suggestions--hidden', !!hidden);
  }

  function refreshSuggestionButtons() {
    var wrap = document.getElementById('chat-suggestions');
    if (!wrap) return;
    wrap.innerHTML = '';
    pickThreePresets().forEach(function (p) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chat-suggestion-btn';
      btn.textContent = p.q;
      btn.setAttribute('title', p.q);
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        e.preventDefault();
        handlePreset(p.q, p.a);
      });
      btn.addEventListener('mousedown', function (e) {
        e.stopPropagation();
      });
      wrap.appendChild(btn);
    });
  }

  function scrollChatToBottom() {
    var messagesEl = document.getElementById('chat-messages');
    if (!messagesEl) return;
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function finishBotTurnAndRefreshSuggestions() {
    isSending = false;
    setSkinIdleAnimation();
    refreshSuggestionButtons();
    setSuggestionsHidden(false);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        scrollChatToBottom();
      });
    });
  }

  function handlePreset(question, answer) {
    if (isSending) return;
    isSending = true;
    setSuggestionsHidden(true);
    if (typeof AudioManager !== 'undefined') AudioManager.playClick();
    addMessage(question, 'user');
    chatHistory.push({ role: 'user', parts: [{ text: question }] });
    setSkinChatRespondAnimation();
    typeMessage(answer, function () {
      chatHistory.push({ role: 'model', parts: [{ text: answer }] });
      finishBotTurnAndRefreshSuggestions();
    });
  }

  async function getGeminiResponse(userMessage) {
    chatHistory.push({ role: 'user', parts: [{ text: userMessage }] });

    try {
      var res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatHistory }),
      });

      if (res.status === 429) {
        chatHistory.pop();
        var lim = await res.json().catch(function () {
          return {};
        });
        var sec = typeof lim.retryAfterSec === 'number' ? lim.retryAfterSec : 60;
        return (
          'You are sending messages a bit fast. Give it about ' +
          String(sec) +
          ' seconds, then try again.'
        );
      }

      if (!res.ok) throw new Error('API returned ' + res.status);

      var data = await res.json();
      var reply = data.reply;

      chatHistory.push({ role: 'model', parts: [{ text: reply }] });
      return reply;
    } catch (err) {
      console.warn('Chat API error:', err);
      chatHistory.pop();
      return chatApiErrorMessage;
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
        var ch = text.charAt(idx);
        typed += ch;
        idx++;
        msg.textContent = typed + '_';
        showCursor = true;
        if (ch !== ' ' && typeof AudioManager !== 'undefined') {
          AudioManager.playText();
        }
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

  function applySkinVerticalOffset() {
    if (skinViewer) skinViewer.playerObject.position.y = -8;
  }

  function clearSkinAnimRandomizer() {
    if (skinAnimRandomTimer !== null) {
      clearTimeout(skinAnimRandomTimer);
      skinAnimRandomTimer = null;
    }
  }

  function tickSkinAnimRandomizer() {
    skinAnimRandomTimer = null;
    if (!skinViewer || typeof skinview3d === 'undefined' || !skinViewer.animation) return;
    if (skinViewer.animation instanceof skinview3d.IdleAnimation) return;
    var a = skinViewer.animation;
    a.speed = 0.55 + Math.random() * 1.65;
    if (typeof a.addHitAnimation === 'function') {
      a.addHitAnimation(0.45 + Math.random() * 2.1);
    }
    if (Math.random() < 0.14) {
      a.paused = true;
      setTimeout(function () {
        if (skinViewer && skinViewer.animation === a) a.paused = false;
      }, 35 + Math.random() * 140);
    }
    skinAnimRandomTimer = setTimeout(tickSkinAnimRandomizer, 160 + Math.random() * 620);
  }

  function startSkinAnimRandomizer() {
    clearSkinAnimRandomizer();
    skinAnimRandomTimer = setTimeout(tickSkinAnimRandomizer, 80 + Math.random() * 220);
  }

  var secretJumpTimer = null;

  function setSecretIdleAnimation() {
    skinResponding = false;
    clearSkinAnimRandomizer();
    clearSecretJumpTimer();
    if (!skinViewer || typeof skinview3d === 'undefined') return;
    skinViewer.animation = new skinview3d.IdleAnimation();
    skinViewer.animation.speed = 0.3;
    applySkinVerticalOffset();
    startSecretJumpLoop();
  }

  function clearSecretJumpTimer() {
    if (secretJumpTimer !== null) {
      clearTimeout(secretJumpTimer);
      secretJumpTimer = null;
    }
  }

  function startSecretJumpLoop() {
    clearSecretJumpTimer();
    secretJumpTimer = setTimeout(function doSecretJump() {
      if (!skinViewer) return;
      var player = skinViewer.playerObject;
      var baseY = -8;

      // random twitch: sudden head snap or body jolt or small jump
      var action = Math.random();
      if (action < 0.35) {
        // head snap — sudden rotation then return
        var headX = (Math.random() - 0.5) * 1.2;
        var headY = (Math.random() - 0.5) * 1.4;
        player.skin.head.rotation.x += headX;
        player.skin.head.rotation.y += headY;
        setTimeout(function () {
          if (!skinViewer) return;
          player.skin.head.rotation.x -= headX;
          player.skin.head.rotation.y -= headY;
        }, 80 + Math.random() * 120);
      } else if (action < 0.65) {
        // small vertical jump
        player.position.y = baseY + 3 + Math.random() * 4;
        setTimeout(function () {
          if (!skinViewer) return;
          player.position.y = baseY;
        }, 100 + Math.random() * 80);
      } else if (action < 0.85) {
        // body rotation jolt
        var jolt = (Math.random() - 0.5) * 0.6;
        player.rotation.y += jolt;
        setTimeout(function () {
          if (!skinViewer) return;
          player.rotation.y -= jolt;
        }, 60 + Math.random() * 100);
      } else {
        // arm/leg twitch via brief animation speed burst
        if (skinViewer.animation) {
          skinViewer.animation.speed = 3 + Math.random() * 4;
          setTimeout(function () {
            if (!skinViewer || !skinViewer.animation) return;
            skinViewer.animation.speed = 0.3;
          }, 80 + Math.random() * 120);
        }
      }

      secretJumpTimer = setTimeout(doSecretJump, 400 + Math.random() * 1800);
    }, 300 + Math.random() * 1000);
  }

  function setSkinIdleAnimation() {
    skinResponding = false;
    clearSkinAnimRandomizer();
    clearSecretJumpTimer();
    if (!skinViewer || typeof skinview3d === 'undefined') return;
    if (typeof SiteScene !== 'undefined' && SiteScene.get() === 'secret') {
      setSecretIdleAnimation();
      return;
    }
    skinViewer.animation = new skinview3d.IdleAnimation();
    skinViewer.animation.speed = 0.8;
    applySkinVerticalOffset();
  }

  function setSkinChatRespondAnimation() {
    if (!skinViewer || typeof skinview3d === 'undefined' || !skinview3d.CrouchAnimation) return;
    skinResponding = true;
    var anim = new skinview3d.CrouchAnimation();
    anim.speed = 0.75 + Math.random() * 1.15;
    anim.addHitAnimation(0.65 + Math.random() * 1.5);
    skinViewer.animation = anim;
    applySkinVerticalOffset();
    startSkinAnimRandomizer();
  }

  function handleSend() {
    if (isSending) return;
    var inputEl = document.getElementById('chat-input');
    if (!inputEl) return;
    var text = inputEl.value.trim();
    if (!text) return;
    inputEl.value = '';
    setSuggestionsHidden(true);
    addMessage(text, 'user');

    isSending = true;
    getGeminiResponse(text).then(function (reply) {
      setSkinChatRespondAnimation();
      typeMessage(reply, function () {
        finishBotTurnAndRefreshSuggestions();
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
    bindSuggestionsContainerOnce();
    refreshSuggestionButtons();
    setSuggestionsHidden(false);
  }

  function initSkin() {
    var container = document.getElementById('skin-viewer');
    if (!container || typeof skinview3d === 'undefined') return;

    var isSecret = typeof SiteScene !== 'undefined' && SiteScene.get() === 'secret';

    skinViewer = new skinview3d.SkinViewer({
      canvas: document.createElement('canvas'),
      width: container.clientWidth,
      height: container.clientHeight,
      skin: isSecret ? 'assets/secretskin.png' : 'assets/skin.png',
      model: 'default',
    });

    if (!isSecret) {
      skinViewer.loadCape('assets/cape.png');
    }

    skinViewer.autoRotate = false;
    if (isSecret) {
      setSecretIdleAnimation();
    } else {
      setSkinIdleAnimation();
    }

    skinViewer.fov = 40;
    skinViewer.nameTag = 'Ethan';
    if (skinViewer.nameTag && skinViewer.nameTag.position) {
      skinViewer.nameTag.position.y -= 4;
    }

    container.appendChild(skinViewer.canvas);

    if (typeof ResizeObserver !== 'undefined') {
      skinResizeObserver = new ResizeObserver(function () {
        if (!skinViewer) return;
        var w = container.clientWidth;
        var h = container.clientHeight;
        if (w < 1 || h < 1) return;
        skinViewer.width = w;
        skinViewer.height = h;
      });
      skinResizeObserver.observe(container);
    }

    var targetX = 0;
    var targetY = 0;
    var bodyCurrent = 0;

    document.addEventListener('mousemove', function (e) {
      if (!skinViewer) return;
      var rect = container.getBoundingClientRect();
      var cx = rect.left + rect.width / 2;
      var cy = rect.top + rect.height / 2;
      targetX = Math.max(-1, Math.min(1, (e.clientX - cx) / (window.innerWidth / 2)));
      targetY = Math.max(-1, Math.min(1, (e.clientY - cy) / (window.innerHeight / 2)));
    });

    function updateLook() {
      if (!skinViewer) return;
      var influenceTarget = skinResponding ? 0 : 1;
      skinLookInfluence += (influenceTarget - skinLookInfluence) * 0.14;
      var bodyTargetY = skinLookInfluence * (targetX * 0.2);
      bodyCurrent += (bodyTargetY - bodyCurrent) * 0.06;
      skinViewer.playerObject.rotation.y = bodyCurrent;
      skinViewer.playerObject.skin.head.rotation.y =
        skinLookInfluence * (targetX * 0.8 - bodyCurrent);
      skinViewer.playerObject.skin.head.rotation.x = skinLookInfluence * (targetY * 0.5);
      requestAnimationFrame(updateLook);
    }
    requestAnimationFrame(updateLook);
  }

  function init() {
    try { initSkin(); } catch (err) { console.warn('Skin viewer failed:', err); }
    initChat();
  }

  function destroy() {
    clearSkinAnimRandomizer();
    clearSecretJumpTimer();
    if (typingTimer) {
      clearTimeout(typingTimer);
      typingTimer = null;
    }
    if (cursorInterval) {
      clearInterval(cursorInterval);
      cursorInterval = null;
    }
    if (skinResizeObserver) {
      try {
        skinResizeObserver.disconnect();
      } catch (e) {}
      skinResizeObserver = null;
    }
    if (skinViewer) {
      try { skinViewer.dispose(); } catch (e) {}
      skinViewer = null;
    }
    chatHistory = [];
    isSending = false;
    skinResponding = false;
    skinLookInfluence = 1;
    var sug = document.getElementById('chat-suggestions');
    if (sug) {
      delete sug.dataset.bound;
      sug.innerHTML = '';
      sug.classList.remove('chat-suggestions--hidden');
    }
  }

  return {
    init: init,
    destroy: destroy,
  };
})();
