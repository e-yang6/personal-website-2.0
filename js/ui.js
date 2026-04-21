/**
 * ui.js — Button interactions, sub-page transitions, content
 */
const UI = (function () {
  /**
   * Same PDF as raw GitHub, but served from /api/resume with Content-Disposition: inline
   * so a new tab opens the built-in PDF viewer instead of downloading (Vercel or Node with /api).
   */
  var resumeOpenPath = '/api/resume';
  var resumePreviewImgUrl =
    'https://raw.githubusercontent.com/e-yang6/personal-resume/main/Ethan_Yang_Resume_Preview.jpg';

  function openResumeInNewTab() {
    var a = document.createElement('a');
    a.href =
      typeof window !== 'undefined' && window.location && window.location.origin
        ? new URL(resumeOpenPath, window.location.origin).href
        : resumeOpenPath;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  var signalBars =
    '<div class="mp-signal"><div class="mp-signal-bar"></div><div class="mp-signal-bar"></div><div class="mp-signal-bar"></div><div class="mp-signal-bar"></div><div class="mp-signal-bar"></div></div>';

  var projectData = [
    {
      name: 'Finance Digitization',
      date: 'Jan 2026 - Apr 2026',
      skills: ['TypeScript', 'Next.js', 'PostgreSQL', 'Amazon Web Services (AWS)'],
      motd: 'Full-stack app to digitize UofT EngSoc cheque requisitions with OCR receipt parsing and e-signature approval.',
      desc: 'Full-stack web application built for the University of Toronto Engineering Society (EngSoc) to digitize the cheque requisition process. Features OCR-based receipt parsing that automatically extracts transaction details, automated form filling to reduce manual data entry, and a centralized dual e-signature approval workflow that streamlines the entire reimbursement pipeline for club treasurers and EngSoc finance officers.',
      github: 'https://github.com/e-yang6/finance-digitisation-esp'
    },
    {
      name: 'BeaverTrails',
      date: 'Mar 2026',
      skills: ['TypeScript', 'Next.js', 'Three.js', 'React.js'],
      motd: 'AI travel planner generating personalized itineraries with 3D maps and immersive 360/VR previews.',
      desc: 'An AI-powered travel planner that generates personalized itineraries tailored to your preferences and budget. Explore destinations through interactive 3D maps, immersive 360 degree street-level previews, and VR-ready views before you even book your trip. Built to make travel planning visual, intuitive, and fun.',
      github: 'https://github.com/e-yang6/beavertrail',
      devpost: '#'
    },
    {
      name: 'Polymolt',
      date: 'Mar 2026',
      skills: ['Python', 'FastAPI', 'RAG', 'TypeScript', 'Google Cloud Platform (GCP)'],
      motd: 'Multi-agent AI prediction market using RAG and LMSR to evaluate real-world claims in real time.',
      desc: 'A multi-agent AI prediction market platform that leverages Retrieval-Augmented Generation (RAG) and Logarithmic Market Scoring Rule (LMSR) to evaluate real-world claims in real time. Multiple AI agents independently research and assess claims, then aggregate their predictions into calibrated probability estimates for more accurate forecasting.',
      github: 'https://github.com/e-yang6/Polymolt',
      devpost: '#'
    },
    {
      name: 'Sinatra',
      date: 'Feb 2026 - Mar 2026',
      skills: ['Python', 'TypeScript', 'React.js', 'FastAPI'],
      motd: 'Browser-based digital audio workstation that lets you create music by turning your voice into instruments.',
      desc: 'A browser-based digital audio workstation that transforms your voice into any instrument. Sing or hum a melody, and Sinatra processes your audio input in real time to map it onto synthesized instruments, letting anyone create music without needing to know how to play an instrument.',
      github: 'https://github.com/e-yang6/sinatra',
      devpost: '#',
      demo: '#'
    },
    {
      name: 'HATSEYE',
      date: 'Jan 2026',
      award: 'DeltaHacks 12 Finalist',
      skills: ['Arduino', 'Python', 'OpenCV', 'Flask', 'JavaScript'],
      motd: 'Voice-activated AI vision assistant with haptic feedback for real-time environmental awareness for visually impaired users.',
      desc: 'A voice-activated AI vision assistant designed for visually impaired users. Combines computer vision with natural language processing to describe the surrounding environment in real time, and delivers haptic feedback through wearable hardware to alert users of nearby obstacles, providing a more independent and safer navigation experience.',
      github: 'https://github.com/e-yang6/hatseye',
      devpost: '#'
    },
    {
      name: 'Lock Block',
      date: 'Jan 2026',
      award: 'HackHive 2026 Winner',
      skills: ['Blockchain', 'Arduino', 'Python', 'OpenCV', 'Flask'],
      motd: 'Smart home security system using facial recognition and blockchain authentication to auto-lock doors when a stranger is detected.',
      desc: 'A smart home security system that combines facial recognition with blockchain-based authentication to automatically secure your home. When an unrecognized face is detected by the camera, the system triggers an Arduino-controlled lock mechanism and logs the event on a tamper-proof blockchain ledger for verifiable security history.',
      github: 'https://github.com/e-yang6/lockblock',
      devpost: '#'
    },
    {
      name: 'QuantiFi',
      date: 'Nov 2025',
      award: '3rd Place @ UTEFA Competition 2025',
      skills: ['Python', 'Quantitative Finance'],
      motd: 'Quantitative trading strategy with MA crossovers and momentum selection, delivering 24.3% return and 1.78 Sharpe ratio.',
      desc: 'Developed and backtested a quantitative trading strategy using moving-average crossovers, ADX trend confirmation, and momentum-based stock selection. Applied grid optimization to systematically tune parameters for consistency and robustness, ultimately delivering a 24.3% return with a Sharpe ratio of 1.78 in backtesting.',
      github: 'https://github.com/e-yang6/quantifi'
    },
    {
      name: 'binder.',
      date: 'Oct 2025',
      skills: ['TypeScript', 'React', 'Python', 'Selenium', 'BeautifulSoup'],
      motd: '"Tinder for Kijiji" that helps you efficiently browse and match with local listings.',
      desc: 'A "Tinder for Kijiji" experience that reimagines local marketplace browsing. Swipe through curated local listings with an intuitive card-based interface, save your favorites, and instantly connect with sellers, making it faster and more enjoyable to find secondhand deals near you.',
      github: 'https://github.com/e-yang6/binder',
      devpost: '#'
    }
  ];

  function buildProjectEntries() {
    var html = '';
    for (var i = 0; i < projectData.length; i++) {
      var p = projectData[i];
      var displayName = p.name;
      html +=
        '<div class="mp-entry" data-project="' + i + '">' +
          '<div class="mp-icon"><div class="mp-icon-placeholder"></div></div>' +
          '<div class="mp-info">' +
            '<div class="mp-name">' + displayName + '</div>' +
            '<div class="mp-motd">' + p.motd + '</div>' +
          '</div>' +
          '<div class="mp-right"><span class="mp-players">' + p.date + '</span>' + signalBars + '</div>' +
        '</div>';
    }
    return html;
  }

  function buildProjectDetail(index) {
    var p = projectData[index];
    var skillsHtml = '';
    for (var i = 0; i < p.skills.length; i++) {
      skillsHtml += '<span class="pd-skill">' + p.skills[i] + '</span>';
    }

    var awardHtml = p.award ? '<div class="pd-award">' + p.award + '</div>' : '';
    var viewLink = p.github || p.devpost || p.demo || '#';

    return (
      '<div class="pd-overlay" id="pd-overlay">' +
        '<div class="pd-panel">' +
          '<div class="pd-inner">' +
            '<div class="pd-header">' +
              '<div class="pd-title">' + p.name + '</div>' +
              '<button class="pd-close" id="pd-close">\u00D7</button>' +
            '</div>' +
            awardHtml +
            '<div class="pd-date">' + p.date + '</div>' +
            '<div class="pd-skills">' + skillsHtml + '</div>' +
            '<div class="pd-desc">' + p.desc + '</div>' +
            '<div class="pd-view-row">' +
              '<button class="mc-button pd-view-btn" onclick="window.open(\'' + viewLink + '\',\'_blank\');event.stopPropagation();"><span class="title">View Project</span></button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  var pages = {
    about: function () {
      return (
        '<div class="mp-page">' +
          '<div class="about-columns">' +

            '<div class="poem-left">' +
              '<div class="poem-row left">' +
                '<div class="poem-text cyan">Hi! I\'m Ethan, and I\'m a first year computer engineering student at the <a href="https://www.utoronto.ca/" target="_blank" class="inline-link">University of Toronto</a>, and an incoming API Development Intern at <a href="https://www.sunlife.ca/en/" target="_blank" class="inline-link">Sun Life</a>.</div>' +
                '<div class="poem-img"></div>' +
              '</div>' +
              '<div class="poem-row right">' +
                '<div class="poem-img"></div>' +
                '<div class="poem-text green">I find systems, AI/ML, and backend really interesting, and I enjoy building whatever catches my curiosity.</div>' +
              '</div>' +
              '<div class="poem-row left">' +
                '<div class="poem-text cyan">Outside of school and coding, you\'ll find me playing volleyball or making music. I also love cats <3</div>' +
                '<div class="poem-img"></div>' +
              '</div>' +
              '<div class="poem-row right">' +
                '<div class="poem-img"></div>' +
                '<div class="poem-text green">Thanks for stopping by my world. If you want to know more, feel free to explore or ask me on the right!</div>' +
              '</div>' +
            '</div>' +

            '<div class="skin-right">' +
              '<div id="skin-viewer"></div>' +
              '<div class="chat-box">' +
                '<div class="chat-messages" id="chat-messages">' +
                  '<div class="chat-msg bot">Hey! Ask me anything about myself.</div>' +
                '</div>' +
                '<div class="chat-suggestions" id="chat-suggestions" aria-label="Suggested questions"></div>' +
                '<div class="chat-input-row">' +
                  '<input type="text" class="chat-input" id="chat-input" placeholder="Ask about Ethan..." autocomplete="off">' +
                  '<button class="chat-send" id="chat-send"><span class="title">Send</span></button>' +
                '</div>' +
              '</div>' +
            '</div>' +

          '</div>' +
          '<div class="mp-btn-row">' +
            '<button class="mc-button mp-btn mp-cancel"><span class="title">Cancel</span></button>' +
          '</div>' +
        '</div>'
      );
    },
    projects: function () {
      return (
        '<div class="mp-page">' +
          '<div class="mp-title">Projects</div>' +

          '<div class="mp-list">' +
            buildProjectEntries() +
          '</div>' +

          '<div class="mp-btn-row">' +
            '<button class="mc-button mp-btn mp-cancel"><span class="title">Cancel</span></button>' +
          '</div>' +
        '</div>'
      );
    },
    contact: function () {
      var recipe = [
        null,                                               // 0: empty
        { name: 'Curiosity', icon: '339' },                 // 1
        null,                                               // 2: empty
        { name: 'Adaptability', icon: '339' },              // 3
        { name: 'Passion', icon: '264' },                   // 4: center
        { name: 'Persistence', icon: '339' },               // 5
        null,                                               // 6: empty
        { name: 'Teamwork', icon: '339' },                  // 7
        null                                                // 8: empty
      ];
      var grid = '';
      for (var i = 0; i < 9; i++) {
        if (recipe[i]) {
          grid +=
            '<div class="ct-grid-slot filled" data-slot="' + i + '" data-name="' + recipe[i].name + '">' +
              '<img class="ct-ingredient" src="assets/icons/' + recipe[i].icon + '.png">' +
            '</div>';
        } else {
          grid += '<div class="ct-grid-slot" data-slot="' + i + '"></div>';
        }
      }
      return (
        '<div class="mp-page crafting-page">' +
          '<div class="crafting-wrapper">' +
            '<div class="ct-holder">' +
              '<div class="ct-crafting clearfix">' +
                '<div class="ct-recipe">' +
                  '<h6 class="ct-title">Crafting</h6>' +
                  '<div class="ct-table" id="ct-grid">' + grid + '</div>' +
                '</div>' +
                '<div class="ct-arrow"></div>' +
                '<div class="ct-output" id="ct-output">' +
                  '<div class="ct-nametag" id="ct-nametag">Ethan\'s Resume</div>' +
                  '<div class="ct-grid-slot ct-grid-slot-lg filled">' +
                    '<img class="ct-ingredient" id="ct-resume" src="assets/icons/386.png">' +
                  '</div>' +
                  '<div class="ct-hint" id="ct-hint">Click to view!</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="mp-btn-row">' +
            '<button class="mc-button mp-btn mp-cancel"><span class="title">Cancel</span></button>' +
          '</div>' +
        '</div>'
      );
    },
  };

  var popups = {
    contactme: function () {
      return (
        '<div class="pd-overlay" id="pd-overlay">' +
          '<div class="pd-panel">' +
            '<div class="pd-inner">' +
              '<div class="pd-header">' +
                '<div class="pd-title">Contact Me</div>' +
                '<button class="pd-close" id="pd-close">\u00D7</button>' +
              '</div>' +
              '<div class="pd-contact-list">' +
                '<div class="pd-contact-item" onclick="window.open(\'https://www.linkedin.com/in/ey6/\',\'_blank\')">' +
                  '<span class="pd-contact-label">LinkedIn</span>' +
                  '<span class="pd-contact-value">linkedin.com/in/ey6</span>' +
                '</div>' +
                '<div class="pd-contact-item" onclick="window.open(\'mailto:ethn.yang@mail.utoronto.ca\')">' +
                  '<span class="pd-contact-label">Email</span>' +
                  '<span class="pd-contact-value">ethn.yang@mail.utoronto.ca</span>' +
                '</div>' +
                '<div class="pd-contact-item" onclick="window.open(\'https://github.com/e-yang6\',\'_blank\')">' +
                  '<span class="pd-contact-label">GitHub</span>' +
                  '<span class="pd-contact-value">github.com/e-yang6</span>' +
                '</div>' +
                '<div class="pd-contact-item" onclick="window.open(\'https://x.com/e_yang6\',\'_blank\')">' +
                  '<span class="pd-contact-label">Twitter</span>' +
                  '<span class="pd-contact-value">x.com/e_yang6</span>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    },
    blog: function () {
      return (
        '<div class="pd-overlay" id="pd-overlay">' +
          '<div class="pd-panel">' +
            '<div class="pd-inner">' +
              '<div class="pd-header">' +
                '<div class="pd-title">Blog</div>' +
                '<button class="pd-close" id="pd-close">\u00D7</button>' +
              '</div>' +
              '<div class="pd-desc pd-construction">Under construction...</div>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }
  };

  function syncMusicPlayerForSurface() {
    var mp = document.getElementById('music-player');
    if (!mp) return;
    var sub = document.getElementById('sub-page-overlay');
    var subOpen = sub && sub.classList.contains('visible');
    /* Popups: keep player visible under .pd-overlay (z-index). Sub-pages: hide it. */
    if (!subOpen) {
      mp.classList.add('visible');
    } else {
      mp.classList.remove('visible');
      mp.classList.remove('mp-initial-fade');
    }
  }

  function showPopup(html) {
    var existing = document.getElementById('pd-overlay');
    if (existing) existing.remove();
    var wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper.firstChild);
    var pdOverlay = document.getElementById('pd-overlay');
    syncMusicPlayerForSurface();
    requestAnimationFrame(function () { pdOverlay.classList.add('visible'); });
    document.getElementById('pd-close').addEventListener('click', function (ev) {
      ev.stopPropagation();
      pdOverlay.classList.remove('visible');
      setTimeout(function () {
        pdOverlay.remove();
        syncMusicPlayerForSurface();
      }, 200);
    });
    pdOverlay.addEventListener('click', function (ev) {
      if (ev.target === pdOverlay) {
        pdOverlay.classList.remove('visible');
        setTimeout(function () {
          pdOverlay.remove();
          syncMusicPlayerForSurface();
        }, 200);
      }
    });
  }

  function initCraftingTable() {
    var page = document.querySelector('.crafting-page');
    var grid = document.getElementById('ct-grid');
    var outputWrap = document.getElementById('ct-output');
    var hint = document.getElementById('ct-hint');
    var resume = document.getElementById('ct-resume');
    var nametag = document.getElementById('ct-nametag');
    if (!grid || !page) return;

    var held = null;

    var floater = document.createElement('div');
    floater.className = 'ct-floater';
    page.appendChild(floater);

    function checkRecipe() {
      var slots = grid.querySelectorAll('.ct-grid-slot');
      var grid9 = [];
      slots.forEach(function (s) {
        var img = s.querySelector('.ct-ingredient');
        if (s.classList.contains('filled') && img) {
          grid9.push(img.src.indexOf('264') !== -1 ? 'diamond' : 'paper');
        } else {
          grid9.push(null);
        }
      });
      var valid =
        grid9[0] === null && grid9[1] === 'paper' && grid9[2] === null &&
        grid9[3] === 'paper' && grid9[4] === 'diamond' && grid9[5] === 'paper' &&
        grid9[6] === null && grid9[7] === 'paper' && grid9[8] === null;
      resume.style.visibility = valid ? 'visible' : 'hidden';
      hint.style.visibility = valid ? 'visible' : 'hidden';
      nametag.style.visibility = valid ? 'visible' : 'hidden';
    }

    function pickUp(slot, e) {
      var img = slot.querySelector('.ct-ingredient');
      if (!img) return;
      held = { img: img, slot: slot, name: slot.getAttribute('data-name') || '' };
      slot.classList.remove('filled');
      slot.removeAttribute('data-name');
      img.style.display = 'none';
      var clone = document.createElement('img');
      clone.className = 'ct-ingredient';
      clone.src = img.src;
      floater.innerHTML = '';
      floater.appendChild(clone);
      floater.style.display = 'block';
      floater.style.left = e.clientX + 'px';
      floater.style.top = e.clientY + 'px';
      checkRecipe();
    }

    function putDown(targetSlot) {
      if (!held) return;
      if (targetSlot && targetSlot !== held.slot && !targetSlot.classList.contains('filled')) {
        held.slot.classList.remove('filled');
        held.slot.removeAttribute('data-name');
        targetSlot.appendChild(held.img);
        targetSlot.classList.add('filled');
        targetSlot.setAttribute('data-name', held.name);
      } else {
        held.slot.classList.add('filled');
        held.slot.setAttribute('data-name', held.name);
      }
      held.img.style.display = '';
      held = null;
      floater.style.display = 'none';
      floater.innerHTML = '';
      checkRecipe();
    }

    /** Place held stack in slot; item that was there is now on the cursor (Minecraft style). */
    function exchangeWithHeld(targetSlot, e) {
      if (!held || targetSlot === held.slot) return;
      var targetImg = targetSlot.querySelector('.ct-ingredient');
      if (!targetImg) return;

      var sourceSlot = held.slot;
      var heldImg = held.img;
      var heldName = held.name;
      var targetName = targetSlot.getAttribute('data-name') || '';

      floater.innerHTML = '';
      floater.style.display = 'block';

      heldImg.style.display = '';

      targetSlot.classList.remove('filled');
      targetSlot.removeAttribute('data-name');
      targetImg.remove();

      targetSlot.appendChild(heldImg);
      targetSlot.classList.add('filled');
      targetSlot.setAttribute('data-name', heldName);

      sourceSlot.appendChild(targetImg);
      targetImg.style.display = 'none';
      if (targetName) {
        sourceSlot.setAttribute('data-name', targetName);
      } else {
        sourceSlot.removeAttribute('data-name');
      }

      var clone = document.createElement('img');
      clone.className = 'ct-ingredient';
      clone.src = targetImg.src;
      floater.appendChild(clone);
      floater.style.left = e.clientX + 'px';
      floater.style.top = e.clientY + 'px';

      held = { img: targetImg, slot: sourceSlot, name: targetName };
      checkRecipe();
    }

    window.addEventListener('mousemove', function (e) {
      if (held && floater.parentNode) {
        floater.style.left = e.clientX + 'px';
        floater.style.top = e.clientY + 'px';
      }
    });

    grid.addEventListener('mousedown', function (e) {
      var slot = e.target.closest('.ct-grid-slot');
      if (!slot) return;
      e.preventDefault();
      e.stopPropagation();
      if (held) {
        if (slot === held.slot) {
          putDown(null);
        } else if (!slot.classList.contains('filled')) {
          putDown(slot);
        } else {
          exchangeWithHeld(slot, e);
        }
      } else if (slot.classList.contains('filled') || slot.querySelector('.ct-ingredient')) {
        pickUp(slot, e);
      }
    });

    page.addEventListener('mousedown', function (e) {
      if (held && !e.target.closest('#ct-grid')) {
        e.preventDefault();
        putDown(null);
      }
    });

    outputWrap.addEventListener('click', function () {
      if (resume.style.visibility !== 'hidden') {
        var bookSound = new Audio('assets/book.mp3');
        bookSound.volume = 1;
        bookSound.play();
        var existing = document.getElementById('resume-overlay');
        if (existing) return;
        var ov = document.createElement('div');
        ov.id = 'resume-overlay';
        ov.innerHTML =
          '<div class="resume-book">' +
            '<div class="resume-book-composite">' +
              '<img class="resume-book-art" src="assets/book.png" alt="" role="presentation">' +
              '<div class="resume-document">' +
                '<img class="resume-preview-img" src="' +
                resumePreviewImgUrl +
                '" alt="Resume preview" width="600" height="780" decoding="async">' +
              '</div>' +
            '</div>' +
          '</div>';
        document.body.appendChild(ov);
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { ov.classList.add('visible'); });
        });
        setTimeout(function () {
          openResumeInNewTab();
        }, 1500);
        var bookEl = ov.querySelector('.resume-book');
        bookEl.addEventListener('click', function (ev) {
          ev.stopPropagation();
          openResumeInNewTab();
        });
        bookEl.addEventListener('keydown', function (ev) {
          if (ev.key !== 'Enter' && ev.key !== ' ') return;
          ev.preventDefault();
          ev.stopPropagation();
          openResumeInNewTab();
        });
        bookEl.setAttribute('role', 'button');
        bookEl.setAttribute('tabindex', '0');
        bookEl.setAttribute('aria-label', 'Open resume PDF');
        ov.addEventListener('click', function (ev) {
          if (ev.target === ov) {
            var closeSound = new Audio('assets/bookclose.mp3');
            closeSound.volume = 1;
            closeSound.play();
            ov.classList.remove('visible');
            setTimeout(function () { ov.remove(); }, 500);
          }
        });
      }
    });
  }

  function clearResumeBellSlot() {
    if (typeof Bell !== 'undefined' && Bell.destroy) Bell.destroy();
    var slot = document.getElementById('sub-page-bell-slot');
    if (slot) {
      slot.innerHTML = '';
      slot.classList.remove('sub-page-bell-slot--visible');
      slot.setAttribute('aria-hidden', 'true');
    }
  }

  function resumeBellMarkup() {
    return (
      '<div id="bell-widget" class="bell-widget" aria-live="polite">' +
        '<button type="button" id="bell-button" class="bell-button" aria-label="Ring the bell" title="Ring the bell">' +
          '<span class="bell-surface">' +
            '<canvas id="bell-canvas" width="96" height="96"></canvas>' +
            '<img id="bell-gif" class="bell-gif" src="" alt="" decoding="async" hidden />' +
          '</span>' +
        '</button>' +
        '<div class="bell-caption">This bell has been rung <span id="bell-count">—</span> times</div>' +
      '</div>'
    );
  }

  function mountResumeBell() {
    var slot = document.getElementById('sub-page-bell-slot');
    if (!slot) return;
    slot.innerHTML = resumeBellMarkup();
    slot.classList.add('sub-page-bell-slot--visible');
    slot.setAttribute('aria-hidden', 'false');
    try {
      if (typeof Bell !== 'undefined') Bell.init();
    } catch (err) {
      console.warn('Bell widget failed:', err);
    }
  }

  var splashes = [
    'Ports forwarded!',
    'Now with 100% more CSS!',
    'Git push --force!',
    '100% bug-free*',
    'npm install worked first try!',
    'It works on my machine!',
    'undefined is not a function!',
    'sudo make me a sandwich!',
    'Have you tried turning it off and on again?',
    'Segfault (core dumped)!',
  ];

  function randomizeSplash() {
    var el = document.getElementById('splash-text');
    if (el) el.textContent = splashes[Math.floor(Math.random() * splashes.length)];
  }

  function updateSubPageNavActive(pageId) {
    var nav = document.getElementById('sub-page-nav');
    if (!nav) return;
    nav.querySelectorAll('[data-sub-nav-page]').forEach(function (btn) {
      var match = !!pageId && btn.getAttribute('data-sub-nav-page') === pageId;
      btn.classList.toggle('sub-page-nav-btn--active', match);
    });
  }

  function init() {
    var overlay = document.getElementById('sub-page-overlay');
    var inner = document.getElementById('sub-page-inner');

    function loadSubPage(page) {
      if (!pages[page]) return false;
      if (typeof Chatbot !== 'undefined') Chatbot.destroy();
      clearResumeBellSlot();
      inner.innerHTML = pages[page]();
      overlay.classList.add('visible');
      if (page === 'about' && typeof Chatbot !== 'undefined') {
        Chatbot.init();
      }
      if (page === 'contact') {
        initCraftingTable();
        mountResumeBell();
      }
      if (page === 'projects') {
        initMcScrollbar(inner.querySelector('.mp-list'));
      }
      syncMusicPlayerForSurface();
      updateSubPageNavActive(page);
      return true;
    }

    var fontToggle = document.getElementById('font-toggle');
    fontToggle.addEventListener('click', function () {
      AudioManager.playClick();
      document.body.classList.toggle('readable-font');
      var isOn = document.body.classList.contains('readable-font');
      fontToggle.querySelector('.title').textContent = 'Friendly Font: ' + (isOn ? 'On' : 'Off');
    });

    // Sub-page buttons (main menu)
    document.querySelectorAll('[data-page]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        AudioManager.playClick();
        var page = btn.getAttribute('data-page');
        loadSubPage(page);
      });
    });

    // In-overlay quick nav (same pages; Contact Me / Blog open popups)
    var subNav = document.getElementById('sub-page-nav');
    if (subNav) {
      subNav.addEventListener('click', function (e) {
        var pageBtn = e.target.closest('[data-sub-nav-page]');
        var popupBtn = e.target.closest('[data-sub-nav-popup]');
        if (!pageBtn && !popupBtn) return;
        e.stopPropagation();
        AudioManager.playClick();
        if (pageBtn) {
          if (pageBtn.classList.contains('sub-page-nav-btn--active')) return;
          loadSubPage(pageBtn.getAttribute('data-sub-nav-page'));
          return;
        }
        var key = popupBtn.getAttribute('data-sub-nav-popup');
        if (popups[key]) showPopup(popups[key]());
      });
    }

    // Popup buttons (Contact Me, Blog)
    document.querySelectorAll('[data-popup]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        AudioManager.playClick();
        var key = btn.getAttribute('data-popup');
        if (popups[key]) showPopup(popups[key]());
      });
    });

    // External link buttons
    document.querySelectorAll('[data-link]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        AudioManager.playClick();
        var url = btn.getAttribute('data-link');
        window.open(url, '_blank');
      });
    });

    // Back button
    document.getElementById('btn-back').addEventListener('click', function () {
      AudioManager.playClick();
      overlay.classList.remove('visible');
      if (typeof Chatbot !== 'undefined') Chatbot.destroy();
      clearResumeBellSlot();
      updateSubPageNavActive(null);
      randomizeSplash();
      syncMusicPlayerForSurface();
    });

    // Project view buttons inside sub-pages also play click
    overlay.addEventListener('click', function (e) {
      if (e.target.classList.contains('mc-button') && e.target.id !== 'btn-back') {
        AudioManager.playClick();
      }
      // Cancel/Done button on mp-pages
      if (e.target.closest('.mp-cancel')) {
        AudioManager.playClick();
        overlay.classList.remove('visible');
        if (typeof Chatbot !== 'undefined') Chatbot.destroy();
        clearResumeBellSlot();
        updateSubPageNavActive(null);
        randomizeSplash();
        syncMusicPlayerForSurface();
      }
      var entry = e.target.closest('.mp-entry');
      if (entry) {
        AudioManager.playClick();
        var all = overlay.querySelectorAll('.mp-entry');
        all.forEach(function (el) { el.classList.remove('selected'); });
        entry.classList.add('selected');

        var projIdx = entry.getAttribute('data-project');
        if (projIdx !== null) {
          showPopup(buildProjectDetail(parseInt(projIdx)));
        }
      }
    });
  }

  function initMcScrollbar(list) {
    if (!list) return;
    var track = document.createElement('div');
    track.className = 'mc-scrollbar-track';
    var btnUp = document.createElement('div');
    btnUp.className = 'mc-sb-btn mc-sb-up';
    btnUp.innerHTML = '<span>&#9650;</span>';
    var btnDown = document.createElement('div');
    btnDown.className = 'mc-sb-btn mc-sb-down';
    btnDown.innerHTML = '<span>&#9660;</span>';
    var rail = document.createElement('div');
    rail.className = 'mc-sb-rail';
    var thumb = document.createElement('div');
    thumb.className = 'mc-sb-thumb';
    rail.appendChild(thumb);
    track.appendChild(btnUp);
    track.appendChild(rail);
    track.appendChild(btnDown);
    var wrapper = document.createElement('div');
    wrapper.className = 'mc-sb-wrapper';
    list.parentNode.insertBefore(wrapper, list);
    wrapper.appendChild(list);
    wrapper.appendChild(track);

    function update() {
      var ratio = list.clientHeight / list.scrollHeight;
      if (ratio >= 1) { track.style.display = 'none'; return; }
      track.style.display = '';
      var railH = rail.clientHeight;
      var thumbH = Math.max(30, railH * ratio);
      thumb.style.height = thumbH + 'px';
      var scrollRatio = list.scrollTop / (list.scrollHeight - list.clientHeight);
      thumb.style.top = (scrollRatio * (railH - thumbH)) + 'px';
    }

    list.addEventListener('scroll', update);
    new ResizeObserver(update).observe(list);
    setTimeout(update, 50);

    var dragging = false, startY = 0, startTop = 0;
    thumb.addEventListener('mousedown', function (e) {
      e.preventDefault();
      dragging = true;
      startY = e.clientY;
      startTop = parseFloat(thumb.style.top) || 0;
      document.body.style.userSelect = 'none';
    });
    window.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      var railH = rail.clientHeight;
      var thumbH = thumb.clientHeight;
      var maxTop = railH - thumbH;
      var newTop = Math.min(maxTop, Math.max(0, startTop + (e.clientY - startY)));
      thumb.style.top = newTop + 'px';
      list.scrollTop = (newTop / maxTop) * (list.scrollHeight - list.clientHeight);
    });
    window.addEventListener('mouseup', function () {
      dragging = false;
      document.body.style.userSelect = '';
    });

    var scrollAmt = 40;
    btnUp.addEventListener('mousedown', function () { list.scrollTop -= scrollAmt; });
    btnDown.addEventListener('mousedown', function () { list.scrollTop += scrollAmt; });

    rail.addEventListener('mousedown', function (e) {
      if (e.target === rail) {
        var rect = rail.getBoundingClientRect();
        var clickY = e.clientY - rect.top;
        var thumbMid = parseFloat(thumb.style.top) + thumb.clientHeight / 2;
        list.scrollTop += (clickY < thumbMid ? -200 : 200);
      }
    });
  }

  return { init: init, initMcScrollbar: initMcScrollbar, syncMusicPlayerForSurface: syncMusicPlayerForSurface };
})();
