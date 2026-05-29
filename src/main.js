/**
 * main.js  (Phase 5 — Polish + Performance)
 * Entry point. Boots Three.js, fetches JSON, builds DOM, wires interactions.
 * Phase 5 adds: GSAP ScrollTrigger polish, glitch animation, mobile fallback.
 */
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/animations.css';

// GSAP: A professional-grade animation library (installed in Phase 0)
// gsap.to() / gsap.from() create tweens
// ScrollTrigger is a GSAP plugin that links animations to scroll position
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger); // Must register before using ScrollTrigger

import { ThreeManager }  from './three/manager.js';
import {
  buildHero,
  buildAbout,
  buildProjects,
  buildSkills,
  buildExperience,
  buildDSA,
  buildWorkingOn,
  buildTraits,
  buildFooter,
  animateLeetBars,
} from './dom.js';
import {
  initReveal,
  initNavScroll,
  initScrollSpy,
  initScrollHint,
  initDSAReveal,
  registerViewports,
} from './scroll.js';

/* ══════════════════════════════════════════
   BOOT
   This is the main entry point of the app. It acts like the "conductor".
   1. It initializes the Three.js manager to handle all WebGL graphics.
   2. It registers all the placeholder <div> elements where 3D scenes will be drawn.
   3. It fetches your raw data from 'portfolio.json'.
   4. It calls all the functions in dom.js to dynamically generate the HTML.
   5. It initializes scroll interactions and mobile menus.
═══════════════════════════════════════════ */
async function boot() {
  /* ── Three.js engine ── */
  const canvas  = document.getElementById('gl-canvas');
  const manager = new ThreeManager(canvas);

  /* ── Register three-viewport elements ── */
  registerViewports(manager);

  /* ── Fetch all JSON ── */
  const portfolioData = await fetch('/data/portfolio.json').then(r => r.json());

  /* ── Build DOM from data ── */
  buildHero(portfolioData.hero);
  buildAbout(portfolioData.about, portfolioData.education, portfolioData.hero);
  buildProjects(portfolioData.projects);
  buildSkills(portfolioData.skills);
  buildExperience(portfolioData.experience);
  await buildDSA(portfolioData.dsa);
  buildWorkingOn(portfolioData.workingOn);
  buildTraits(portfolioData.traits);
  buildFooter(portfolioData.footer);
  animateLeetBars();

  /* ── Scroll reveals ── */
  initReveal();
  initNavScroll();
  initScrollSpy();
  initScrollHint();
  initDSAReveal(); // Phase 2: trigger bar width animation when DSA enters viewport

  /* ── Typed title animation ── */
  initTypingAnimation(portfolioData.hero.titles || ['Developer.']);

  /* ── Mobile nav ── */
  initMobileNav();

  /* ── Footer year ── */
  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ── Skills hover → crystal highlight ── */
  initSkillsInteraction(manager);

  /* ── Phase 5: GSAP ScrollTrigger polish ── */
  initGSAPScrollPolish();

  /* ── Phase 5: Hero name glitch on load ── */
  initGlitch();
}

/* ══════════════════════════════════════════
   TYPING ANIMATION
   This function creates the classic "typing effect" seen in the Hero section.
   It works by keeping track of the current string in an array (titles),
   and recursively setting a timeout to add (or delete) one character at a time.
═══════════════════════════════════════════ */
function initTypingAnimation(titles) {
  const el    = document.getElementById('typed-title');
  if (!el) return;
  let titleIdx = 0;
  let charIdx  = 0;
  let deleting = false;

  function tick() {
    const current = titles[titleIdx];
    if (deleting) {
      charIdx--;
      el.textContent = current.slice(0, charIdx);
      if (charIdx <= 0) {
        deleting  = false;
        titleIdx  = (titleIdx + 1) % titles.length;
        setTimeout(tick, 400);
        return;
      }
      setTimeout(tick, 45);
    } else {
      charIdx++;
      el.textContent = current.slice(0, charIdx);
      if (charIdx >= current.length) {
        deleting = true;
        setTimeout(tick, 2000);
        return;
      }
      setTimeout(tick, 80);
    }
  }
  tick();
}

/* ══════════════════════════════════════════
   MOBILE NAV
   This connects the hamburger button (visible only on small screens)
   to the mobile menu dropdown. It listens for a 'click' event to
   toggle the 'open' CSS class, which smoothly slides the menu into view.
═══════════════════════════════════════════ */
function initMobileNav() {
  const btn  = document.getElementById('nav-mobile-btn');
  const menu = document.getElementById('nav-mobile-menu');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
  });

  menu.querySelectorAll('.nav-mobile-link').forEach((link) => {
    link.addEventListener('click', () => menu.classList.remove('open'));
  });
}

