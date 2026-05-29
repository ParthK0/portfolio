/**
 * scenes/projects.js  — Phase 4
 *
 * PER-CARD RENDERER PATTERN (different from the scissor system!)
 * ──────────────────────────────────────────────────────────────
 * The scissor system in manager.js uses ONE canvas for all 8 sections.
 * But project cards are small, numerous, and dynamically created.
 * Each card gets its OWN dedicated mini WebGL renderer attached to a
 * <canvas> element inside that specific card.
 *
 * This is fine because there are only 3 cards — well under the browser's
 * ~16 WebGL context limit. Each renderer is completely independent.
 *
 * CORAL RISE ANIMATION (Phase 4 spec)
 * ────────────────────────────────────
 * When a project card enters the viewport, the coral rises from y=-1.5 to y=-0.2
 * using a GSAP tween: ease:'power2.out', duration: 1.2 seconds.
 * GSAP is a professional animation library that gives you precise easing curves
 * that are impossible to replicate with simple Math functions.
 *
 * CORAL SHAPES — 4 variants
 * ──────────────────────────
 * branching  — recursive branch tree (for ElectIQ / featured project)
 * fan        — 12 flat blade fan (circular shape)
 * tube       — 5 hollow cylinder cluster (QuantCraft)
 * brain      — deformed sphere with sine ridges (FaceNet / personal)
 */
import * as THREE from 'three';
import gsap from 'gsap';   // Phase 4: GSAP for smooth coral rise tween

/* ── Coral shape factories ── */

/**
 * branchingCoral(color)
 * Creates a recursive tree structure using CylinderGeometry.
 * addBranch() calls itself — this is called "recursion".
 * Each call creates a cylinder, then creates 2 smaller branches at the top.
 * Recursion stops when depth reaches 0.
 */
function branchingCoral(color) {
  const group = new THREE.Group();
  const mat = coralMat(color);

  function addBranch(parent, from, to, depth) {
    if (depth <= 0) return; // Base case: stop recursing

    // Calculate the direction vector from 'from' to 'to'
    const dir = new THREE.Vector3().subVectors(to, from);
    const len = dir.length();

    // Create a cylinder segment along this direction
    const cyl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03 * depth, 0.04 * depth, len, 5),
      mat.clone()
    );

    // Position at the midpoint between from and to
    const mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
    cyl.position.copy(mid);

    // Rotate the cylinder to align with the direction vector
    // setFromUnitVectors rotates from the default "up" axis (0,1,0) to our direction
    cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    group.add(cyl);

    // Create 2 child branches, slightly spread out
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

/**
 * fanCoral(color)
 * 12 flat planes arranged in a semicircle, like a sea fan.
 * PlaneGeometry is a flat 2D plane — perfect for thin coral blades.
 */
function fanCoral(color) {
  const group = new THREE.Group();
  const mat   = coralMat(color);
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI; // Spread over 180 degrees (half circle)
    const h     = 0.8 + Math.random() * 0.5;
    const blade = new THREE.Mesh(
      new THREE.PlaneGeometry(0.08, h),
      mat.clone()
    );
    blade.position.x = Math.cos(angle) * 0.6; // Spread on X axis
    blade.position.z = Math.sin(angle) * 0.02;
    blade.position.y = h / 2;
    blade.rotation.y = angle;
    group.add(blade);
  }
  return group;
}

/**
 * tubeCoral(color)
 * 5 hollow tubes arranged in a cluster pattern.
 * CylinderGeometry with openEnded:true creates a hollow tube.
 */
function tubeCoral(color) {
  const group = new THREE.Group();
  const mat   = coralMat(color);
  const positions = [[-0.3, 0, 0], [0.3, 0, 0], [0, 0, -0.3], [0, 0, 0.3], [0, 0, 0]];
  positions.forEach(([x, y, z]) => {
    const h    = 0.8 + Math.random() * 0.9;
    const tube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.12, h, 8, 1, true), // true = openEnded
      mat.clone()
    );
    tube.position.set(x, h / 2, z);
    group.add(tube);
  });
  return group;
}

/**
 * brainCoral(color)
 * A sphere with sine-wave ridges to simulate brain coral texture.
 * We manipulate vertex positions directly using the BufferGeometry attributes.
 */
