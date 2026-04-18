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
          '<div class="mp-title">About Me</div>' +
          '<div class="mp-list">' +

            '<div class="mp-entry">' +
              '<div class="mp-icon"><div class="mp-icon-placeholder"></div></div>' +
              '<div class="mp-info">' +
                '<div class="mp-name">Who I Am</div>' +
                '<div class="mp-motd">Hi! I\'m a passionate developer who loves building things for the web.</div>' +
              '</div>' +
              '<div class="mp-right">' + signalBars + '</div>' +
            '</div>' +

            '<div class="mp-entry">' +
              '<div class="mp-icon"><div class="mp-icon-placeholder"></div></div>' +
              '<div class="mp-info">' +
                '<div class="mp-name">What I Do</div>' +
                '<div class="mp-motd">I craft clean, performant applications and explore new technologies.</div>' +
              '</div>' +
              '<div class="mp-right">' + signalBars + '</div>' +
            '</div>' +

            '<div class="mp-entry">' +
              '<div class="mp-icon"><div class="mp-icon-placeholder"></div></div>' +
              '<div class="mp-info">' +
                '<div class="mp-name">Skills</div>' +
                '<div class="mp-motd">JavaScript, TypeScript, React, Node.js, Python, Three.js, SQL, Docker</div>' +
              '</div>' +
              '<div class="mp-right">' + signalBars + '</div>' +
            '</div>' +

            '<div class="mp-entry">' +
              '<div class="mp-icon"><div class="mp-icon-placeholder"></div></div>' +
              '<div class="mp-info">' +
                '<div class="mp-name">Interests</div>' +
                '<div class="mp-motd">Gaming, open-source, creative coding, and pixel art</div>' +
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
            '<button class="mc-button mp-btn" onclick="window.open(\'#\',\'_blank\')"><span class="title">View Project</span></button>' +
            '<button class="mc-button mp-btn" onclick="window.open(\'#\',\'_blank\')"><span class="title">Source Code</span></button>' +
            '<button class="mc-button mp-btn mp-cancel"><span class="title">Cancel</span></button>' +
          '</div>' +
        '</div>'
      );
    },
    contact: function () {
      return (
        '<div class="mp-page">' +
          '<div class="mp-title">Work Experience</div>' +
          '<div class="mp-list">' +

            '<div class="mp-entry">' +
              '<div class="mp-icon"><div class="mp-icon-placeholder"></div></div>' +
              '<div class="mp-info">' +
                '<div class="mp-name">Software Engineer Intern</div>' +
                '<div class="mp-motd">Company Name &middot; Summer 2025</div>' +
              '</div>' +
              '<div class="mp-right">' + signalBars + '</div>' +
            '</div>' +

            '<div class="mp-entry">' +
              '<div class="mp-icon"><div class="mp-icon-placeholder"></div></div>' +
              '<div class="mp-info">' +
                '<div class="mp-name">Web Developer</div>' +
                '<div class="mp-motd">Freelance &middot; 2024 - Present</div>' +
              '</div>' +
              '<div class="mp-right">' + signalBars + '</div>' +
            '</div>' +

            '<div class="mp-entry">' +
              '<div class="mp-icon"><div class="mp-icon-placeholder"></div></div>' +
              '<div class="mp-info">' +
                '<div class="mp-name">Teaching Assistant</div>' +
                '<div class="mp-motd">University CS Department &middot; Fall 2024</div>' +
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
