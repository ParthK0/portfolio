/**
 * scenes/about.js
 * Rotating low-poly Atlantis obelisk with glowing runes.
 * Same model will stand in The Heart spawn plaza.
 */
import * as THREE from 'three';

export function createAboutScene() {
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 2, 12);
  camera.lookAt(0, 1, 0);

  /* ── Obelisk geometry (low-poly tapered box) ── */
  // Base
  const baseGeo = new THREE.BoxGeometry(2.2, 0.4, 2.2);
  const stoneMat = new THREE.MeshStandardMaterial({
    color:     0x1A2240,
    roughness: 0.85,
    metalness: 0.2,
  });
  const base = new THREE.Mesh(baseGeo, stoneMat);
  base.position.y = -2;

  // Shaft — tapered manually via scale trick
  const shaftGeo = new THREE.CylinderGeometry(0.35, 0.75, 4.5, 5, 1);
  const shaftMat = new THREE.MeshStandardMaterial({
    color:     0x141B2E,
    roughness: 0.7,
    metalness: 0.4,
  });
  const shaft = new THREE.Mesh(shaftGeo, shaftMat);
  shaft.position.y = 0.25;

  // Pyramid cap
  const capGeo = new THREE.ConeGeometry(0.38, 1.2, 5);
  const capMat = new THREE.MeshStandardMaterial({
    color:       0x1D9E75,
    emissive:    new THREE.Color(0x1D9E75),
    emissiveIntensity: 0.6,
    roughness:   0.3,
    metalness:   0.8,
  });
  const cap = new THREE.Mesh(capGeo, capMat);
  cap.position.y = 3.1;

  // Glowing rune rings (torus)
  const runeMat = new THREE.MeshStandardMaterial({
    color:             0x1D9E75,
    emissive:          new THREE.Color(0x1D9E75),
    emissiveIntensity: 1.2,
    transparent:       true,
    opacity:           0.7,
  });
  const runes = [];
  [-1.2, 0.2, 1.4].forEach((y) => {
    const rGeo = new THREE.TorusGeometry(0.6, 0.025, 8, 24);
    const rune = new THREE.Mesh(rGeo, runeMat.clone());
    rune.position.y = y;
    rune.rotation.x = Math.PI / 2;
    runes.push(rune);
    shaft.add(rune);
  });

  // Group
  const obelisk = new THREE.Group();
  obelisk.add(base, shaft, cap);
  obelisk.position.y = -0.5;
  scene.add(obelisk);

  /* ── Lighting ── */
  scene.add(new THREE.AmbientLight(0x0A1525, 1.5));
  const tealLight = new THREE.PointLight(0x1D9E75, 2, 20);
  tealLight.position.set(3, 5, 5);
  scene.add(tealLight);
  const rimLight = new THREE.PointLight(0x7F77DD, 1, 15);
  rimLight.position.set(-5, -2, 3);
  scene.add(rimLight);

  /* ── Particles around obelisk ── */
  const pCount = 120;
  const pPositions = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    const angle  = Math.random() * Math.PI * 2;
    const radius = 1.5 + Math.random() * 3;
    pPositions[i * 3]     = Math.cos(angle) * radius;
    pPositions[i * 3 + 1] = (Math.random() - 0.5) * 8;
    pPositions[i * 3 + 2] = Math.sin(angle) * radius;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
  const pMat = new THREE.PointsMaterial({
    color:       0x1D9E75,
    size:        0.06,
    transparent: true,
    opacity:     0.6,
    blending:    THREE.AdditiveBlending,
    depthWrite:  false,
  });
  scene.add(new THREE.Points(pGeo, pMat));

  function update(t) {
    const time = t * 0.001;
    obelisk.rotation.y = time * 0.25;
    tealLight.intensity = 2 + Math.sin(time * 1.5) * 0.5;
    cap.material.emissiveIntensity = 0.6 + Math.sin(time * 2) * 0.2;
    runes.forEach((r, i) => {
      r.material.emissiveIntensity = 0.9 + Math.sin(time * 1.5 + i * 1.2) * 0.4;
    });
  }

  return { scene, camera, update };
}
