/**
 * scene.js — Overworld / Nether / End asset roots (panorama, music, sub-page + chat BG).
 * Persists in localStorage; dispatches sitescenechange for panorama + audio reload.
 */
const SiteScene = (function () {
  var STORAGE_KEY = 'portfolio-site-scene';
  var VALID = ['overworld', 'nether', 'end', 'secret'];
  var current = 'overworld';

  function base() {
    return 'assets/' + current;
  }

  function get() {
    return current;
  }

  function refreshButtons() {
    var bar = document.getElementById('scene-switch');
    if (!bar) return;
    bar.querySelectorAll('[data-scene]').forEach(function (btn) {
      var id = btn.getAttribute('data-scene');
      btn.classList.toggle('scene-btn--active', id === current);
    });
  }

  function set(id) {
    if (VALID.indexOf(id) === -1) return;
    current = id;
    try {
      // Never persist the secret theme — it resets to overworld on reload
      if (id !== 'secret') localStorage.setItem(STORAGE_KEY, current);
    } catch (e) {}
    document.documentElement.setAttribute('data-scene', current);
    refreshButtons();
    window.dispatchEvent(new CustomEvent('sitescenechange', { detail: { id: current } }));
  }

  function bindBar() {
    var bar = document.getElementById('scene-switch');
    if (!bar) return;
    bar.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-scene]');
      if (!btn) return;
      var id = btn.getAttribute('data-scene');
      if (id === current) return;
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      set(id);
    });
  }

  function init() {
    try {
      var s = localStorage.getItem(STORAGE_KEY);
      if (s && s !== 'secret' && VALID.indexOf(s) !== -1) current = s;
    } catch (e) {}
    document.documentElement.setAttribute('data-scene', current);
    bindBar();
    refreshButtons();
  }

  return { init: init, get: get, set: set, base: base, refreshButtons: refreshButtons };
})();

SiteScene.init();
