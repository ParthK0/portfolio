/**
 * three/manager.js  — Phase 3: Scissor Engine
 *
 * ─────────────────────────────────────────────────────────
 * THE PROBLEM THIS SOLVES
 * ─────────────────────────────────────────────────────────
 * A browser can only have ~8–16 WebGL contexts open at once.
 * If you give each section its OWN <canvas>, you'd need 8 contexts
 * and hit that limit instantly. The page would crash.
 *
 * THE SOLUTION: ONE canvas, one context, 8 virtual "windows"
 * We use WebGL's SCISSOR TEST to tell the renderer:
 *   "Only draw pixels inside this rectangle for this render call."
 * We call renderer.render() 8 times per frame, each time with a
 * different scissor rectangle that matches the section's position.
 *
 * ─────────────────────────────────────────────────────────
 * THE CRITICAL BUGS TO AVOID (from Phase 3 spec)
 * ─────────────────────────────────────────────────────────
 * BUG #1 — renderer.autoClear = false
 *   Without this, every render() call clears the canvas first.
 *   You'd only ever see the LAST scene rendered. Set it to false
 *   so scenes accumulate on the same frame.
 *
 * BUG #2 — getBoundingClientRect() INSIDE the loop, EVERY frame
 *   If you calculate positions once at startup, the scene positions
 *   become wrong the moment you scroll (sections move in the DOM).
 *   Always recalculate rect inside the animate loop so they track
 *   the live DOM position.
 * ─────────────────────────────────────────────────────────
 */
import * as THREE from 'three';

// Import the factory function from each scene file.
// A "factory" is just a function that creates and returns a thing.
import { createHeroScene }       from './scenes/hero.js';
import { createAboutScene }      from './scenes/about.js';
import { createSkillsScene }     from './scenes/skills.js';
import { createExperienceScene } from './scenes/experience.js';
import { createLeetcodeScene }   from './scenes/leetcode.js';
import { createPersonalScene }   from './scenes/personal.js';
import { createFooterScene }     from './scenes/footer.js';

/**
 * SCENE_FACTORIES
 * Maps a scene name (matching data-scene="hero") to its factory function.
 * When registerScene('hero', el) is called, it looks up createHeroScene here.
 */
const SCENE_FACTORIES = {
  hero:       createHeroScene,
  about:      createAboutScene,
  skills:     createSkillsScene,
  experience: createExperienceScene,
  leetcode:   createLeetcodeScene,
  personal:   createPersonalScene,
  footer:     createFooterScene,
};

export class ThreeManager {
  /**
   * constructor(canvas)
   * Called once from main.js: `new ThreeManager(canvas)`
   * Sets up the renderer, starts the animation loop, and listens for resize.
   *
   * @param {HTMLCanvasElement} canvas — the <canvas id="gl-canvas"> from index.html
   */
  constructor(canvas) {
    this.canvas   = canvas;

    // this.scenes stores ALL registered scenes.
    // Format: { 'hero': { scene, camera, update, el }, 'about': { ... }, ... }
    this.scenes   = {};

    this.renderer = null; // Will be set by _initRenderer()
    this.raf      = null; // requestAnimationFrame handle — lets us cancel the loop

    this._initRenderer();
    this._startLoop();

    // Listen for window resize to keep canvas and cameras in sync
    window.addEventListener('resize', () => this._onResize());
  }