/* ══════════════════════════════════════════
   SKILLS → CRYSTAL INTERACTION (Phase 2)
   This function links your HTML UI to the WebGL 3D scene.
   Phase 2 wires TWO event systems:
   1. The old mouseover/mouseout (for CSS highlight styling)
   2. The new 'crystalHighlight' custom event (dispatched by dom.js pills)
      so the Three.js scene can react independently.
═══════════════════════════════════════════ */
function initSkillsInteraction(manager) {
  const skillsSection = document.getElementById('skills');
  if (!skillsSection) return;

  // 1. CSS highlight via mouseover (keeps pill 'highlighted' class)
  skillsSection.addEventListener('mouseover', (e) => {
    const pill = e.target.closest('.skill-pill');
    if (!pill) return;
    pill.classList.add('highlighted');
  });
  skillsSection.addEventListener('mouseout', (e) => {
    const pill = e.target.closest('.skill-pill');
    if (!pill) return;
    pill.classList.remove('highlighted');
  });

  // 2. Custom event from dom.js — tells Three.js which crystal to glow
  // 'crystalHighlight' bubbles up from the pill through the DOM
  skillsSection.addEventListener('crystalHighlight', (e) => {
    const { index } = e.detail; // The crystal index packed into the event
    const scene = manager.getScene('skills');
    scene?.highlightCrystal?.(index);
  });

  skillsSection.addEventListener('crystalReset', () => {
    const scene = manager.getScene('skills');
    scene?.resetHighlight?.();
  });
}

/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
   PHASE 5 \u2014 GSAP SCROLL POLISH
   Uses GSAP ScrollTrigger to animate section headings and depth meters.

   KEY CONCEPT: ScrollTrigger
   Unlike IntersectionObserver (which is all-or-nothing), ScrollTrigger
   gives you fine control: you can pin elements, scrub animations to
   the scroll position, set start/end points, and add stagger.

   gsap.from() means: animate FROM these values TO the element's current state.
   So gsap.from(el, { y: 40, opacity: 0 }) means:
     "Start the element at y+40 and opacity 0, then animate to y:0, opacity:1"
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
function initGSAPScrollPolish() {
  // Don't run on mobile \u2014 performance first
  if (document.body.classList.contains('no-three')) return;

  /* \u2500\u2500 Section headings: fade up on scroll \u2500\u2500 */
  // gsap.utils.toArray() converts a CSS selector to a real JS array
  gsap.utils.toArray('.section-heading').forEach((heading) => {
    gsap.from(heading, {
      y:       40,     // Start 40px below normal position
      opacity: 0,      // Start fully transparent
      duration: 0.8,   // Animate over 0.8 seconds
      ease: 'power2.out', // Fast start, smooth deceleration
      scrollTrigger: {
        trigger: heading,       // Watch THIS element
        start: 'top 85%',       // Fire when heading's top reaches 85% down the viewport
        toggleActions: 'play none none none', // Only play forward, never reverse
      },
    });
  });

  /* \u2500\u2500 Depth meters: animate line height from 0 to 100% \u2500\u2500 */
  gsap.utils.toArray('.depth-meter-line').forEach((line) => {
    gsap.from(line, {
      scaleY:   0,     // Start with 0 height (scaleY = vertical scale)
      opacity:  0,
      duration: 1.2,
      ease:     'power3.out',
      transformOrigin: 'top center', // Scale from the top, not the center
      scrollTrigger: {
        trigger: line,
        start:   'top 90%',
      },
    });
  });

  /* \u2500\u2500 Section labels: slide in from left \u2500\u2500 */
  gsap.utils.toArray('.section-label').forEach((label, i) => {
    gsap.from(label, {
      x:       -30,    // Start 30px to the left
      opacity: 0,
      duration: 0.6,
      delay:    i * 0.05, // Small stagger so labels don't all animate at once
      ease:    'power2.out',
      scrollTrigger: {
        trigger: label,
        start:   'top 88%',
      },
    });
  });
}

/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
   PHASE 5 \u2014 HERO NAME GLITCH (one-time on load)
   After 800ms, the hero name gets the 'glitch' CSS class which fires the
   @keyframes glitch animation defined in animations.css.
   After 600ms more (at 1400ms total), the class is removed.
   This means the glitch plays ONCE on load and never repeats.

   setTimeout(fn, ms) = "run this function after N milliseconds"
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
function initGlitch() {
  const heroName = document.querySelector('.hero-name');
  if (!heroName) return;

  // Wait 800ms for the hero reveal animation to finish first
  setTimeout(() => {
    // Adding 'glitch' triggers the @keyframes glitch in animations.css
    heroName.classList.add('glitch-once');

    // Remove 600ms later so it doesn't repeat on future interactions
    setTimeout(() => {
      heroName.classList.remove('glitch-once');
    }, 600);
  }, 800);
}

/* \u2500\u2500 Go \u2500\u2500 */
boot();
