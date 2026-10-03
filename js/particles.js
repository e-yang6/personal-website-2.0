(function () {
  var canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  var mouse = { x: -1, y: -1, vx: 0, vy: 0 };
  var prevMouse = { x: -1, y: -1 };
  var PUSH_RADIUS = 140;
  var PUSH_STRENGTH = 2;
  var time = 0;

  var stars = [];
  var STAR_COUNT = 180;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (stars.length === 0) init();
  }

  function init() {
    stars = [];
    for (var i = 0; i < STAR_COUNT; i++) {
      var depth = 0.2 + Math.random() * 0.8;
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: 0, vy: 0,
        depth: depth,
        size: 0.5 + depth * 1.5,
        baseOpacity: 0.15 + depth * 0.45,
        twinkleSpeed: 1.5 + Math.random() * 3,
        twinkleOffset: Math.random() * Math.PI * 2,
        driftX: (Math.random() - 0.5) * 0.08,
        driftY: (Math.random() - 0.5) * 0.08
      });
    }
  }

  window.addEventListener('resize', resize);
  resize();

  document.addEventListener('mousemove', function (e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    time += 0.016;

    mouse.vx = mouse.x - prevMouse.x;
    mouse.vy = mouse.y - prevMouse.y;
    prevMouse.x = mouse.x;
    prevMouse.y = mouse.y;

    for (var i = 0; i < stars.length; i++) {
      var st = stars[i];

      st.x += st.driftX * st.depth;
      st.y += st.driftY * st.depth;

      if (mouse.x >= 0) {
        var dx = st.x - mouse.x;
        var dy = st.y - mouse.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var radius = PUSH_RADIUS * st.depth;
        if (dist < radius && dist > 0) {
          var force = (1 - dist / radius) * PUSH_STRENGTH * st.depth;
          st.vx += (dx / dist) * force + mouse.vx * force * 0.08;
          st.vy += (dy / dist) * force + mouse.vy * force * 0.08;
        }
      }

      st.x += st.vx;
      st.y += st.vy;
      st.vx *= 0.96;
      st.vy *= 0.96;

      if (st.x < -10) st.x = canvas.width + 10;
      if (st.x > canvas.width + 10) st.x = -10;
      if (st.y < -10) st.y = canvas.height + 10;
      if (st.y > canvas.height + 10) st.y = -10;

      var twinkle = 0.5 + 0.5 * Math.sin(time * st.twinkleSpeed + st.twinkleOffset);
      var opacity = st.baseOpacity * (0.4 + 0.6 * twinkle);

      ctx.beginPath();
      ctx.arc(st.x, st.y, st.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, ' + opacity + ')';
      ctx.fill();

      if (st.depth > 0.7) {
        var glow = ctx.createRadialGradient(st.x, st.y, 0, st.x, st.y, st.size * 3);
        glow.addColorStop(0, 'rgba(255, 255, 255, ' + (opacity * 0.3) + ')');
        glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(st.x - st.size * 3, st.y - st.size * 3, st.size * 6, st.size * 6);
      }
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
