/**
 * scenes/hero.js
 * Bioluminescent particle system + Aquaman Trident centerpiece.
 * Trident reacts to mouse movement via smooth parallax.
 */
import * as THREE from 'three';

/* ── Mouse state (shared across frames) ── */
let mouseX = 0;
let mouseY = 0;
document.addEventListener('mousemove', (e) => {
  mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
  mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
});

/* ── Build the Trident geometry ── */
function createTrident() {
  const group = new THREE.Group();

  const mat = new THREE.MeshStandardMaterial({
    color:             0x1D9E75,
    emissive:          new THREE.Color(0x1D9E75),
    emissiveIntensity: 1.0,
    metalness:         0.95,
    roughness:         0.08,
  });

  // Shaft
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.10, 0.16, 7, 8),
    mat.clone()
  );
  group.add(shaft);

  // Shaft base cap
  const base = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 8, 8),
    mat.clone()
  );
  base.position.y = -3.6;
  group.add(base);

  // Center prong (tall)
  const centerProng = new THREE.Mesh(
    new THREE.ConeGeometry(0.18, 2.8, 6),
    mat.clone()
  );
  centerProng.position.y = 5.0;
  group.add(centerProng);

  // Left prong
  const leftProng = new THREE.Mesh(
    new THREE.ConeGeometry(0.12, 2.0, 6),
    mat.clone()
  );
  leftProng.position.set(-0.75, 4.2, 0);
  leftProng.rotation.z = 0.32;
  group.add(leftProng);

  // Right prong
  const rightProng = new THREE.Mesh(
    new THREE.ConeGeometry(0.12, 2.0, 6),
    mat.clone()
  );
  rightProng.position.set(0.75, 4.2, 0);
  rightProng.rotation.z = -0.32;
  group.add(rightProng);

  // Prong cross-bar
  const bar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 2.0, 6),
    mat.clone()
  );
  bar.position.y  = 3.5;
  bar.rotation.z  = Math.PI / 2;
  group.add(bar);

  return group;
}

export function createHeroScene() {
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  camera.position.set(0, 0, 60);

  /* ── Particles ── */
  const COUNT     = 3500;
  const positions = new Float32Array(COUNT * 3);
  const colors    = new Float32Array(COUNT * 3);
  const sizes     = new Float32Array(COUNT);
  const speeds    = new Float32Array(COUNT);
  const offsets   = new Float32Array(COUNT);

  const palette = [
    new THREE.Color('#1D9E75'),
    new THREE.Color('#7F77DD'),
    new THREE.Color('#a0d8ef'),
    new THREE.Color('#D4537E'),
  ];

  for (let i = 0; i < COUNT; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 160;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 120;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
    const col = palette[Math.floor(Math.random() * palette.length)];
    colors[i * 3]     = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
    sizes[i]   = Math.random() * 1.8 + 0.4;
    speeds[i]  = Math.random() * 0.015 + 0.004;
    offsets[i] = Math.random() * Math.PI * 2;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(colors,    3));
  geo.setAttribute('size',     new THREE.BufferAttribute(sizes,     1));

  const mat = new THREE.PointsMaterial({
    size:            1.5,
    vertexColors:    true,
    transparent:     true,
    opacity:         0.7,
    sizeAttenuation: true,
    blending:        THREE.AdditiveBlending,
    depthWrite:      false,
  });

  const particles = new THREE.Points(geo, mat);
  scene.add(particles);

  /* ── Fog glow plane ── */
  const fogMat = new THREE.MeshBasicMaterial({
    color: 0x0A2035, transparent: true, opacity: 0.6, depthWrite: false,
  });
  const fogPlane = new THREE.Mesh(new THREE.PlaneGeometry(300, 200), fogMat);
  fogPlane.position.z = -50;
  scene.add(fogPlane);

  /* ── Trident ── */
  const trident = createTrident();
  trident.position.set(0, -2, 20);  // in front of particles
  trident.scale.setScalar(1.4);
  scene.add(trident);

  /* ── Lighting ── */
  scene.add(new THREE.AmbientLight(0x0D2535, 1));

  const tridentLight = new THREE.PointLight(0x1D9E75, 4, 80);
  tridentLight.position.set(0, 5, 25);
  scene.add(tridentLight);

  const fillLight = new THREE.PointLight(0x7F77DD, 1.5, 60);
  fillLight.position.set(-30, 20, 10);
  scene.add(fillLight);

  /* ── Update tick ── */
  const posAttr = geo.attributes.position;

  function update(t) {
    const time = t * 0.001;

    // Particles drift upward
    for (let i = 0; i < COUNT; i++) {
      const drift = offsets[i] + time * speeds[i];
      posAttr.array[i * 3]     += Math.sin(drift * 0.7) * 0.01;
      posAttr.array[i * 3 + 1] += speeds[i] * 0.3;
      if (posAttr.array[i * 3 + 1] > 60) posAttr.array[i * 3 + 1] = -60;
    }
    posAttr.needsUpdate = true;
    particles.rotation.y = time * 0.01;

    // Trident: gentle float + mouse parallax
    trident.position.y  = -2 + Math.sin(time * 0.6) * 1.2;
    trident.rotation.y += (mouseX * 0.4 - trident.rotation.y) * 0.04;
    trident.rotation.x += (-mouseY * 0.25 - trident.rotation.x) * 0.04;
    trident.rotation.z  = Math.sin(time * 0.4) * 0.03;

    // Trident light pulse (bioluminescent)
    tridentLight.intensity = 4 + Math.sin(time * 1.8) * 1.2;
  }

  return { scene, camera, update };
}

