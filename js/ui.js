/**
 * ui.js — Button interactions, sub-page transitions, content
 */
const UI = (function () {
  // Sub-page content templates
  var signalBars =
    '<div class="mp-signal"><div class="mp-signal-bar"></div><div class="mp-signal-bar"></div><div class="mp-signal-bar"></div><div class="mp-signal-bar"></div><div class="mp-signal-bar"></div></div>';

  var pages = {
    about: function () {
      return (
        '<div class="mp-page">' +
          '<div class="about-columns">' +

            '<div class="poem-left">' +
              '<div class="poem-row left">' +
                '<div class="poem-text cyan">Hi! I\'m Ethan, and I\'m a first year computer engineering student at the University of Toronto, and an incoming API Development Intern at Sun Life.</div>' +
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

            '<div class="mp-entry">' +
              '<div class="mp-icon"><div class="mp-icon-placeholder"></div></div>' +
              '<div class="mp-info">' +
                '<div class="mp-name">Minecraft Portfolio</div>' +
                '<div class="mp-motd">A portfolio replicating the MC Java Edition menu</div>' +
              '</div>' +
              '<div class="mp-right"><span class="mp-players">0/20</span>' + signalBars + '</div>' +
            '</div>' +

            '<div class="mp-entry">' +
              '<div class="mp-icon"><div class="mp-icon-placeholder"></div></div>' +
              '<div class="mp-info">' +
                '<div class="mp-name">Task Manager CLI</div>' +
                '<div class="mp-motd">Persistent storage, priority sorting</div>' +
              '</div>' +
              '<div class="mp-right"><span class="mp-players">0/20</span>' + signalBars + '</div>' +
            '</div>' +

            '<div class="mp-entry">' +
              '<div class="mp-icon"><div class="mp-icon-placeholder"></div></div>' +
              '<div class="mp-info">' +
                '<div class="mp-name">Weather Dashboard</div>' +
                '<div class="mp-motd">Interactive maps, 5-day forecasts</div>' +
              '</div>' +
              '<div class="mp-right"><span class="mp-players">0/20</span>' + signalBars + '</div>' +
            '</div>' +

            '<div class="mp-entry">' +
              '<div class="mp-icon"><div class="mp-icon-placeholder"></div></div>' +
              '<div class="mp-info">' +
                '<div class="mp-name">Chat Application</div>' +
                '<div class="mp-motd">Real-time chat with WebSockets and rooms</div>' +
              '</div>' +
              '<div class="mp-right"><span class="mp-players">0/20</span>' + signalBars + '</div>' +
            '</div>' +

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
    education: function () {
      return (
        '<div class="mp-page">' +
          '<div class="mp-title">Education</div>' +
          '<div class="mp-list">' +

            '<div class="mp-entry">' +
              '<div class="mp-icon"><div class="mp-icon-placeholder"></div></div>' +
              '<div class="mp-info">' +
                '<div class="mp-name">Bachelor of Computer Science</div>' +
                '<div class="mp-motd">University Name &middot; 2022 - 2026</div>' +
              '</div>' +
              '<div class="mp-right">' + signalBars + '</div>' +
            '</div>' +

            '<div class="mp-entry">' +
              '<div class="mp-icon"><div class="mp-icon-placeholder"></div></div>' +
              '<div class="mp-info">' +
                '<div class="mp-name">High School Diploma</div>' +
                '<div class="mp-motd">High School Name &middot; 2018 - 2022</div>' +
              '</div>' +
              '<div class="mp-right">' + signalBars + '</div>' +
            '</div>' +

            '<div class="mp-entry">' +
              '<div class="mp-icon"><div class="mp-icon-placeholder"></div></div>' +
              '<div class="mp-info">' +
                '<div class="mp-name">Relevant Coursework</div>' +
                '<div class="mp-motd">Data Structures, Algorithms, Web Dev, Databases, OS</div>' +
              '</div>' +
              '<div class="mp-right">' + signalBars + '</div>' +
            '</div>' +

          '</div>' +
          '<div class="mp-btn-row">' +
            '<button class="mc-button mp-btn mp-cancel"><span class="title">Cancel</span></button>' +
          '</div>' +
        '</div>'
      );
    },
    contactme: function () {
      return (
        '<div class="mp-page">' +
          '<div class="mp-title">Contact Me</div>' +
          '<div class="mp-list">' +

            '<div class="mp-entry" onclick="window.open(\'mailto:developer@example.com\')">' +
              '<div class="mp-icon"><div class="mp-icon-placeholder"></div></div>' +
              '<div class="mp-info">' +
                '<div class="mp-name">Email</div>' +
                '<div class="mp-motd">developer@example.com</div>' +
              '</div>' +
              '<div class="mp-right">' + signalBars + '</div>' +
            '</div>' +

            '<div class="mp-entry" onclick="window.open(\'https://github.com\',\'_blank\')">' +
              '<div class="mp-icon"><div class="mp-icon-placeholder"></div></div>' +
              '<div class="mp-info">' +
                '<div class="mp-name">GitHub</div>' +
                '<div class="mp-motd">github.com/developer</div>' +
              '</div>' +
              '<div class="mp-right">' + signalBars + '</div>' +
            '</div>' +

            '<div class="mp-entry" onclick="window.open(\'#\',\'_blank\')">' +
              '<div class="mp-icon"><div class="mp-icon-placeholder"></div></div>' +
              '<div class="mp-info">' +
                '<div class="mp-name">LinkedIn</div>' +
                '<div class="mp-motd">linkedin.com/in/developer</div>' +
              '</div>' +
              '<div class="mp-right">' + signalBars + '</div>' +
            '</div>' +

          '</div>' +
          '<div class="mp-btn-row">' +
            '<button class="mc-button mp-btn mp-cancel"><span class="title">Cancel</span></button>' +
          '</div>' +
        '</div>'
      );
    },
  };

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
      held = { img: img, slot: slot, name: slot.getAttribute('data-name') };
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
        if (!slot.classList.contains('filled')) {
          putDown(slot);
        } else if (slot === held.slot) {
          putDown(null);
        }
      } else if (slot.classList.contains('filled')) {
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
        AudioManager.playClick();
        window.open('#', '_blank');
      }
    });
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

  function init() {
    var overlay = document.getElementById('sub-page-overlay');
    var inner = document.getElementById('sub-page-inner');

    // Sub-page buttons
    document.querySelectorAll('[data-page]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        AudioManager.playClick();
        var page = btn.getAttribute('data-page');
        if (pages[page]) {
          inner.innerHTML = pages[page]();
          overlay.classList.add('visible');
          if (page === 'about' && typeof Chatbot !== 'undefined') {
            Chatbot.init();
          }
          if (page === 'contact') {
            initCraftingTable();
          }
        }
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
      randomizeSplash();
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
        randomizeSplash();
      }
      // Server entry selection
      var entry = e.target.closest('.mp-entry');
      if (entry) {
        AudioManager.playClick();
        var all = overlay.querySelectorAll('.mp-entry');
        all.forEach(function (el) { el.classList.remove('selected'); });
        entry.classList.add('selected');
      }
    });
  }

  return { init: init };
})();
