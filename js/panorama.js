/**
 * panorama.js — Three.js cubemap skybox with auto-rotation (per-scene faces under assets/<scene>/).
 */
const Panorama = (function () {
  var scene, camera, renderer, cube;
  var lastTime = 0;
  var containerRef = null;
  var SECONDS_PER_REVOLUTION = 90;
  var RADIANS_PER_MS = (2 * Math.PI) / (SECONDS_PER_REVOLUTION * 1000);

  function disposeCube() {
    if (!cube || !scene) return;
    scene.remove(cube);
    var mats = cube.material;
    var matArray = Array.isArray(mats) ? mats : [mats];
    matArray.forEach(function (mat) {
      if (mat.map) mat.map.dispose();
      mat.dispose();
    });
    cube.geometry.dispose();
    cube = null;
  }

  function buildCubemap(basePath) {
    var loader = new THREE.TextureLoader();
    var faceFiles = [
      basePath + '/panorama2.png',
      basePath + '/panorama4.png',
      basePath + '/panorama5.png',
      basePath + '/panorama6.png',
      basePath + '/panorama1.png',
      basePath + '/panorama3.png',
    ];

    var loadedCount = 0;
    var failedCount = 0;

    var materials = faceFiles.map(function (file) {
      var tex = loader.load(
        file,
        function () {
          loadedCount++;
        },
        undefined,
        function () {
          failedCount++;
          if (failedCount === faceFiles.length && containerRef) {
            containerRef.style.background = '#4a3526';
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

    var geometry = new THREE.BoxGeometry(500, 500, 500);
    cube = new THREE.Mesh(geometry, materials);
    scene.add(cube);
  }

  function rebuildCubemap() {
    if (!containerRef || !scene) return;
    var video = document.getElementById('secret-video');
    if (SiteScene.get() === 'secret') {
      disposeCube();
      if (renderer) renderer.domElement.style.display = 'none';
      if (video) {
        video.play().catch(function () {});
      }
      return;
    }
    // Switching back from secret to a normal theme
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
    if (renderer) renderer.domElement.style.display = '';
    disposeCube();
    buildCubemap(SiteScene.base());
  }

  function init(container) {
    containerRef = container;
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

    buildCubemap(SiteScene.base());

    window.addEventListener('resize', onResize);
    window.addEventListener('sitescenechange', rebuildCubemap);

    lastTime = performance.now();
    animate();
  }

  function onResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function animate() {
    requestAnimationFrame(animate);
    if (!cube || !renderer || !scene || !camera) return;
    var now = performance.now();
    var delta = now - lastTime;
    lastTime = now;
    cube.rotation.y += RADIANS_PER_MS * delta;
    renderer.render(scene, camera);
  }

  return { init: init };
})();
