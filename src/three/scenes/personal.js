/**
 * scenes/personal.js
 * Three floating hobby objects with coral-pink lighting.
 * Becomes The Nook district in Atlantis.
 * Each canvas is its own mini Three.js scene bound to a DOM element.
 */
import * as THREE from 'three';

/**
 * Create a mini-scene for a single personal item canvas.
 * Called per personal item card.
 */
export function createPersonalItemScene(canvas, objectType, color) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 50);
  camera.position.z = 4;

  /* ── Object ── */
  let geo;
  switch (objectType) {
    case 'sphere':
      geo = new THREE.SphereGeometry(0.9, 16, 12);
      break;
    case 'camera':
      geo = new THREE.BoxGeometry(1.4, 0.9, 0.7);
      break;
    default:
      geo = new THREE.OctahedronGeometry(0.9, 0);
  }

  const mat = new THREE.MeshStandardMaterial({
    color:             new THREE.Color(color),
    emissive:          new THREE.Color(color),
    emissiveIntensity: 0.4,
    roughness:         0.3,
    metalness:         0.7,
    transparent:       true,
    opacity:           0.9,
  });
  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);

  /* ── Wireframe overlay ── */
  const wireMat = new THREE.MeshBasicMaterial({
    color:       new THREE.Color(color),
    wireframe:   true,
    transparent: true,
    opacity:     0.15,
  });
  scene.add(new THREE.Mesh(geo, wireMat));

  /* ── Lighting ── */
  scene.add(new THREE.AmbientLight(0x050810, 3));
  const keyLight = new THREE.PointLight(new THREE.Color(color).getHex(), 3, 12);
  keyLight.position.set(3, 3, 3);
  scene.add(keyLight);
  scene.add(new THREE.PointLight(0x1D9E75, 1, 8));

  /* ── Particles ── */
  const pCount = 50;
  const pPos   = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    pPos[i * 3]     = (Math.random() - 0.5) * 5;
    pPos[i * 3 + 1] = (Math.random() - 0.5) * 5;
    pPos[i * 3 + 2] = (Math.random() - 0.5) * 5;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({
    color:       new THREE.Color(color),
    size:        0.05,
    transparent: true,
    opacity:     0.5,
    blending:    THREE.AdditiveBlending,
    depthWrite:  false,
  });
  scene.add(new THREE.Points(pGeo, pMat));

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();

  let raf;
  function tick(t) {
    raf = requestAnimationFrame(tick);
    const time = t * 0.001;
    mesh.rotation.x = time * 0.4;
    mesh.rotation.y = time * 0.6;
    mesh.position.y = Math.sin(time * 0.8) * 0.15;
    keyLight.intensity = 3 + Math.sin(time * 1.5) * 0.5;
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(tick);

  return { destroy: () => { cancelAnimationFrame(raf); renderer.dispose(); } };
}

/* ── Dummy exports for manager compatibility (personal uses own renderers) ── */
export function createPersonalScene() {
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  return { scene, camera, update: () => {} };
}
