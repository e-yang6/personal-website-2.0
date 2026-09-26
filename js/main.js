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
  ];

  // Set random splash
  var splashEl = document.getElementById('splash-text');
  splashEl.textContent = splashes[Math.floor(Math.random() * splashes.length)];

  // Update splash on scene change
  window.addEventListener('sitescenechange', function (e) {
    if (e.detail && e.detail.id === 'secret') {
      splashEl.textContent = '???';
    } else {
      splashEl.textContent = splashes[Math.floor(Math.random() * splashes.length)];
    }
  });

  // Init panorama
  Panorama.init(document.getElementById('panorama-container'));

  // Init UI
  UI.init();

  // --- Splash screen sequence ---
  var splashScreen = document.getElementById('splash-screen');
  var splashLogo = document.getElementById('splash-logo');
  var splashChoices = document.getElementById('splash-choices');

  var menuBgVideo = document.getElementById('menu-bg-video');
  menuBgVideo.volume = 0.15;

  // Phase 1: fade out logo after a hold
  setTimeout(function () {
    splashLogo.classList.add('hidden');
  }, 1500);

  // Phase 1.5: fade in background video as splash bg goes transparent
  setTimeout(function () {
    splashScreen.classList.add('bg-transparent');
    menuBgVideo.classList.add('visible');
    menuBgVideo.play().catch(function () {});
  }, 2000);

  // Phase 2: show choices after logo fades
  setTimeout(function () {
    splashChoices.classList.add('visible');
  }, 2400);

  function fadeOutVideo() {
    menuBgVideo.classList.remove('visible');
    var fadeAudio = setInterval(function () {
      if (menuBgVideo.volume > 0.005) {
        menuBgVideo.volume = Math.max(0, menuBgVideo.volume - 0.005);
      } else {
        menuBgVideo.volume = 0;
        clearInterval(fadeAudio);
      }
    }, 50);
    menuBgVideo.addEventListener('transitionend', function () {
      clearInterval(fadeAudio);
      menuBgVideo.pause();
      menuBgVideo.removeAttribute('src');
      menuBgVideo.load();
    }, { once: true });
  }

  function revealSite() {
    splashScreen.classList.add('fade-out');
    fadeOutVideo();

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

    setTimeout(function () {
      splashScreen.style.display = 'none';
    }, 900);

    // Start music
    function tryStartMusic() {
      AudioManager.startMusic(function () {
        document.removeEventListener('click', tryStartMusic);
        document.removeEventListener('keydown', tryStartMusic);
        document.removeEventListener('touchstart', tryStartMusic);
      });
    }
    tryStartMusic();
    document.addEventListener('click', tryStartMusic);
    document.addEventListener('keydown', tryStartMusic);
    document.addEventListener('touchstart', tryStartMusic);
  }

  // Unmute video on first user interaction with the splash screen
  function unmuteBgVideo() {
    menuBgVideo.muted = false;
    splashScreen.removeEventListener('click', unmuteBgVideo);
    splashScreen.removeEventListener('touchstart', unmuteBgVideo);
  }
  splashScreen.addEventListener('click', unmuteBgVideo);
  splashScreen.addEventListener('touchstart', unmuteBgVideo);

  // Minecraft version: reveal the full site
  document.getElementById('choice-minecraft').addEventListener('click', revealSite);

  // Normal website: placeholder for now
  document.getElementById('choice-normal').addEventListener('click', function () {
    fadeOutVideo();
  });
})();
