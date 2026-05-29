/**
 * main.js
 * Entry point. Boots Three.js, fetches JSON, builds DOM, wires interactions.
 */
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/animations.css';

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

/* ── Go ── */
boot();
