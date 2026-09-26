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

  // Subtle parallax on splash background video
  var parallaxX = 0, parallaxY = 0, targetX = 0, targetY = 0;
  var parallaxFrame = 0;
  function lerpParallax() {
    parallaxX += (targetX - parallaxX) * 0.06;
    parallaxY += (targetY - parallaxY) * 0.06;
    menuBgVideo.style.transform = 'translate(' + parallaxX + 'px,' + parallaxY + 'px)';
    parallaxFrame = requestAnimationFrame(lerpParallax);
  }
  splashScreen.addEventListener('mousemove', function (e) {
    var cx = (e.clientX / window.innerWidth - 0.5) * 2;
    var cy = (e.clientY / window.innerHeight - 0.5) * 2;
    targetX = cx * -12;
    targetY = cy * -8;
    if (!parallaxFrame) parallaxFrame = requestAnimationFrame(lerpParallax);
  });
  parallaxFrame = requestAnimationFrame(lerpParallax);

  // Wait for user click to proceed past the logo
  var splashProceed = document.getElementById('splash-proceed');
  var splashCredit = document.getElementById('splash-credit');
  var proceeded = false;

  function proceedFromLogo() {
    if (proceeded) return;
    proceeded = true;
    splashScreen.removeEventListener('click', proceedFromLogo);
    splashScreen.removeEventListener('touchstart', proceedFromLogo);

    // Hide logo and "click to continue"
    splashLogo.classList.add('hidden');
    if (splashProceed) splashProceed.classList.add('hidden');

    // Fade in video after logo fades
    setTimeout(function () {
      splashScreen.classList.add('bg-transparent');
      menuBgVideo.classList.add('visible');
      menuBgVideo.play().catch(function () {});
      if (splashCredit) splashCredit.classList.add('visible');
    }, 500);

    // Show choices after video starts appearing
    setTimeout(function () {
      splashChoices.classList.add('visible');
    }, 900);

    // Unmute on this interaction
    menuBgVideo.muted = false;
  }

  splashScreen.addEventListener('click', proceedFromLogo);
  splashScreen.addEventListener('touchstart', proceedFromLogo);

  var audioFadeTimer = null;
  function stopParallax() {
    if (parallaxFrame) { cancelAnimationFrame(parallaxFrame); parallaxFrame = 0; }
    menuBgVideo.style.transform = '';
  }

  function fadeOutVideo() {
    stopParallax();
    menuBgVideo.classList.remove('visible');
    audioFadeTimer = setInterval(function () {
      if (menuBgVideo.volume > 0.005) {
        menuBgVideo.volume = Math.max(0, menuBgVideo.volume - 0.005);
      } else {
        menuBgVideo.volume = 0;
        clearInterval(audioFadeTimer);
        audioFadeTimer = null;
        menuBgVideo.pause();
      }
    }, 50);
  }

  function revealSite() {
    splashScreen.classList.add('fade-out');
    if (splashCredit) splashCredit.classList.remove('visible');
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


  window.returnToSplash = function () {
    // Hide minecraft portfolio UI
    document.getElementById('panorama-container').classList.remove('visible');
    document.getElementById('vignette').classList.remove('visible');
    document.getElementById('main-menu').classList.remove('visible');
    var dock = document.getElementById('menu-dock');
    if (dock) dock.classList.remove('visible');
    var fontToggle = document.getElementById('font-toggle');
    if (fontToggle) fontToggle.classList.remove('visible');
    var mp = document.getElementById('music-player');
    if (mp) mp.classList.remove('visible');
    var bg = AudioManager.getBgMusic();
    if (bg) { bg.pause(); bg.currentTime = 0; }

    // Restore splash screen with video (skip logo phase)
    splashScreen.style.display = '';
    splashScreen.classList.remove('fade-out');
    splashLogo.classList.add('hidden');
    if (splashProceed) splashProceed.classList.add('hidden');
    splashScreen.classList.add('bg-transparent');
    splashChoices.classList.add('visible');
    if (splashCredit) { splashCredit.style.display = ''; splashCredit.classList.add('visible'); }

    // Resume the video instantly (already loaded)
    if (audioFadeTimer) { clearInterval(audioFadeTimer); audioFadeTimer = null; }
    menuBgVideo.currentTime = 0;
    menuBgVideo.volume = 0.15;
    menuBgVideo.muted = false;
    menuBgVideo.classList.add('visible');
    menuBgVideo.play().catch(function () {});
    parallaxFrame = requestAnimationFrame(lerpParallax);
  };

  // Minecraft version: reveal the full site
  document.getElementById('choice-minecraft').addEventListener('click', revealSite);

  // Normal website: navigate to portfolio page
  document.getElementById('choice-normal').addEventListener('click', function () {
    window.location.href = 'portfolio.html';
  });
})();