  /**
   * _initRenderer()
   * Creates the THREE.WebGLRenderer — this is the engine that draws WebGL.
   *
   * Key settings:
   *   alpha: true       → transparent background (sections show through)
   *   antialias: true   → smooth edges (anti-aliasing)
   *   autoClear: false  → CRITICAL: don't wipe the canvas between renders
   */
  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas:    this.canvas,
      antialias: true,
      alpha:     true,   // Transparent canvas background
    });

    // setPixelRatio: match the device screen density (retina screens = 2x)
    // Math.min(..., 2) caps it at 2x to avoid performance issues on very high-DPI screens
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Make the canvas fill the entire viewport
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // Transparent clear colour (alpha = 0 means fully transparent)
    this.renderer.setClearColor(0x000000, 0);

    // ⚠️ CRITICAL: Without this, each scene.render() call clears the canvas.
    // That means only the LAST scene in the loop would be visible.
    this.renderer.autoClear = false;
  }

  /**
   * registerScene(id, el)
   * Called from main.js/scroll.js after the DOM is built.
   * Takes a scene name and its DOM element, creates the 3D scene, and stores it.
   *
   * @param {string}  id  — matches the data-scene attribute in HTML (e.g. "hero")
   * @param {Element} el  — the .three-viewport DOM element
   *
   * HOW IT WORKS:
   * 1. Looks up the factory function (e.g. createHeroScene) in SCENE_FACTORIES
   * 2. Calls it — this returns { scene, camera, update }
   * 3. Stores the result + the DOM element in this.scenes
   */
  registerScene(id, el) {
    const factory = SCENE_FACTORIES[id];
    if (!factory) {
      // If there's no factory for this id, just skip it silently
      return;
    }

    // factory(el) calls something like createHeroScene(el)
    // It returns an object: { scene, camera, update, ...any extras like highlightCrystal }
    const result = factory(el);

    // Store everything together — spread operator (...) merges the result with { el }
    this.scenes[id] = { ...result, el };
  }

  /**
   * getScene(id)
   * Returns the internals of a scene. Used by main.js to wire hover → 3D interactions.
   * e.g. manager.getScene('skills').highlightCrystal(3)
   *
   * The ?? null means: return null if the scene doesn't exist (never crash)
   */
  getScene(id) {
    return this.scenes[id] ?? null;
  }

  /**
   * _onResize()
   * Called whenever the browser window is resized.
   * Updates the renderer canvas size and fixes each camera's aspect ratio.
   *
   * WHY ASPECT RATIO MATTERS:
   * A PerspectiveCamera has a field of view that depends on width/height ratio.
   * If the window changes shape and you don't update the camera, everything
   * looks stretched or squished.
   */
  _onResize() {
    // Step 1: Resize the canvas to match the new window
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // Step 2: Fix each camera's aspect ratio
    Object.values(this.scenes).forEach(({ camera }) => {
      if (camera.isPerspectiveCamera) {
        // Use the full window since this canvas covers everything
        camera.aspect = window.innerWidth / window.innerHeight;
        // After changing aspect, MUST call this — it recalculates the projection matrix
        camera.updateProjectionMatrix();
      }
      // OrthographicCamera (used in footer) doesn't need aspect updates
    });
  }

  /**
   * _startLoop()
   * Kicks off the animation loop using requestAnimationFrame.
   *
   * requestAnimationFrame(callback) tells the browser:
   *   "Call this function before the next screen repaint."
   * Since we call it again inside `tick`, it loops forever at ~60fps.
   *
   * @param {number} t — milliseconds since page loaded (given by browser)
   */
  _startLoop() {
    const tick = (t) => {
      // Store the handle so we can cancel it with destroy()
      this.raf = requestAnimationFrame(tick);
      this._render(t);
    };
    this.raf = requestAnimationFrame(tick);
  }

  /**
   * _render(t)
   * The heart of the scissor engine. Called every frame (~60 times per second).
   *
   * STEP BY STEP what happens each frame:
   * 1. Clear the canvas once at the start of the frame
   * 2. For each registered scene:
   *    a. Find its DOM element and call getBoundingClientRect()
   *       (This is calculated LIVE every frame — critical for scroll tracking)
   *    b. Skip the scene if it's scrolled off screen (performance optimisation)
   *    c. Convert the DOM rect to WebGL coordinates (Y-axis is flipped in WebGL)
   *    d. Set the scissor rectangle — WebGL will only draw inside this box
   *    e. Set the viewport to the same rectangle
   *    f. Update the camera aspect ratio for this scissor size
   *    g. Call scene.update(t) — run animations for this frame
   *    h. Render the scene
   *
   * @param {number} t — milliseconds since page load
   */
  _render(t) {
    const renderer = this.renderer;

    // Step 1: Clear the whole canvas ONCE at the start.
    // (autoClear=false means render() won't clear it — we do it manually here)
    renderer.clear();

    // Step 2: Loop through every registered scene
    for (const [, entry] of Object.entries(this.scenes)) {
      const { scene, camera, update, el } = entry;
      if (!el) continue; // Safety — skip if element wasn't found

      // ⚠️ CRITICAL: Get the element's position on screen RIGHT NOW.
      // This is called every frame so the scene follows the element as you scroll.
      // If you cached this outside the loop, the scene would "drift" on scroll.
      const rect = el.getBoundingClientRect();

      // Frustum culling: skip off-screen scenes (big performance win)
      if (rect.bottom < 0 || rect.top  > window.innerHeight) continue;
      if (rect.right  < 0 || rect.left > window.innerWidth)  continue;

      const width  = rect.width;
      const height = rect.height;
      const left   = rect.left;

      // WebGL's Y-axis is FLIPPED compared to CSS/HTML.
      // In HTML:   Y=0 is at the TOP of the screen
      // In WebGL:  Y=0 is at the BOTTOM of the screen
      // So: bottom = totalHeight - rect.bottom  (flip it)
      const bottom = window.innerHeight - rect.bottom;

      // Tell WebGL: "For the next render call, only draw pixels inside this box"
      renderer.setViewport(left, bottom, width, height);
      renderer.setScissor(left, bottom, width, height);
      renderer.setScissorTest(true); // Enable the scissor test

      // Update this camera's aspect ratio to match the scissor region's shape
      if (camera.isPerspectiveCamera) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }

      // Call the scene's animation function.
      // Each scene file exports an update(t, info) function that moves its objects.
      if (update) update(t, { rect, width, height });

      // DRAW the scene into the scissor rectangle on the canvas
      renderer.render(scene, camera);
    }
  }

  /**
   * destroy()
   * Cleanly shuts down the engine. Cancels the animation loop and frees GPU memory.
   * Not called in normal use, but good practice to have.
   */
  destroy() {
    cancelAnimationFrame(this.raf);
    this.renderer.dispose();
  }
}
