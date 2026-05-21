/**
 * scenes/skills.js
 * Rotating hexagonal crystal cluster — The Forge district preview.
 * Returns `highlightCrystal(index)` for hover interaction.
 */
import * as THREE from 'three';

const SKILL_COUNT = 12;

export function createSkillsScene() {
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 2, 14);
  camera.lookAt(0, 0, 0);

  const crystals = [];
  const group    = new THREE.Group();

  /* ── Crystal geometry factory ── */
  function makeCrystal(scale, color, emissiveColor) {
    const geo = new THREE.CylinderGeometry(0, scale * 0.5, scale, 6, 1);
    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive:          new THREE.Color(emissiveColor),
      emissiveIntensity: 0.5,
      roughness:         0.15,
      metalness:         0.9,
      transparent:       true,
      opacity:           0.88,
    });
    return new THREE.Mesh(geo, mat);
  }

  // Position crystals in a radial cluster
  const baseColor     = 0x1A2040;
  const emissiveColor = 0xD85A30;

  for (let i = 0; i < SKILL_COUNT; i++) {
    const angle  = (i / SKILL_COUNT) * Math.PI * 2 + Math.random() * 0.3;
    const radius = 1.5 + Math.random() * 2.5;
    const scale  = 0.6 + Math.random() * 1.4;
    const crystal = makeCrystal(scale, baseColor, emissiveColor);
    crystal.position.set(
      Math.cos(angle) * radius,
      (Math.random() - 0.5) * 1.5,
      Math.sin(angle) * radius,
    );
    crystal.rotation.x = (Math.random() - 0.5) * 0.5;
    crystal.rotation.z = (Math.random() - 0.5) * 0.5;
    crystal.userData   = { baseEmissive: 0.5, index: i };
    crystals.push(crystal);
    group.add(crystal);
  }

  // Central large crystal
  const centerCrystal = makeCrystal(2.2, 0x1D2550, 0xD85A30);
  centerCrystal.position.y = 0;
  group.add(centerCrystal);

  scene.add(group);

  /* ── Lighting ── */
  scene.add(new THREE.AmbientLight(0x060C1A, 2));
  const amberLight = new THREE.PointLight(0xD85A30, 3, 18);
  amberLight.position.set(0, 6, 0);
  scene.add(amberLight);
  const fillLight = new THREE.PointLight(0x7F77DD, 1.5, 15);
  fillLight.position.set(-6, -2, 4);
  scene.add(fillLight);

  /* ── Ground glow plane ── */
  const groundGeo = new THREE.CircleGeometry(6, 32);
  const groundMat = new THREE.MeshBasicMaterial({
    color:       0x180C05,
    transparent: true,
    opacity:     0.6,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.5;
  scene.add(ground);

  /* ── Public method: highlight a crystal by index ── */
  function highlightCrystal(idx) {
    crystals.forEach((c, i) => {
      c.material.emissiveIntensity = i === idx ? 2.0 : 0.5;
      c.material.emissive = new THREE.Color(
        i === idx ? 0xFFAA44 : emissiveColor
      );
    });
  }

  function resetHighlight() {
    crystals.forEach((c) => {
      c.material.emissiveIntensity = 0.5;
      c.material.emissive = new THREE.Color(emissiveColor);
    });
  }

  function update(t) {
    const time = t * 0.001;
    group.rotation.y = time * 0.12;
    amberLight.intensity = 3 + Math.sin(time * 1.2) * 0.8;
    crystals.forEach((c, i) => {
      c.position.y += Math.sin(time * 0.8 + i * 0.6) * 0.001;
    });
    centerCrystal.rotation.y = time * 0.3;
  }

  return { scene, camera, update, highlightCrystal, resetHighlight, crystals };
}
