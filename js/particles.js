(function () {
  var canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  var particles = [];
  var COUNT = 120;
  var mouse = { x: -1, y: -1, vx: 0, vy: 0 };
  var prevMouse = { x: -1, y: -1 };
  var PUSH_RADIUS = 180;
  var PUSH_STRENGTH = 8;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  for (var i = 0; i < COUNT; i++) {
    var depth = 0.3 + Math.random() * 0.7;
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      homeX: 0,
      homeY: 0,
      vx: 0,
      vy: 0,
      depth: depth,
      size: 1 + depth * 2.5,
      opacity: 0.08 + depth * 0.18,
      driftX: (Math.random() - 0.5) * 0.15,
      driftY: -0.1 - Math.random() * 0.2
    });
    particles[i].homeX = particles[i].x;
    particles[i].homeY = particles[i].y;
  }

  document.addEventListener('mousemove', function (e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    mouse.vx = mouse.x - prevMouse.x;
    mouse.vy = mouse.y - prevMouse.y;
    prevMouse.x = mouse.x;
    prevMouse.y = mouse.y;

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];

      p.x += p.driftX * p.depth;
      p.y += p.driftY * p.depth;

      if (mouse.x >= 0) {
        var dx = p.x - mouse.x;
        var dy = p.y - mouse.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var radius = PUSH_RADIUS * p.depth;

        if (dist < radius && dist > 0) {
          var force = (1 - dist / radius) * PUSH_STRENGTH * p.depth;
          p.vx += (dx / dist) * force + mouse.vx * force * 0.15;
          p.vy += (dy / dist) * force + mouse.vy * force * 0.15;
        }
      }

      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.92;
      p.vy *= 0.92;

      if (p.x < -20) p.x = canvas.width + 20;
      if (p.x > canvas.width + 20) p.x = -20;
      if (p.y < -20) p.y = canvas.height + 20;
      if (p.y > canvas.height + 20) p.y = -20;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, ' + p.opacity + ')';
      ctx.fill();
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
