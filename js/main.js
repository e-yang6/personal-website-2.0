/**
 * main.js — Initialize everything
 */
(function () {
  // Splash texts
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

  // Set random splash
  var splashEl = document.getElementById('splash-text');
  splashEl.textContent = splashes[Math.floor(Math.random() * splashes.length)];

  // Init panorama
  Panorama.init(document.getElementById('panorama-container'));

  // Init UI
  UI.init();

  // After a brief moment, fade in the site on top of the splash
  setTimeout(function () {
    document.getElementById('panorama-container').classList.add('visible');
    document.getElementById('vignette').classList.add('visible');
    document.getElementById('main-menu').classList.add('visible');
    var dock = document.getElementById('menu-dock');
    if (dock) dock.classList.add('visible');
    var fontToggle = document.getElementById('font-toggle');
    if (fontToggle) fontToggle.classList.add('visible');
    UI.syncMusicPlayerForSurface();
    var mp = document.getElementById('music-player');
    if (mp && mp.classList.contains('visible')) {
      mp.classList.add('mp-initial-fade');
      setTimeout(function () {
        mp.classList.remove('mp-initial-fade');
      }, 1300);
    }
  }, 1000);

  // Keep trying to start music on every interaction until it works
  function tryStartMusic() {
    AudioManager.startMusic(function () {
      document.removeEventListener('click', tryStartMusic);
      document.removeEventListener('keydown', tryStartMusic);
      document.removeEventListener('touchstart', tryStartMusic);
    });
  }
  document.addEventListener('click', tryStartMusic);
  document.addEventListener('keydown', tryStartMusic);
  document.addEventListener('touchstart', tryStartMusic);
})();
