/**
 * scroll.js
 * IntersectionObserver-based reveal + nav scroll-spy.
 */

/* ── Section reveal ── */
export function initReveal() {
  const revealEls = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach(el => obs.observe(el));
}

/* ── Nav background on scroll ── */
export function initNavScroll() {
  const nav = document.getElementById('main-nav');
  if (!nav) return;
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ── Active nav link highlight (scroll-spy) ── */
export function initScrollSpy() {
  const sections = ['about', 'projects', 'skills', 'experience', 'leetcode', 'personal'];
  const links    = sections.map(id => document.getElementById(`nav-${id}`));

  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        links.forEach(l => l?.classList.remove('active'));
        const link = document.getElementById(`nav-${e.target.id}`);
        link?.classList.add('active');
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) obs.observe(el);
  });
}

/* ── Scroll hint fade out ── */
export function initScrollHint() {
  const hint = document.getElementById('scroll-hint');
  if (!hint) return;
  const onScroll = () => {
    const opacity = Math.max(0, 1 - window.scrollY / 200);
    hint.style.opacity = opacity;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ── Register Three.js viewports once DOM is ready ── */
export function registerViewports(manager) {
  const viewports = document.querySelectorAll('.three-viewport[data-scene]');
  viewports.forEach((el) => {
    const sceneId = el.dataset.scene;
    manager.registerScene(sceneId, el);
  });
}
