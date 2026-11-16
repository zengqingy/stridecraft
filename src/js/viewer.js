import * as THREE from '../vendor/three/three.module.js';
import { GLTFLoader } from '../vendor/three/GLTFLoader.js';
import { OrbitControls } from '../vendor/three/OrbitControls.js';

// At most three renderers exist across this module, including product grids.
const active = new Set();
export const activeViewerCount = () => active.size;
function releaseObject(root) {
  const textures = new Set();
  root?.traverse(node => {
    node.geometry?.dispose();
    for (const material of [].concat(node.material || [])) {
      for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
      material.dispose();
    }
  });
  textures.forEach(texture => texture.dispose());
}
function walker(color) {
  const group = new THREE.Group();
  const frame = new THREE.MeshStandardMaterial({ color, metalness: .55, roughness: .36 });
  const rubber = new THREE.MeshStandardMaterial({ color: '#282922', roughness: .85 });
  function bar(a, b, radius = .035, material = frame) {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, start.distanceTo(end), 12), material);
    mesh.position.copy(start).add(end).multiplyScalar(.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize());
    group.add(mesh);
  }
  for (const x of [-.45, .45]) {
    bar([x, .12, -.35], [x * .85, 1.25, -.25]);
    bar([x, .12, .4], [x * .85, 1.25, -.25]);
    bar([x * .85, 1.25, -.25], [x * .85, 1.25, .05], .05, rubber);
    bar([x, .65, -.3], [x, .65, .3]);
    for (const z of [-.35, .4]) {
      const wheel = new THREE.Mesh(new THREE.TorusGeometry(.105, .035, 10, 24), rubber);
      wheel.rotation.y = Math.PI / 2; wheel.position.set(x, .12, z); group.add(wheel);
    }
  }
  bar([-.42, .8, -.28], [.42, .8, -.28]);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(.8, .045, .36), new THREE.MeshStandardMaterial({color: '#B08968'}));
  seat.position.set(0, .72, -.03); group.add(seat);
  group.position.y = -.7;
  return group;
}

/** Angles are in radians. Lazy initialization; returned controls survive recycling. */
export function createViewer(canvas, modelPath, options = {}) {
  let renderer, scene, camera, controls, model, resize, frame, dead = false, generation = 0;
  let angle = options.angle ?? Math.PI / 4, color = options.color ?? '#5A6B4E';
  const stage = canvas.parentElement;
  function state(value) { stage.dataset.viewerState = value; }
  function suspend() {
    generation++; cancelAnimationFrame(frame); resize?.disconnect(); controls?.dispose();
    releaseObject(scene); renderer?.dispose(); renderer?.forceContextLoss();
    renderer = scene = camera = controls = model = null;
    canvas.style.opacity = '0'; active.delete(api); state('poster');
  }
  async function init() {
    if (dead || renderer) return;
    if (active.size >= 3) active.values().next().value.suspend();
    const token = ++generation;
    try {
      renderer = new THREE.WebGLRenderer({canvas, alpha: true, antialias: true});
      active.add(api); renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
      scene = new THREE.Scene(); camera = new THREE.PerspectiveCamera(35, 1, .01, 100);
      camera.position.set(0, 1, 3.5);
      controls = new OrbitControls(camera, canvas);
      controls.target.set(0, 0, 0); controls.minPolarAngle = Math.PI / 3;
      controls.maxPolarAngle = Math.PI / 2; controls.enablePan = false; controls.enableZoom = false;
      controls.enableRotate = options.interactive !== false; controls.update();
      scene.add(new THREE.HemisphereLight(0xffffff, 0x6b6a63, 3));
      const light = new THREE.DirectionalLight(0xffffff, 4); light.position.set(3, 4, 3); scene.add(light);
      resize = new ResizeObserver(() => {
        if (!renderer) return;
        const {width, height} = stage.getBoundingClientRect();
        renderer.setSize(width, height, false); camera.aspect = width / Math.max(height, 1); camera.updateProjectionMatrix();
      }); resize.observe(stage);
      if (modelPath) {
        const gltf = await new GLTFLoader().loadAsync(modelPath);
        if (dead || token !== generation) { releaseObject(gltf.scene); return; }
        model = gltf.scene;
        const bounds = new THREE.Box3().setFromObject(model), size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3()), scale = 1.5 / Math.max(size.x, size.y, size.z, .001);
        model.scale.setScalar(scale); model.position.copy(center).multiplyScalar(-scale);
        const wrapper = new THREE.Group(); wrapper.add(model); model = wrapper;
      } else model = walker(color);
      scene.add(model); model.rotation.y = angle;
      canvas.style.opacity = '1'; state(modelPath ? 'glb' : 'procedural');
      function draw() { if (!renderer) return; renderer.render(scene, camera); frame = requestAnimationFrame(draw); }
      draw();
    } catch (error) { if (token === generation) { suspend(); state('fallback'); } }
  }
  const near = new IntersectionObserver(entries => { entries.forEach(entry => { if (entry.isIntersecting) init(); }); }, {rootMargin: '200px'});
  const far = new IntersectionObserver(entries => { entries.forEach(entry => { if (!entry.isIntersecting && renderer) suspend(); }); }, {rootMargin: '900px'});
  const api = {
    rotateTo(value) { angle = value; if (model) model.rotation.y = value; },
    setColor(value) { color = value; model?.traverse(node => { for (const mat of [].concat(node.material || [])) if (mat.metalness > .1) mat.color.set(value); }); },
    suspend,
    dispose() { dead = true; near.disconnect(); far.disconnect(); suspend(); }
  };
  const lost = event => { event.preventDefault(); if (renderer) suspend(); };
  canvas.addEventListener('webglcontextlost', lost);
  const dispose = api.dispose;
  api.dispose = () => { canvas.removeEventListener('webglcontextlost', lost); dispose(); };
  canvas.style.opacity = '0'; state('poster'); near.observe(canvas); far.observe(canvas);
  return api;
}
