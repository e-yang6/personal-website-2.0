/**
 * audio.js — Playlist music player and click sound
 */
const AudioManager = (function () {
  let musicStarted = false;
  let isPlaying = false;
  let currentIndex = 0;
  let targetVolume = 0.35;

  function buildTrackList() {
    var b = SiteScene.base();
    var scene = SiteScene.get();

    if (scene === 'secret') {
      // No playlist for secret mode — video has its own audio
      return [{ title: '???', artist: '???', src: '', gain: 0 }];
    }

    if (scene === 'nether') {
      return [
        { title: 'Pigstep', artist: 'Lena Raine', src: b + '/pigstep.mp3', gain: 0.18 },
        { title: 'Concrete Halls', artist: 'C418', src: b + '/concretehalls.mp3' },
        { title: 'Dead Voxel', artist: 'C418', src: b + '/deadvoxel.mp3' },
        { title: 'Ballad of the Cats', artist: 'C418', src: b + '/balladofthecats.mp3' },
        { title: 'Warmth', artist: 'C418', src: b + '/warmth.mp3' },
      ];
    }

    if (scene === 'end') {
      return [{ title: 'The End', artist: 'C418', src: b + '/theend.mp3' }];
    }

    return [
      { title: 'Mice on Venus', artist: 'C418', src: b + '/miceonvenus.mp3' },
      { title: 'Minecraft', artist: 'C418', src: b + '/minecraft.mp3' },
      { title: 'Subwoofer Lullaby', artist: 'C418', src: b + '/subwooferlullaby.mp3' },
      { title: 'Sweden', artist: 'C418', src: b + '/sweden.mp3' },
      { title: 'Wet Hands', artist: 'C418', src: b + '/wet hands.mp3' },
    ];
  }

  var allTracks = buildTrackList();

  function shuffleArray(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  function shufflePlaylistFromTracks(tracks) {
    if (SiteScene.get() === 'nether') {
      return shuffleArray(tracks.slice());
    }
    if (SiteScene.get() === 'end') {
      return tracks.slice();
    }
    return [tracks[0]].concat(shuffleArray(tracks.slice(1)));
  }

  var playlist = shufflePlaylistFromTracks(allTracks);

  var bgMusic = new Audio();
  bgMusic.preload = 'auto';
  bgMusic.volume = 0;

  var clickSound = new Audio('assets/click.mp3');
  clickSound.preload = 'auto';
  clickSound.volume = 0.15;

  var bellSound = new Audio('assets/bell.mp3');
  bellSound.preload = 'auto';
  bellSound.volume = 0.22;

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

  function trackGain() {
    var g = playlist[currentIndex].gain;
    return typeof g === 'number' ? g : 1;
  }

  function effectiveMusicVolume() {
    return targetVolume * trackGain();
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
      var cap = effectiveMusicVolume();
      if (bgMusic.volume > cap) {
        bgMusic.volume = cap;
      } else if (bgMusic.volume < cap) {
        var fadeIn = setInterval(function () {
          cap = effectiveMusicVolume();
          if (bgMusic.volume < cap) {
            bgMusic.volume = Math.min(bgMusic.volume + 0.01, cap);
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
      playlist = shufflePlaylistFromTracks(allTracks);
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
      bgMusic.volume = effectiveMusicVolume();
      clickSound.volume = targetVolume;
      bellSound.volume = Math.min(1, targetVolume * 1.1);
      textVolume = targetVolume * 0.4;
      var video = document.getElementById('secret-video');
      if (video && SiteScene.get() === 'secret') {
        video.volume = targetVolume;
      }
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

  function applySceneToPlaylist() {
    var video = document.getElementById('secret-video');
    if (SiteScene.get() === 'secret') {
      // Mute bgMusic, let the video's own audio play
      bgMusic.pause();
      isPlaying = false;
      updatePlayButton();
      if (trackEl) trackEl.textContent = '???';
      if (artistEl) artistEl.textContent = '???';
      // Unmute the video and apply user volume
      if (video) {
        video.muted = false;
        video.volume = targetVolume;
      }
      return;
    }
    // Switching back to normal — mute video, auto-play music
    if (video) {
      video.muted = true;
    }
    allTracks = buildTrackList();
    playlist = shufflePlaylistFromTracks(allTracks);
    currentIndex = 0;
    loadTrack(0);
    playTrack();
  }

  window.addEventListener('sitescenechange', applySceneToPlaylist);

  function playClick() {
    clickSound.currentTime = 0;
    clickSound.play().catch(function () {});
  }

  function playBell() {
    var clone = bellSound.cloneNode();
    clone.volume = bellSound.volume;
    /** Slight pitch wobble (also changes speed a hair, same as a tape varispeed). */
    clone.playbackRate = 0.94 + Math.random() * 0.12;
    clone.play().catch(function () {});
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
    playBell: playBell,
    playText: playText,
    startMusic: startMusic,
    togglePlay: togglePlay,
    nextTrack: nextTrack,
    prevTrack: prevTrack,
    addTrack: addTrack,
    getPlaylist: getPlaylist,
    getBgMusic: function () { return bgMusic; },
  };
})();
