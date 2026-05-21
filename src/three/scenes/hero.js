/**
 * scenes/hero.js
 * Bioluminescent particle system — thousands of drifting glowing dots.
 * Becomes the ambient particle layer throughout all of Atlantis.
 */
import * as THREE from 'three';

export function createHeroScene() {
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  camera.position.set(0, 0, 60);

  /* ── Particles ── */
  const COUNT = 3500;
  const positions = new Float32Array(COUNT * 3);
  const colors    = new Float32Array(COUNT * 3);
  const sizes     = new Float32Array(COUNT);
  const speeds    = new Float32Array(COUNT);
  const offsets   = new Float32Array(COUNT);

  // Atlantis palette bioluminescent hues
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
    size:              1.5,
    vertexColors:      true,
    transparent:       true,
    opacity:           0.7,
    sizeAttenuation:   true,
    blending:          THREE.AdditiveBlending,
    depthWrite:        false,
  });

  const particles = new THREE.Points(geo, mat);
  scene.add(particles);

  /* ── Subtle ambient fog-glow plane ── */
  const fogGeo = new THREE.PlaneGeometry(300, 200);
  const fogMat = new THREE.MeshBasicMaterial({
    color:       0x0A2035,
    transparent: true,
    opacity:     0.6,
    depthWrite:  false,
  });
  const fogPlane = new THREE.Mesh(fogGeo, fogMat);
  fogPlane.position.z = -50;
  scene.add(fogPlane);

  /* ── Deep glow hemisphere ── */
  const ambLight = new THREE.AmbientLight(0x0D2535, 1);
  scene.add(ambLight);

  /* ── Update tick ── */
  const posAttr = geo.attributes.position;

  function update(t) {
    const time = t * 0.001;
    for (let i = 0; i < COUNT; i++) {
      const drift = offsets[i] + time * speeds[i];
      posAttr.array[i * 3]     += Math.sin(drift * 0.7) * 0.01;
      posAttr.array[i * 3 + 1] += speeds[i] * 0.3;

      // Wrap around top
      if (posAttr.array[i * 3 + 1] > 60) {
        posAttr.array[i * 3 + 1] = -60;
      }
    }
    posAttr.needsUpdate = true;
    particles.rotation.y = time * 0.01;
  }

  return { scene, camera, update };
}
