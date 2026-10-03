(function () {
  var canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  var mouse = { x: -1, y: -1, vx: 0, vy: 0 };
  var prevMouse = { x: -1, y: -1 };
  var PUSH_RADIUS = 200;
  var PUSH_STRENGTH = 6;
  var time = 0;

  var stars = [];
  var STAR_COUNT = 180;

  var planets = [];
  var sun = null;

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

    planets = [
      {
        x: canvas.width * 0.12,
        y: canvas.height * 0.25,
        baseX: canvas.width * 0.12,
        baseY: canvas.height * 0.25,
        vx: 0, vy: 0,
        radius: 18,
        depth: 0.6,
        color: [90, 110, 160],
        shadow: [40, 50, 90],
        ringColor: null
      },
      {
        x: canvas.width * 0.88,
        y: canvas.height * 0.65,
        baseX: canvas.width * 0.88,
        baseY: canvas.height * 0.65,
        vx: 0, vy: 0,
        radius: 28,
        depth: 0.8,
        color: [160, 120, 80],
        shadow: [90, 60, 35],
        ringColor: [180, 150, 110]
      },
      {
        x: canvas.width * 0.75,
        y: canvas.height * 0.15,
        baseX: canvas.width * 0.75,
        baseY: canvas.height * 0.15,
        vx: 0, vy: 0,
        radius: 10,
        depth: 0.4,
        color: [130, 90, 90],
        shadow: [70, 40, 40],
        ringColor: null
      }
    ];

    sun = {
      x: canvas.width * 0.05,
      y: canvas.height * 0.85,
      radius: 50,
      glowRadius: 250
    };
  }

  window.addEventListener('resize', resize);
  resize();

  document.addEventListener('mousemove', function (e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  function applyPush(obj, depthVal) {
    if (mouse.x < 0) return;
    var dx = obj.x - mouse.x;
    var dy = obj.y - mouse.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var radius = PUSH_RADIUS * depthVal;
    if (dist < radius && dist > 0) {
      var force = (1 - dist / radius) * PUSH_STRENGTH * depthVal;
      obj.vx += (dx / dist) * force + mouse.vx * force * 0.12;
      obj.vy += (dy / dist) * force + mouse.vy * force * 0.12;
    }
  }

  function drawSun() {
    var s = sun;
    var grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.glowRadius);
    grad.addColorStop(0, 'rgba(255, 200, 100, 0.12)');
    grad.addColorStop(0.15, 'rgba(255, 180, 80, 0.06)');
    grad.addColorStop(0.5, 'rgba(255, 150, 50, 0.02)');
    grad.addColorStop(1, 'rgba(255, 150, 50, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(s.x - s.glowRadius, s.y - s.glowRadius, s.glowRadius * 2, s.glowRadius * 2);

    var coreGrad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.radius);
    coreGrad.addColorStop(0, 'rgba(255, 230, 180, 0.25)');
    coreGrad.addColorStop(0.6, 'rgba(255, 200, 120, 0.1)');
    coreGrad.addColorStop(1, 'rgba(255, 180, 80, 0)');
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fillStyle = coreGrad;
    ctx.fill();
  }

  function drawPlanet(p) {
    ctx.save();
    ctx.translate(p.x, p.y);

    var lightAngle = Math.atan2(sun.y - p.y, sun.x - p.x);
    var lx = Math.cos(lightAngle) * p.radius * 0.3;
    var ly = Math.sin(lightAngle) * p.radius * 0.3;

    var grad = ctx.createRadialGradient(lx, ly, p.radius * 0.1, 0, 0, p.radius);
    var c = p.color;
    var s = p.shadow;
    grad.addColorStop(0, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ', 0.7)');
    grad.addColorStop(0.7, 'rgba(' + Math.floor((c[0]+s[0])/2) + ',' + Math.floor((c[1]+s[1])/2) + ',' + Math.floor((c[2]+s[2])/2) + ', 0.5)');
    grad.addColorStop(1, 'rgba(' + s[0] + ',' + s[1] + ',' + s[2] + ', 0.3)');

    ctx.beginPath();
    ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    if (p.ringColor) {
      var rc = p.ringColor;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.radius * 1.8, p.radius * 0.35, 0.3, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(' + rc[0] + ',' + rc[1] + ',' + rc[2] + ', 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.restore();
  }

  function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    time += 0.016;

    mouse.vx = mouse.x - prevMouse.x;
    mouse.vy = mouse.y - prevMouse.y;
    prevMouse.x = mouse.x;
    prevMouse.y = mouse.y;

    drawSun();

    for (var i = 0; i < stars.length; i++) {
      var st = stars[i];

      st.x += st.driftX * st.depth;
      st.y += st.driftY * st.depth;

      applyPush(st, st.depth);

      st.x += st.vx;
      st.y += st.vy;
      st.vx *= 0.94;
      st.vy *= 0.94;

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

    for (var j = 0; j < planets.length; j++) {
      var pl = planets[j];
      applyPush(pl, pl.depth);
      pl.x += pl.vx;
      pl.y += pl.vy;
      pl.vx *= 0.96;
      pl.vy *= 0.96;
      pl.x += (pl.baseX - pl.x) * 0.005;
      pl.y += (pl.baseY - pl.y) * 0.005;
      drawPlanet(pl);
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
