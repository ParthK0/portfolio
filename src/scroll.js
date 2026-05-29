/**
 * scroll.js (Phase 2)
 * IntersectionObserver-based reveal, nav scroll-spy, scroll hint, and DSA bar animation.
 *
 * KEY CONCEPT: IntersectionObserver
 * The browser watches elements using an "observer". When an element enters the
 * visible screen area (intersects the viewport), the callback fires.
 * This is how we trigger animations without any scroll event math.
 */

/* ══════════════════════════════════════════
   REVEAL ON SCROLL
   Watches every element with .reveal-up / .reveal-left / .reveal-right.
   When the element is 12% visible, adds .is-visible which triggers the
   CSS transition defined in animations.css (opacity + translateY/X).
══════════════════════════════════════════ */
export function initReveal() {
  // querySelectorAll = find ALL matching elements, returns a NodeList
  const revealEls = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');

  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {           // Element is visible in the viewport
        e.target.classList.add('is-visible'); // Triggers CSS animation
        obs.unobserve(e.target);        // Stop watching — animate only once
      }
    });
  }, { threshold: 0.12 }); // Fire when 12% of the element is visible

  revealEls.forEach(el => obs.observe(el)); // Tell the observer to watch each element
}

/* ══════════════════════════════════════════
   NAV BACKGROUND ON SCROLL
   Adds .scrolled to the nav when you scroll past 60px.
   CSS then applies backdrop-filter: blur(12px).
══════════════════════════════════════════ */
export function initNavScroll() {
  const nav = document.getElementById('main-nav');
  if (!nav) return;

  const onScroll = () => {
    // classList.toggle(class, condition) = add if condition true, remove if false
    nav.classList.toggle('scrolled', window.scrollY > 60);
  };

  // { passive: true } = tell browser this listener won't call preventDefault()
  // This allows the browser to scroll smoothly without waiting for JS
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // Run immediately in case page is already scrolled
}

/* ══════════════════════════════════════════
   SCROLL SPY — Active Nav Link
   Watches each section. When a section is 40% visible, it highlights
   the corresponding nav link by adding the .active class.
══════════════════════════════════════════ */
export function initScrollSpy() {
  const sections = ['about', 'projects', 'skills', 'experience', 'leetcode', 'personal'];
  // Map each section id to its nav link element (e.g. id="nav-about")
  const links    = sections.map(id => document.getElementById(`nav-${id}`));

  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        // Remove .active from ALL links first
        links.forEach(l => l?.classList.remove('active'));
        // Add .active only to the link that matches the visible section
        const link = document.getElementById(`nav-${e.target.id}`);
        link?.classList.add('active');
      }
    });
  }, { threshold: 0.4 }); // Section must be 40% visible to trigger

  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) obs.observe(el);
  });
}

/* ══════════════════════════════════════════
   SCROLL HINT FADE OUT
   Fades the "scroll down" arrow as soon as the user starts scrolling.
══════════════════════════════════════════ */
export function initScrollHint() {
  const hint = document.getElementById('scroll-hint');
  if (!hint) return;

  const onScroll = () => {
    // Math.max(0, ...) ensures opacity never goes below 0 (never negative)
    const opacity = Math.max(0, 1 - window.scrollY / 200);
    hint.style.opacity = opacity;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ══════════════════════════════════════════
   DSA SECTION ENTRY — Trigger Bar Animations (Phase 2)
   When the DSA/LeetCode section enters the viewport, the category bars
   animate from 0% to their real width. This creates the "loading" effect.
══════════════════════════════════════════ */
export function initDSAReveal() {
  const dsaSection = document.getElementById('leetcode');
  if (!dsaSection) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        // Find all bar elements and animate their width from 0 to target
        const bars = document.querySelectorAll('.leet-cat-bar');
        bars.forEach((bar) => {
          // The target width is stored in a data-width attribute by dom.js
          bar.style.width = bar.dataset.width || '0%';
        });
        obs.unobserve(e.target); // Animate only once
      }
    });
  }, { threshold: 0.3 }); // Trigger when 30% of DSA section is visible

  obs.observe(dsaSection);
}

/* ══════════════════════════════════════════
   REGISTER THREE.JS VIEWPORTS
   Finds every .three-viewport[data-scene] element in the HTML and
   tells the ThreeManager to set up a 3D scene for it.
   The scissor-test in manager.js uses the element's position to draw
   the correct portion of the single shared WebGL canvas.
══════════════════════════════════════════ */
export function registerViewports(manager) {
  const viewports = document.querySelectorAll('.three-viewport[data-scene]');
  viewports.forEach((el) => {
    const sceneId = el.dataset.scene; // e.g. "hero", "about", "skills"
    manager.registerScene(sceneId, el);
  });
}

