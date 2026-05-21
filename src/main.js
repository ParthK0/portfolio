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
  buildProjects,
  buildSkills,
  buildExperience,
  buildLeetcode,
  buildPersonal,
  animateLeetBars,
} from './dom.js';
import {
  initReveal,
  initNavScroll,
  initScrollSpy,
  initScrollHint,
  registerViewports,
} from './scroll.js';

/* ══════════════════════════════════════════
   BOOT
═══════════════════════════════════════════ */
async function boot() {
  /* ── Three.js engine ── */
  const canvas  = document.getElementById('gl-canvas');
  const manager = new ThreeManager(canvas);

  /* ── Register three-viewport elements ── */
  registerViewports(manager);

  /* ── Fetch all JSON ── */
  const [projects, skills, experience, leetcode, personal] = await Promise.all([
    fetch('/data/projects.json').then(r => r.json()),
    fetch('/data/skills.json').then(r => r.json()),
    fetch('/data/experience.json').then(r => r.json()),
    fetch('/data/leetcode.json').then(r => r.json()),
    fetch('/data/personal.json').then(r => r.json()),
  ]);

  /* ── Build DOM from data ── */
  buildProjects(projects);
  buildSkills(skills);
  buildExperience(experience);
  buildLeetcode(leetcode);
  buildPersonal(personal);
  animateLeetBars();

  /* ── Scroll reveals ── */
  initReveal();
  initNavScroll();
  initScrollSpy();
  initScrollHint();

  /* ── Typed title animation ── */
  initTypingAnimation(['Full-Stack Engineer.', '3D Web Developer.', 'Worldbuilder.', 'CS Student.']);

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
   SKILLS → CRYSTAL INTERACTION
═══════════════════════════════════════════ */
function initSkillsInteraction(manager) {
  const skillsSection = document.getElementById('skills');
  if (!skillsSection) return;

  skillsSection.addEventListener('mouseover', (e) => {
    const pill = e.target.closest('.skill-pill');
    if (!pill) return;
    const idx = parseInt(pill.dataset.index, 10);
    const scene = manager.getScene('skills');
    scene?.highlightCrystal?.(idx);
    pill.classList.add('highlighted');
  });

  skillsSection.addEventListener('mouseout', (e) => {
    const pill = e.target.closest('.skill-pill');
    if (!pill) return;
    const scene = manager.getScene('skills');
    scene?.resetHighlight?.();
    pill.classList.remove('highlighted');
  });
}

/* ── Go ── */
boot();
