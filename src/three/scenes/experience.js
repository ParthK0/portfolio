/**
 * scenes/experience.js
 * Submarine porthole — circular window looking out at the ocean.
 * Fish drift past. Becomes The Lab porthole windows in Atlantis.
 */
import * as THREE from 'three';

export function createExperienceScene() {
  const scene  = new THREE.Scene();
  scene.background = new THREE.Color(0x010810);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 8);
  camera.lookAt(0, 0, 0);

  /* ── Ocean depth background ── */
  const bgGeo = new THREE.PlaneGeometry(40, 25);
  const bgMat = new THREE.MeshBasicMaterial({ color: 0x020F1C });
  const bg = new THREE.Mesh(bgGeo, bgMat);
  bg.position.z = -15;
  scene.add(bg);

  /* ── Porthole ring ── */
  const ringGeo = new THREE.TorusGeometry(3.2, 0.35, 12, 48);
  const ringMat = new THREE.MeshStandardMaterial({
    color:     0x2A3550,
    roughness: 0.3,
    metalness: 0.95,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  scene.add(ring);

  // Bolts around ring
  for (let i = 0; i < 12; i++) {
    const angle   = (i / 12) * Math.PI * 2;
    const boltGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.3, 6);
    const boltMat = new THREE.MeshStandardMaterial({ color: 0x4A5870, metalness: 1, roughness: 0.2 });
    const bolt    = new THREE.Mesh(boltGeo, boltMat);
    bolt.position.set(Math.cos(angle) * 3.2, Math.sin(angle) * 3.2, 0.15);
    bolt.rotation.x = Math.PI / 2;
    scene.add(bolt);
  }

  /* ── Ocean water effect (plane with shader-like material) ── */
  const waterGeo = new THREE.PlaneGeometry(8, 8, 24, 24);
  const waterMat = new THREE.MeshStandardMaterial({
    color:       0x062535,
    transparent: true,
    opacity:     0.55,
    roughness:   0.1,
    metalness:   0.6,
  });
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.position.z = -5;
  scene.add(water);

  /* ── Underwater light rays ── */
  for (let i = 0; i < 5; i++) {
    const rayGeo = new THREE.PlaneGeometry(0.08, 12);
    const rayMat = new THREE.MeshBasicMaterial({
      color:       0x1D9E75,
      transparent: true,
      opacity:     0.04 + Math.random() * 0.06,
      blending:    THREE.AdditiveBlending,
      depthWrite:  false,
    });
    const ray = new THREE.Mesh(rayGeo, rayMat);
    ray.position.set((Math.random() - 0.5) * 4, 0, -8);
    ray.rotation.z = (Math.random() - 0.5) * 0.4;
    ray.userData.rayIndex = i;
    scene.add(ray);
  }

  /* ── Fish ── */
  const fish = [];
  for (let i = 0; i < 6; i++) {
    const fishGroup = new THREE.Group();
    const bodyGeo = new THREE.SphereGeometry(0.15 + Math.random() * 0.12, 8, 6);
    bodyGeo.scale(1.8, 1, 1);
    const fishColors = [0x1D9E75, 0x7F77DD, 0xD4537E, 0xA0D8EF];
    const bodyMat = new THREE.MeshStandardMaterial({
      color:       fishColors[Math.floor(Math.random() * fishColors.length)],
      emissive:    new THREE.Color(fishColors[0]),
      emissiveIntensity: 0.3,
    });
    fishGroup.add(new THREE.Mesh(bodyGeo, bodyMat));
    // Tail
    const tailGeo = new THREE.ConeGeometry(0.1, 0.3, 4);
    const tail    = new THREE.Mesh(tailGeo, bodyMat.clone());
    tail.position.x    = -0.25;
    tail.rotation.z    = -Math.PI / 2;
    fishGroup.add(tail);

    fishGroup.position.set(
      (Math.random() - 0.5) * 10 - 6,
      (Math.random() - 0.5) * 4,
      -6 + Math.random() * 3,
    );
    fishGroup.userData = {
      speed:     0.004 + Math.random() * 0.006,
      bobOffset: Math.random() * Math.PI * 2,
    };
    fish.push(fishGroup);
    scene.add(fishGroup);
  }

  /* ── Particles (bubbles) ── */
  const bubbleCount = 80;
  const bPositions  = new Float32Array(bubbleCount * 3);
  for (let i = 0; i < bubbleCount; i++) {
    bPositions[i * 3]     = (Math.random() - 0.5) * 8;
    bPositions[i * 3 + 1] = (Math.random() - 0.5) * 8;
    bPositions[i * 3 + 2] = -10 + Math.random() * 5;
  }
  const bGeo = new THREE.BufferGeometry();
  bGeo.setAttribute('position', new THREE.BufferAttribute(bPositions, 3));
  const bMat = new THREE.PointsMaterial({
    color:       0x1D9E75,
    size:        0.05,
    transparent: true,
    opacity:     0.4,
    blending:    THREE.AdditiveBlending,
    depthWrite:  false,
  });
  scene.add(new THREE.Points(bGeo, bMat));

  /* ── Lighting ── */
  scene.add(new THREE.AmbientLight(0x050F1A, 2));
  const depthLight = new THREE.PointLight(0x0D3550, 2, 30);
  depthLight.position.set(0, 8, 0);
  scene.add(depthLight);

  function update(t) {
    const time = t * 0.001;
    fish.forEach((f) => {
      f.position.x += f.userData.speed;
      f.position.y = f.userData.bobOffset + Math.sin(time * 1.5 + f.userData.bobOffset) * 0.3;
      if (f.position.x > 6) f.position.x = -6;
    });
    ring.rotation.z = Math.sin(time * 0.15) * 0.01;
  }

  return { scene, camera, update };
}
