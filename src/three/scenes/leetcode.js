/**
 * scenes/leetcode.js
 * Miniature Grid — neon bar-chart towers on a dark plane.
 * Becomes The Grid district in Atlantis (scaled 100x).
 */
import * as THREE from 'three';

const CATEGORIES = [
  { name: 'DP',         color: 0x7F77DD, count: 71  },
  { name: 'Graphs',     color: 0x1D9E75, count: 58  },
  { name: 'Trees',      color: 0xD85A30, count: 52  },
  { name: 'BinSearch',  color: 0xD4537E, count: 44  },
  { name: 'Sliding W',  color: 0x7F77DD, count: 38  },
  { name: 'Backtrack',  color: 0x1D9E75, count: 31  },
  { name: 'Heaps',      color: 0xD85A30, count: 28  },
  { name: 'Tries',      color: 0xD4537E, count: 25  },
];

export function createLeetcodeScene() {
  const scene  = new THREE.Scene();
  scene.background = new THREE.Color(0x04060F);
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 10, 14);
  camera.lookAt(0, 0, 0);

  /* ── Grid floor ── */
  const gridHelper = new THREE.GridHelper(20, 20, 0x111830, 0x0D1525);
  gridHelper.position.y = 0;
  scene.add(gridHelper);

  const floorGeo = new THREE.PlaneGeometry(22, 22);
  const floorMat = new THREE.MeshBasicMaterial({ color: 0x020408 });
  const floor    = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.01;
  scene.add(floor);

  /* ── Neon towers ── */
  const towers  = [];
  const maxCount = Math.max(...CATEGORIES.map(c => c.count));
  const spread   = 2.2;
  const cols     = 4;

  CATEGORIES.forEach((cat, i) => {
    const col   = i % cols;
    const row   = Math.floor(i / cols);
    const h     = (cat.count / maxCount) * 4.5 + 0.3;
    const x     = (col - (cols / 2 - 0.5)) * spread;
    const z     = (row - 0.5) * spread;

    const towerGeo = new THREE.BoxGeometry(0.8, h, 0.8);
    const towerMat = new THREE.MeshStandardMaterial({
      color:             cat.color,
      emissive:          new THREE.Color(cat.color),
      emissiveIntensity: 0.6,
      roughness:         0.3,
      metalness:         0.8,
      transparent:       true,
      opacity:           0.9,
    });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(x, h / 2, z);
    tower.userData = { baseH: h, cat };
    towers.push(tower);
    scene.add(tower);

    // Glow cap
    const capGeo = new THREE.BoxGeometry(0.82, 0.1, 0.82);
    const capMat = new THREE.MeshStandardMaterial({
      color:             cat.color,
      emissive:          new THREE.Color(cat.color),
      emissiveIntensity: 2.5,
    });
    const capMesh = new THREE.Mesh(capGeo, capMat);
    capMesh.position.set(x, h + 0.05, z);
    scene.add(capMesh);

    // Point light per tower
    const pl = new THREE.PointLight(cat.color, 0.8, 4);
    pl.position.set(x, h + 1, z);
    scene.add(pl);
  });

  /* ── Ambient particles ── */
  const pCount = 200;
  const pPos   = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    pPos[i * 3]     = (Math.random() - 0.5) * 20;
    pPos[i * 3 + 1] = Math.random() * 8;
    pPos[i * 3 + 2] = (Math.random() - 0.5) * 20;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({
    color:       0x7F77DD,
    size:        0.06,
    transparent: true,
    opacity:     0.5,
    blending:    THREE.AdditiveBlending,
    depthWrite:  false,
  });
  scene.add(new THREE.Points(pGeo, pMat));

  /* ── Lighting ── */
  scene.add(new THREE.AmbientLight(0x050820, 2));

  function update(t) {
    const time = t * 0.001;
    scene.rotation.y = time * 0.08;
    towers.forEach((tw, i) => {
      tw.material.emissiveIntensity = 0.6 + Math.sin(time * 1.2 + i * 0.7) * 0.25;
    });
  }

  return { scene, camera, update };
}
