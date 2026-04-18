/**
 * panorama.js — Three.js cubemap skybox with auto-rotation
 */
const Panorama = (function () {
  let scene, camera, renderer, cube;
  let lastTime = 0;
  const SECONDS_PER_REVOLUTION = 90;
  const RADIANS_PER_MS = (2 * Math.PI) / (SECONDS_PER_REVOLUTION * 1000);

  function init(container) {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
      85,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const loader = new THREE.TextureLoader();
    const faceFiles = [
      'assets/panorama2.png',
      'assets/panorama4.png',
      'assets/panorama5.png',
      'assets/panorama6.png',
      'assets/panorama1.png',
      'assets/panorama3.png',
    ];

    let loadedCount = 0;
    let failedCount = 0;

    const materials = faceFiles.map(function (file) {
      const tex = loader.load(
        file,
        function () {
          loadedCount++;
        },
        undefined,
        function () {
          failedCount++;
          if (failedCount === faceFiles.length) {
            container.style.background = '#4a3526';
          }
        }
      );
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      return new THREE.MeshBasicMaterial({
        map: tex,
        side: THREE.BackSide,
      });
    });

    const geometry = new THREE.BoxGeometry(500, 500, 500);
    cube = new THREE.Mesh(geometry, materials);
    scene.add(cube);

    window.addEventListener('resize', onResize);
    lastTime = performance.now();
    animate();
  }

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function animate() {
    requestAnimationFrame(animate);
    var now = performance.now();
    var delta = now - lastTime;
    lastTime = now;
    cube.rotation.y += RADIANS_PER_MS * delta;
    renderer.render(scene, camera);
  }

  return { init: init };
})();