function brainCoral(color) {
  const geo = new THREE.SphereGeometry(0.7, 12, 8);
  const mat = coralMat(color);
  // Deform each vertex position using a sine pattern
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    // sin(x * 4) * sin(z * 4) creates a cross-hatched ridge pattern
    const n = Math.sin(pos.getX(i) * 4) * Math.sin(pos.getZ(i) * 4) * 0.1;
    pos.setY(i, pos.getY(i) + n);
  }
  // MUST recalculate normals after deforming vertices, or lighting breaks
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, mat);
  const group = new THREE.Group();
  group.add(mesh);
  return group;
}

/**
 * coralMat(color)
 * Shared material factory for all coral types.
 * emissiveIntensity: 0.5 means it glows slightly even without light.
 * DoubleSide: visible from both the front AND the back of each face.
 */
function coralMat(color) {
  return new THREE.MeshStandardMaterial({
    color:             new THREE.Color(color),
    emissive:          new THREE.Color(color),
    emissiveIntensity: 0.5,
    roughness:         0.6,
    metalness:         0.2,
    side:              THREE.DoubleSide, // Render both sides of each polygon
  });
}

// Map type string to factory function
const CORAL_SHAPES = {
  branching: branchingCoral,
  fan:       fanCoral,
  tube:      tubeCoral,
  brain:     brainCoral,
};

/**
 * createProjectCoralScene(canvas, coralType)
 *
 * The main export. Called from dom.js for each project card via IntersectionObserver.
 * Creates an independent mini Three.js renderer bound to the card's <canvas>.
 *
 * Phase 4 Coral Rise:
 *   - Coral starts at y = -1.5 (hidden below the card)
 *   - On creation, GSAP tweens it to y = -0.2 over 1.2s with power2.out easing
 *   - power2.out = starts fast, decelerates smoothly at the end (natural feel)
 *
 * @param {HTMLCanvasElement} canvas    — the <canvas> inside the project card
 * @param {string}            coralType — 'branching' | 'fan' | 'tube' | 'brain'
 */
export function createProjectCoralScene(canvas, coralType = 'branching') {
  // Step 1: Create a DEDICATED renderer just for this card
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0); // Transparent background

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    45,
    canvas.clientWidth / (canvas.clientHeight || 1),
    0.1,
    50
  );
  camera.position.set(0, 1, 4.5);
  camera.lookAt(0, 0.8, 0);

  // Step 2: Create the coral geometry based on the card's type
  const factory = CORAL_SHAPES[coralType] ?? CORAL_SHAPES.branching;
  const coral   = factory(0x1D9E75);
  coral.position.y = -1.5; // Start position: hidden below the card
  scene.add(coral);

  // Step 3: Ambient bioluminescent particles
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

  // Step 4: Lighting
  scene.add(new THREE.AmbientLight(0x050F1A, 2));
  const tealLight = new THREE.PointLight(0x1D9E75, 2.5, 10);
  tealLight.position.set(2, 3, 2);
  scene.add(tealLight);

  // Step 5: Match renderer size to canvas element size
  function resize() {
    const w = canvas.clientWidth  || 300;
    const h = canvas.clientHeight || 180;
    renderer.setSize(w, h, false); // false = don't set canvas CSS size (CSS handles that)
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();

  // Step 6: GSAP coral rise animation (Phase 4 spec)
  // gsap.to(object, options) tweens the object's properties over time.
  // { y: -0.2 } means: animate coral.position.y FROM -1.5 TO -0.2
  // duration: 1.2  = takes 1.2 seconds
  // ease: 'power2.out' = fast start, smooth deceleration at the end
  // delay: 0.3 = starts after 0.3 seconds (gives the card time to enter view)
  gsap.to(coral.position, {
    y:        -0.2,
    duration: 1.2,
    ease:     'power2.out',
    delay:    0.3,
  });

  // Step 7: The animation loop for this card's renderer
  let raf;
  function tick(t) {
    raf = requestAnimationFrame(tick);
    const time = t * 0.001;
    coral.rotation.y = time * 0.25;             // Slowly spin the coral
    tealLight.intensity = 2.5 + Math.sin(time * 1.5) * 0.4; // Pulse the light
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(tick);

  // Return a destroy function so dom.js can clean up WebGL memory if needed
  return {
    destroy: () => {
      cancelAnimationFrame(raf);
      renderer.dispose(); // Free GPU memory
    }
  };
}
