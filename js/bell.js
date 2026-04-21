/**
 * bell.js — Site bell: first frame static on one canvas; click plays GIF from first
 * "motion" frame (ImageDecoder). Falls back to stacked <img> if needed. Count: /api/bell
 */
var Bell = (function () {
  var ASSET = 'assets/bell.gif';
  var DISPLAY_MAX_PX = 96;
  /** If GIF decode fails mid-play, use this duration for <img> fallback (ms). */
  var IMG_FALLBACK_MS = 3800;
  /** Portion of sampled pixels that must change vs frame 0 to count as motion started. */
  var MOTION_THRESHOLD = 0.012;
  /**
   * GIFs often use long delays on “hold” frames then short delays on the ring.
   * Playback starts at the first frame at or after motion whose nominal delay is at most this (ms).
   */
  var FAST_RHYTHM_MAX_MS = 90;
  /** Every frame’s on-screen timing is clamped (ms) so playback never crawls then sprints. */
  var PLAYBACK_MIN_MS = 14;
  var PLAYBACK_MAX_MS = 36;
  /**
   * Many GIFs encode the same ring motion twice. Stop when the image matches the first
   * played frame again (low pixel diff) after at least this many frames.
   */
  var LOOP_MIN_FRAMES = 100;
  /** Lower = stricter match (0.04 ~= 4% sampled pixels differ). */
  var LOOP_MATCH_MAX = 0.04;

  var rateLimitResetTimer = null;

  var state = {
    buf: null,
    /** Incremented on each ring; animations compare and bail if stale. */
    ringGen: 0,
    /** Pending frame delay timeout (decoder or img fallback). */
    animTimer: null,
    /** null = not computed yet; number = first frame index where bell moves */
    motionStartFrame: null,
    /** First frame index used when clicking (skips slow “wind-up” delays). */
    playbackStartFrame: null,
    /** true if we should use <img> instead of ImageDecoder */
    useImgFallback: false,
    /** Resolves when buffer is loaded and motion index is known (or fallback chosen). */
    readyPromise: null,
    mountedBellBtn: null,
    onBellClick: null,
  };

  function $(id) {
    return document.getElementById(id);
  }

  function clearRateLimitChillTimer() {
    if (rateLimitResetTimer != null) {
      clearTimeout(rateLimitResetTimer);
      rateLimitResetTimer = null;
    }
  }

  function setBellCaptionRateLimitedMode(on) {
    var lead = document.getElementById('bell-caption-lead');
    var tail = document.getElementById('bell-caption-tail');
    if (lead) lead.style.display = on ? 'none' : '';
    if (tail) tail.style.display = on ? 'none' : '';
  }

  function showRateLimitedChill(retryAfterSec) {
    var el = $('bell-count');
    if (!el) return;
    clearRateLimitChillTimer();
    setBellCaptionRateLimitedMode(true);
    el.textContent = 'chill bruh';
    var sec =
      typeof retryAfterSec === 'number' && !isNaN(retryAfterSec) && retryAfterSec > 0
        ? Math.ceil(retryAfterSec)
        : 60;
    el.setAttribute('title', 'Slow down! Try again in about ' + String(sec) + ' seconds.');
    rateLimitResetTimer = setTimeout(function () {
      rateLimitResetTimer = null;
      refreshCount();
    }, sec * 1000);
  }

  function setCountText(n) {
    var el = $('bell-count');
    if (!el) return;
    if (typeof n === 'number') {
      clearRateLimitChillTimer();
      setBellCaptionRateLimitedMode(false);
      el.textContent = String(n);
      el.removeAttribute('title');
      return;
    }
    clearRateLimitChillTimer();
    setBellCaptionRateLimitedMode(false);
    el.textContent = '—';
    el.setAttribute('title', 'Total rings when the counter API is running');
  }

  async function refreshCount() {
    try {
      var res = await fetch('/api/bell', { method: 'GET' });
      if (!res.ok) throw new Error('bad status');
      var data = await res.json();
      if (typeof data.count === 'number') setCountText(data.count);
      else setCountText(null);
    } catch (e) {
      setCountText(null);
    }
  }

  async function postRing() {
    try {
      var res = await fetch('/api/bell', { method: 'POST' });
      var data = await res.json().catch(function () {
        return {};
      });
      if (res.status === 429 && data.error === 'rate_limited') {
        showRateLimitedChill(data.retryAfterSec);
        return;
      }
      if (res.ok && typeof data.count === 'number') {
        setCountText(data.count);
        return;
      }
    } catch (e) {}
    await refreshCount();
  }

  function layoutCanvasToFrame(canvas, vw, vh) {
    canvas.width = vw;
    canvas.height = vh;
    var scale = Math.min(1, DISPLAY_MAX_PX / Math.max(vw, vh));
    canvas.style.width = Math.round(vw * scale) + 'px';
    canvas.style.height = Math.round(vh * scale) + 'px';
  }

  function drawVideoFrameToCanvas(canvas, vf) {
    var ctx = canvas.getContext('2d');
    var w = vf.displayWidth || vf.codedWidth || vf.width || 48;
    var h = vf.displayHeight || vf.codedHeight || vf.height || 48;
    layoutCanvasToFrame(canvas, w, h);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(vf, 0, 0);
  }

  function diffRatio(a, b, w, h) {
    var step = 2;
    var changed = 0;
    var total = 0;
    for (var y = 0; y < h; y += step) {
      for (var x = 0; x < w; x += step) {
        var i = (y * w + x) * 4;
        var d =
          Math.abs(a.data[i] - b.data[i]) +
          Math.abs(a.data[i + 1] - b.data[i + 1]) +
          Math.abs(a.data[i + 2] - b.data[i + 2]);
        if (d > 36) changed++;
        total++;
      }
    }
    return total ? changed / total : 0;
  }

  /** Spec: duration is microseconds. Normalize to ms and drop absurd values. */
  function rawDelayMsFromResult(r) {
    var d = r.duration;
    if (d == null || d <= 0) return 33;
    var ms = d / 1000;
    if (ms > 2000) ms = d / 1e6;
    if (ms > 2000 || ms < 0) return 33;
    return ms;
  }

  function playbackDelayMs(r) {
    var ms = rawDelayMsFromResult(r);
    return Math.max(PLAYBACK_MIN_MS, Math.min(PLAYBACK_MAX_MS, ms));
  }

  function captureFrameImageData(decoder, frameIndex, w, h) {
    return decoder.decode({ frameIndex: frameIndex }).then(function (r) {
      var c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      var x = c.getContext('2d');
      x.imageSmoothingEnabled = false;
      x.drawImage(r.image, 0, 0);
      var id = x.getImageData(0, 0, w, h);
      r.image.close();
      return id;
    });
  }

  function computeMotionStart(buf) {
    if (typeof ImageDecoder === 'undefined') return Promise.resolve(0);
    var dec;
    try {
      dec = new ImageDecoder({ data: buf, type: 'image/gif' });
    } catch (e) {
      return Promise.resolve(0);
    }
    return dec.tracks.ready
      .then(function () {
        var track = dec.tracks[0];
        if (!track || track.frameCount < 2) return 0;
        var n = track.frameCount;
        var w = 0;
        var h = 0;
        return dec.decode({ frameIndex: 0 }).then(function (r0) {
          w = r0.image.displayWidth || r0.image.codedWidth || 1;
          h = r0.image.displayHeight || r0.image.codedHeight || 1;
          r0.image.close();
          return captureFrameImageData(dec, 0, w, h);
        })
          .then(function (id0) {
            var maxScan = Math.min(n - 1, 64);
            var chain = Promise.resolve();
            var found = 0;
            for (var i = 1; i <= maxScan; i++) {
              (function (fi) {
                chain = chain.then(function () {
                  if (found > 0) return;
                  return captureFrameImageData(dec, fi, w, h).then(function (idi) {
                    if (diffRatio(id0, idi, w, h) >= MOTION_THRESHOLD) {
                      found = fi;
                    }
                  });
                });
              })(i);
            }
            return chain.then(function () {
              return found > 0 ? found : 0;
            });
          });
      })
      .catch(function () {
        return 0;
      });
  }

  /** First index >= motionStart whose GIF delay is “fast”; skips long static holds before the ring. */
  function computeFastPlaybackStart(buf, motionStart) {
    try {
      var dec = new ImageDecoder({ data: buf, type: 'image/gif' });
    } catch (e) {
      return Promise.resolve(motionStart);
    }
    return dec.tracks.ready
      .then(function () {
        var track = dec.tracks[0];
        if (!track) return motionStart;
        var n = track.frameCount;
        var i = Math.max(0, Math.min(motionStart, n - 1));
        function next() {
          if (i >= n) return motionStart;
          return dec.decode({ frameIndex: i }).then(function (r) {
            var raw = rawDelayMsFromResult(r);
            r.image.close();
            if (raw <= FAST_RHYTHM_MAX_MS) return i;
            i++;
            return next();
          });
        }
        return next();
      })
      .catch(function () {
        return motionStart;
      });
  }

  function paintFrame0FromBuffer(buf) {
    if (typeof ImageDecoder === 'undefined') return Promise.reject();
    var dec = new ImageDecoder({ data: buf, type: 'image/gif' });
    return dec.tracks.ready
      .then(function () {
        return dec.decode({ frameIndex: 0 });
      })
      .then(function (r) {
        var canvas = $('bell-canvas');
        if (!canvas) return;
        drawVideoFrameToCanvas(canvas, r.image);
        r.image.close();
      });
  }

  function clearRingAnimTimer() {
    if (state.animTimer != null) {
      clearTimeout(state.animTimer);
      state.animTimer = null;
    }
  }

  function drawIdleFrame0FromBuf(buf, ctx, w, h, gen) {
    if (gen != null && gen !== state.ringGen) return Promise.resolve();
    var dec0 = new ImageDecoder({ data: buf, type: 'image/gif' });
    return dec0.tracks.ready
      .then(function () {
        if (gen != null && gen !== state.ringGen) return Promise.resolve();
        return dec0.decode({ frameIndex: 0 });
      })
      .then(function (r0) {
        if (!r0 || !r0.image) return;
        if (gen != null && gen !== state.ringGen) {
          r0.image.close();
          return;
        }
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(r0.image, 0, 0);
        r0.image.close();
      });
  }

  function playDecoderAnimation(buf, startFrame, gen) {
    var canvas = $('bell-canvas');
    if (!canvas) return Promise.resolve();
    var ctx = canvas.getContext('2d');
    var w = canvas.width;
    var h = canvas.height;
    var dec = new ImageDecoder({ data: buf, type: 'image/gif' });
    return dec.tracks.ready
      .then(function () {
        if (gen !== state.ringGen) return Promise.resolve();
        var track = dec.tracks[0];
        var n = track ? track.frameCount : 0;
        if (n < 1) return;
        var start = Math.max(0, Math.min(startFrame, n - 1));
        var i = start;
        var refId = null;
        function step() {
          if (gen !== state.ringGen) return Promise.resolve();
          if (i >= n) {
            return drawIdleFrame0FromBuf(buf, ctx, w, h, gen);
          }
          return dec.decode({ frameIndex: i }).then(function (r) {
            if (gen !== state.ringGen) {
              r.image.close();
              return Promise.resolve();
            }
            var ms = playbackDelayMs(r);
            var fi = i;
            ctx.clearRect(0, 0, w, h);
            ctx.drawImage(r.image, 0, 0);
            r.image.close();

            if (refId === null) {
              refId = ctx.getImageData(0, 0, w, h);
            } else if (fi > start && fi >= start + LOOP_MIN_FRAMES) {
              var cur = ctx.getImageData(0, 0, w, h);
              if (diffRatio(refId, cur, w, h) < LOOP_MATCH_MAX) {
                return drawIdleFrame0FromBuf(buf, ctx, w, h, gen);
              }
            }

            i++;
            if (i >= n) {
              return drawIdleFrame0FromBuf(buf, ctx, w, h, gen);
            }
            return new Promise(function (resolve) {
              clearRingAnimTimer();
              state.animTimer = setTimeout(function () {
                state.animTimer = null;
                resolve();
              }, ms);
            }).then(function () {
              if (gen !== state.ringGen) return Promise.resolve();
              return step();
            });
          });
        }
        return step();
      })
      .catch(function () {
        throw new Error('decoder_play');
      });
  }

  function fallbackImageFrame() {
    var img = new Image();
    img.onload = function () {
      var canvas = $('bell-canvas');
      if (canvas) {
        var w = img.naturalWidth || img.width || 48;
        var h = img.naturalHeight || img.height || 48;
        layoutCanvasToFrame(canvas, w, h);
        var ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0);
      }
    };
    img.src = ASSET;
  }

  function showImgFallbackPlay() {
    var canvas = $('bell-canvas');
    var gifEl = $('bell-gif');
    var btn = $('bell-button');
    if (!canvas || !gifEl) return;
    gifEl.src = ASSET + '?t=' + Date.now();
    gifEl.hidden = false;
    gifEl.setAttribute('aria-hidden', 'false');
    canvas.hidden = true;
    canvas.setAttribute('aria-hidden', 'true');
    if (btn) btn.classList.add('bell-button--playing');
  }

  function hideImgFallback() {
    var canvas = $('bell-canvas');
    var gifEl = $('bell-gif');
    var btn = $('bell-button');
    if (!canvas || !gifEl) return;
    gifEl.removeAttribute('src');
    gifEl.hidden = true;
    gifEl.setAttribute('aria-hidden', 'true');
    canvas.hidden = false;
    canvas.setAttribute('aria-hidden', 'false');
    if (btn) btn.classList.remove('bell-button--playing');
  }

  function loadFromNetwork() {
    if (state.buf) return;
    state.readyPromise = fetch(ASSET)
      .then(function (res) {
        return res.arrayBuffer();
      })
      .then(function (buf) {
        state.buf = buf;
        if (typeof ImageDecoder === 'undefined') {
          state.useImgFallback = true;
          fallbackImageFrame();
          return;
        }
        return paintFrame0FromBuffer(buf)
          .then(function () {
            return computeMotionStart(buf);
          })
          .then(function (mf) {
            state.motionStartFrame = mf;
            return computeFastPlaybackStart(buf, mf);
          })
          .then(function (pf) {
            state.playbackStartFrame = pf;
          })
          .catch(function () {
            state.useImgFallback = true;
            fallbackImageFrame();
          });
      })
      .catch(function () {
        state.useImgFallback = true;
        fallbackImageFrame();
      });
  }

  function destroy() {
    clearRateLimitChillTimer();
    clearRingAnimTimer();
    state.ringGen++;
    if (state.mountedBellBtn && state.onBellClick) {
      try {
        state.mountedBellBtn.removeEventListener('click', state.onBellClick);
      } catch (err) {}
    }
    state.mountedBellBtn = null;
    state.onBellClick = null;
  }

  function init() {
    destroy();
    var btn = $('bell-button');
    if (!btn) return;

    state.mountedBellBtn = btn;
    refreshCount();
    if (state.buf) {
      paintFrame0FromBuffer(state.buf).catch(function () {
        state.useImgFallback = true;
        fallbackImageFrame();
      });
    } else {
      loadFromNetwork();
    }

    state.onBellClick = function (e) {
      e.preventDefault();
      e.stopPropagation();

      clearRingAnimTimer();
      state.ringGen++;
      var gen = state.ringGen;

      if (typeof AudioManager !== 'undefined' && typeof AudioManager.playBell === 'function') {
        AudioManager.playBell();
      }
      postRing();

      function finishRing(forGen) {
        if (forGen !== state.ringGen) return;
        if (btn) btn.classList.remove('bell-button--playing');
      }

      if (btn) btn.classList.add('bell-button--playing');

      function scheduleImgFallbackStop() {
        clearRingAnimTimer();
        state.animTimer = setTimeout(function () {
          state.animTimer = null;
          if (gen !== state.ringGen) return;
          hideImgFallback();
          fallbackImageFrame();
          finishRing(gen);
        }, IMG_FALLBACK_MS);
      }

      if (state.useImgFallback) {
        showImgFallbackPlay();
        scheduleImgFallbackStop();
        return;
      }

      if (!state.buf || typeof ImageDecoder === 'undefined') {
        showImgFallbackPlay();
        scheduleImgFallbackStop();
        return;
      }

      var run = function () {
        var start =
          state.playbackStartFrame != null
            ? state.playbackStartFrame
            : state.motionStartFrame != null
              ? state.motionStartFrame
              : 0;
        return playDecoderAnimation(state.buf, start, gen)
          .then(function () {
            finishRing(gen);
          })
          .catch(function () {
            hideImgFallback();
            showImgFallbackPlay();
            scheduleImgFallbackStop();
          });
      };

      Promise.resolve(state.readyPromise)
        .then(function () {
          if (gen !== state.ringGen) return Promise.resolve();
          return run();
        })
        .catch(function () {
          if (gen !== state.ringGen) return;
          showImgFallbackPlay();
          scheduleImgFallbackStop();
        });
    };

    btn.addEventListener('click', state.onBellClick);
  }

  return { init: init, destroy: destroy };
})();
