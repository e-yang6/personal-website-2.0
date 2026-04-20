/**
 * audio.js — Playlist music player and click sound
 */
const AudioManager = (function () {
  let musicStarted = false;
  let isPlaying = false;
  let currentIndex = 0;
  let targetVolume = 0.35;

  var allTracks = [
    { title: 'Mice on Venus', artist: 'C418', src: 'assets/miceonvenus.mp3' },
    { title: 'Minecraft', artist: 'C418', src: 'assets/minecraft.mp3' },
    { title: 'Subwoofer Lullaby', artist: 'C418', src: 'assets/subwooferlullaby.mp3' },
    { title: 'Sweden', artist: 'C418', src: 'assets/sweden.mp3' },
    { title: 'Wet Hands', artist: 'C418', src: 'assets/wet hands.mp3' },
  ];

  function shuffleArray(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  var playlist = [allTracks[0]].concat(shuffleArray(allTracks.slice(1)));

  var bgMusic = new Audio();
  bgMusic.preload = 'auto';
  bgMusic.volume = 0;

  var clickSound = new Audio('assets/click.mp3');
  clickSound.preload = 'auto';
  clickSound.volume = 0.15;

  var textSound = new Audio('assets/text.mp3');
  textSound.preload = 'auto';
  var textVolume = 0.06;

  var trackEl = document.getElementById('player-track');
  var artistEl = document.getElementById('player-artist');
  var playBtn = document.getElementById('btn-play-small');
  var volumeSlider = document.getElementById('volume-slider');
  var progressBar = document.getElementById('player-progress-bar');
  var progressWrap = document.getElementById('player-progress');
  var currentTimeEl = document.getElementById('player-current');
  var durationEl = document.getElementById('player-duration');

  function formatTime(sec) {
    if (isNaN(sec) || !isFinite(sec)) return '0:00';
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function updateWidgetInfo() {
    var track = playlist[currentIndex];
    if (trackEl) trackEl.textContent = track.title;
    if (artistEl) artistEl.textContent = track.artist;
  }

  function updatePlayButton() {
    if (playBtn) {
      playBtn.innerHTML = isPlaying ? '&#10074;&#10074;' : '&#9654;';
    }
  }

  function loadTrack(index) {
    currentIndex = index;
    if (currentIndex < 0) currentIndex = playlist.length - 1;
    if (currentIndex >= playlist.length) currentIndex = 0;
    bgMusic.src = playlist[currentIndex].src;
    bgMusic.load();
    updateWidgetInfo();
  }

  function playTrack() {
    bgMusic.play().then(function () {
      isPlaying = true;
      musicStarted = true;
      updatePlayButton();
      if (bgMusic.volume < targetVolume) {
        var fadeIn = setInterval(function () {
          if (bgMusic.volume < targetVolume) {
            bgMusic.volume = Math.min(bgMusic.volume + 0.01, targetVolume);
          } else {
            clearInterval(fadeIn);
          }
        }, 40);
      }
    }).catch(function () {});
  }

  function pauseTrack() {
    bgMusic.pause();
    isPlaying = false;
    updatePlayButton();
  }

  function togglePlay() {
    if (isPlaying) {
      pauseTrack();
    } else {
      playTrack();
    }
  }

  function nextTrack() {
    var next = currentIndex + 1;
    if (next >= playlist.length) {
      playlist = [allTracks[0]].concat(shuffleArray(allTracks.slice(1)));
      next = 0;
    }
    loadTrack(next);
    if (musicStarted) playTrack();
  }

  function prevTrack() {
    if (bgMusic.currentTime > 3) {
      bgMusic.currentTime = 0;
    } else {
      loadTrack(currentIndex - 1);
      if (musicStarted) playTrack();
    }
  }

  bgMusic.addEventListener('ended', function () {
    nextTrack();
  });

  bgMusic.addEventListener('timeupdate', function () {
    if (progressBar && bgMusic.duration) {
      var pct = (bgMusic.currentTime / bgMusic.duration) * 100;
      progressBar.style.width = pct + '%';
    }
    if (currentTimeEl) currentTimeEl.textContent = formatTime(bgMusic.currentTime);
  });

  bgMusic.addEventListener('loadedmetadata', function () {
    if (durationEl) durationEl.textContent = formatTime(bgMusic.duration);
  });

  if (progressWrap) {
    progressWrap.addEventListener('click', function (e) {
      if (!bgMusic.duration) return;
      var rect = progressWrap.getBoundingClientRect();
      var pct = (e.clientX - rect.left) / rect.width;
      bgMusic.currentTime = pct * bgMusic.duration;
    });
  }

  if (volumeSlider) {
    volumeSlider.addEventListener('input', function () {
      targetVolume = volumeSlider.value / 100;
      bgMusic.volume = targetVolume;
      clickSound.volume = targetVolume;
      textVolume = targetVolume * 0.4;
    });
  }

  if (playBtn) playBtn.addEventListener('click', togglePlay);
  if (document.getElementById('btn-next')) {
    document.getElementById('btn-next').addEventListener('click', nextTrack);
  }
  if (document.getElementById('btn-prev')) {
    document.getElementById('btn-prev').addEventListener('click', prevTrack);
  }

  loadTrack(0);
  updatePlayButton();

  function playClick() {
    clickSound.currentTime = 0;
    clickSound.play().catch(function () {});
  }

  function playText() {
    var clone = textSound.cloneNode();
    clone.volume = textVolume;
    clone.play().catch(function () {});
  }

  function startMusic(onSuccess) {
    if (musicStarted) {
      if (onSuccess) onSuccess();
      return;
    }
    playTrack();
    if (onSuccess) {
      var check = setInterval(function () {
        if (musicStarted) {
          clearInterval(check);
          onSuccess();
        }
      }, 100);
    }
  }

  function addTrack(track) {
    playlist.push(track);
  }

  function getPlaylist() {
    return playlist;
  }

  return {
    playClick: playClick,
    playText: playText,
    startMusic: startMusic,
    togglePlay: togglePlay,
    nextTrack: nextTrack,
    prevTrack: prevTrack,
    addTrack: addTrack,
    getPlaylist: getPlaylist,
  };
})();
