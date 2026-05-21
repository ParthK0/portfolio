/**
 * three/manager.js
 * Single-canvas scissor-test engine.
 * One WebGL context. 8 scenes. Zero context-limit issues.
 */
import * as THREE from 'three';
import { createHeroScene }       from './scenes/hero.js';
import { createAboutScene }      from './scenes/about.js';
import { createSkillsScene }     from './scenes/skills.js';
import { createExperienceScene } from './scenes/experience.js';
import { createLeetcodeScene }   from './scenes/leetcode.js';
import { createPersonalScene }   from './scenes/personal.js';
import { createFooterScene }     from './scenes/footer.js';

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
  constructor(canvas) {
    this.canvas   = canvas;
    this.scenes   = {};          // { sceneId: { scene, camera, update, el } }
    this.renderer = null;
    this.raf      = null;
    this._initRenderer();
    this._startLoop();
    window.addEventListener('resize', () => this._onResize());
  }

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas:    this.canvas,
      antialias: true,
      alpha:     true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.autoClear = false;
  }

  /**
   * Register a Three.js scene bound to a DOM element.
   * @param {string} id   — matches data-scene attribute
   * @param {Element} el  — the .three-viewport DOM element
   */
  registerScene(id, el) {
    const factory = SCENE_FACTORIES[id];
    if (!factory) return;
    const result = factory(el);
    this.scenes[id] = { ...result, el };
  }

  /** Expose a scene's internals to caller (e.g. for hover events on skills) */
  getScene(id) {
    return this.scenes[id] ?? null;
  }

  _onResize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    Object.values(this.scenes).forEach(({ camera }) => {
      if (camera.isPerspectiveCamera) {
        const rect = camera._el?.getBoundingClientRect?.() ??
                     { width: window.innerWidth, height: window.innerHeight };
        camera.aspect = rect.width / rect.height;
        camera.updateProjectionMatrix();
      }
    });
  }

  _startLoop() {
    const tick = (t) => {
      this.raf = requestAnimationFrame(tick);
      this._render(t);
    };
    this.raf = requestAnimationFrame(tick);
  }

  _render(t) {
    const renderer = this.renderer;
    renderer.clear();

    for (const [, entry] of Object.entries(this.scenes)) {
      const { scene, camera, update, el } = entry;
      if (!el) continue;

      const rect = el.getBoundingClientRect();
      // Skip if not visible in viewport
      if (rect.bottom < 0 || rect.top > window.innerHeight) continue;
      if (rect.right  < 0 || rect.left > window.innerWidth)  continue;

      // Scissor region — flip Y for WebGL
      const width  = rect.width;
      const height = rect.height;
      const left   = rect.left;
      const bottom = window.innerHeight - rect.bottom;

      renderer.setViewport(left, bottom, width, height);
      renderer.setScissor(left, bottom, width, height);
      renderer.setScissorTest(true);

      // Update camera aspect if needed
      if (camera.isPerspectiveCamera) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }

      // Run scene-specific update tick
      if (update) update(t, { rect, width, height });

      renderer.render(scene, camera);
    }
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.renderer.dispose();
  }
}
