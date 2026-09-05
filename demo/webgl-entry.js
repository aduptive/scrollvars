import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import duckBytes from './Duck.glb';

// The classic Khronos rubber duck, driven entirely by the ScrollVars pin.
// No internal rAF: the driver calls setPin() and we render on demand.
let renderer, scene, camera, duck, inited = false, canvas;
let lastPin = 0, lastW = 0, lastH = 0;
let halfH = 1, halfW = 1;

function init() {
  inited = true;
  canvas = document.getElementById('phone-canvas');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(32, 1, 0.1, 80);

  scene.add(new THREE.AmbientLight(0xffffff, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 2.6);
  key.position.set(4, 7, 6);
  scene.add(key);
  const rim = new THREE.PointLight(0xa78bfa, 40);
  rim.position.set(-6, 2, -5);
  scene.add(rim);
  const warm = new THREE.PointLight(0xffb454, 18);
  warm.position.set(5, -3, 3);
  scene.add(warm);

  new GLTFLoader().parse(duckBytes.buffer, '', (gltf) => {
    duck = gltf.scene;
    // center the model and measure it so the camera can always frame it
    const box = new THREE.Box3().setFromObject(duck);
    const center = box.getCenter(new THREE.Vector3());
    duck.position.sub(center);
    const holder = new THREE.Group();
    holder.add(duck);
    duck = holder;
    const size = box.getSize(new THREE.Vector3());
    halfH = (size.y / 2) * 1.5;
    halfW = (Math.max(size.x, size.z) / 2) * 1.35;
    scene.add(duck);
    window.__phoneSetPin(lastPin);
  });
}

/** Sync buffer size and pick a camera distance that always fits the duck. */
function frame() {
  const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
  if (w !== lastW || h !== lastH) {
    lastW = w; lastH = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const vFov = (camera.fov * Math.PI) / 180;
  const zForHeight = halfH / Math.tan(vFov / 2);
  const zForWidth = halfW / (Math.tan(vFov / 2) * camera.aspect);
  return Math.max(zForHeight, zForWidth);
}

// Product-tour choreography: one orientation target per scene; the camera
// and the model interpolate between targets as the pin crosses each act.
const TARGETS = [
  { ry: -0.55, rx: 0.05, zoom: 1.12, up: 0.22 },              // frente — o bico
  { ry: Math.PI / 2 + 0.25, rx: 0.12, zoom: 1.02, up: 0.18 }, // perfil — a asa
  { ry: Math.PI + 0.45, rx: -0.12, zoom: 1.05, up: 0.3 },     // traseira — a cauda
  { ry: Math.PI * 2 - 0.55, rx: 0.5, zoom: 1.3, up: 0.45 },   // vista alta — o conjunto
];
const easeInOut = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;

window.__phoneSetPin = function (pin) {
  lastPin = pin;
  if (!inited) { init(); return; }
  if (!duck) return;
  const fitZ = frame();
  const n = TARGETS.length - 1;
  const s = Math.min(Math.max(pin, 0), 1) * n;
  const i = Math.min(Math.floor(s), n - 1);
  const f = easeInOut(s - i);
  const a = TARGETS[i], b = TARGETS[i + 1];

  duck.rotation.y = lerp(a.ry, b.ry, f);
  duck.rotation.x = lerp(a.rx, b.rx, f);
  camera.position.set(
    0,
    halfH * lerp(a.up, b.up, f),
    fitZ * lerp(a.zoom, b.zoom, f)
  );
  camera.lookAt(0, 0, 0);
  renderer.render(scene, camera);
};

window.addEventListener('resize', () => {
  if (inited && duck) window.__phoneSetPin(lastPin);
});
