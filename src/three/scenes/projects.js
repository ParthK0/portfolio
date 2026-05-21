/**
 * scenes/projects.js
 * Per-card coral mini-scenes.
 * Each project card gets its own WebGL canvas with a rising coral geometry.
 */
import * as THREE from 'three';

const CORAL_SHAPES = {
  branching: branchingCoral,
  fan:       fanCoral,
  tube:      tubeCoral,
  brain:     brainCoral,
};

function branchingCoral(color) {
  const group = new THREE.Group();
  const mat = coralMat(color);

  function addBranch(parent, from, to, depth) {
    if (depth <= 0) return;
    const dir = new THREE.Vector3().subVectors(to, from);
    const len = dir.length();
    const cyl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03 * depth, 0.04 * depth, len, 5),
      mat.clone()
    );
    const mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
    cyl.position.copy(mid);
    cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    group.add(cyl);
    if (depth > 1) {
      const spread = 0.4;
      for (let b = 0; b < 2; b++) {
        const offset = new THREE.Vector3(
          (Math.random() - 0.5) * spread,
          len * 0.7,
          (Math.random() - 0.5) * spread
        );
        addBranch(null, to, to.clone().add(offset), depth - 1);
      }
    }
  }
  addBranch(null, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1.2, 0), 3);
  return group;
}

function fanCoral(color) {
  const group = new THREE.Group();
  const mat   = coralMat(color);
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI;
    const h     = 0.8 + Math.random() * 0.5;
    const blade = new THREE.Mesh(
      new THREE.PlaneGeometry(0.08, h),
      mat.clone()
    );
    blade.position.x    = Math.cos(angle) * 0.6;
    blade.position.z    = Math.sin(angle) * 0.02;
    blade.position.y    = h / 2;
    blade.rotation.y    = angle;
    group.add(blade);
  }
  return group;
}

function tubeCoral(color) {
  const group = new THREE.Group();
  const mat   = coralMat(color);
  const positions = [[-0.3, 0, 0], [0.3, 0, 0], [0, 0, -0.3], [0, 0, 0.3], [0, 0, 0]];
  positions.forEach(([x, y, z]) => {
    const h    = 0.8 + Math.random() * 0.9;
    const tube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.12, h, 8, 1, true),
      mat.clone()
    );
    tube.position.set(x, h / 2, z);
    group.add(tube);
  });
  return group;
}

function brainCoral(color) {
  const geo = new THREE.SphereGeometry(0.7, 12, 8);
  const mat = coralMat(color);
  // Deform slightly
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const n = Math.sin(pos.getX(i) * 4) * Math.sin(pos.getZ(i) * 4) * 0.1;
    pos.setY(i, pos.getY(i) + n);
  }
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, mat);
  const group = new THREE.Group();
  group.add(mesh);
  return group;
}

function coralMat(color) {
  return new THREE.MeshStandardMaterial({
    color:             new THREE.Color(color),
    emissive:          new THREE.Color(color),
    emissiveIntensity: 0.5,
    roughness:         0.6,
    metalness:         0.2,
    side:              THREE.DoubleSide,
  });
}

/**
 * Create a coral mini-scene for a project card canvas.
 */
export function createProjectCoralScene(canvas, coralType = 'branching') {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / (canvas.clientHeight || 1), 0.1, 50);
  camera.position.set(0, 1, 4.5);
  camera.lookAt(0, 0.8, 0);

  // Coral
  const factory = CORAL_SHAPES[coralType] ?? CORAL_SHAPES.branching;
  const coral   = factory(0x1D9E75);
  coral.position.y = -0.2;
  scene.add(coral);

  // Particles
  const pCount = 60;
  const pPos   = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    pPos[i * 3]     = (Math.random() - 0.5) * 4;
    pPos[i * 3 + 1] = Math.random() * 2;
    pPos[i * 3 + 2] = (Math.random() - 0.5) * 4;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({
    color: 0x1D9E75, size: 0.04, transparent: true, opacity: 0.5,
    blending: THREE.AdditiveBlending, depthWrite: false,
  })));

  // Lighting
  scene.add(new THREE.AmbientLight(0x050F1A, 2));
  const tealLight = new THREE.PointLight(0x1D9E75, 2.5, 10);
  tealLight.position.set(2, 3, 2);
  scene.add(tealLight);

  let startY = -1.5;
  let risen  = false;

  function resize() {
    const w = canvas.clientWidth || 300;
    const h = canvas.clientHeight || 180;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();

  let raf;
  function tick(t) {
    raf = requestAnimationFrame(tick);
    const time = t * 0.001;
    if (!risen) {
      coral.position.y = Math.min(coral.position.y + 0.02, -0.2);
      if (coral.position.y >= -0.2) risen = true;
    }
    coral.rotation.y = time * 0.25;
    tealLight.intensity = 2.5 + Math.sin(time * 1.5) * 0.4;
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(tick);

  // Trigger rising animation
  coral.position.y = startY;

  return { destroy: () => { cancelAnimationFrame(raf); renderer.dispose(); } };
}
