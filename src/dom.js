/**
 * dom.js
 * Build all dynamic DOM sections from JSON data.
 */
import { createProjectCoralScene } from './three/scenes/projects.js';
import { createPersonalItemScene }  from './three/scenes/personal.js';

/* ── Projects ── */
export function buildProjects(projects) {
  const grid = document.getElementById('projects-grid');
  if (!grid) return;

  const instances = [];

  projects.forEach((p) => {
    const card = document.createElement('article');
    card.className = `project-card reveal-up${p.featured ? ' featured' : ''}`;
    card.id = `project-card-${p.id}`;

    const canvas = document.createElement('canvas');
    canvas.className = 'project-card-coral';
    canvas.id = `coral-canvas-${p.id}`;

    const stackHtml = p.stack
      .map(s => `<span class="tech-pill">${s}</span>`)
      .join('');

    const linksHtml = [
      p.github ? `<a href="${p.github}" target="_blank" rel="noopener" class="project-card-link" id="link-gh-${p.id}">GitHub ↗</a>` : '',
      p.live   ? `<a href="${p.live}"   target="_blank" rel="noopener" class="project-card-link live-link" id="link-live-${p.id}">Live ↗</a>` : '',
    ].filter(Boolean).join('');

    card.innerHTML = `
      ${p.featured ? '<span class="project-featured-badge">Featured</span>' : ''}
      <div class="project-card-body">
        <h3 class="project-card-title">${p.title}</h3>
        <p class="project-card-desc">${p.description}</p>
        <div class="project-card-stack">${stackHtml}</div>
        <div class="project-card-links">${linksHtml}</div>
      </div>
    `;

    // Insert canvas before body
    card.insertBefore(canvas, card.firstChild);
    grid.appendChild(card);

    // Lazy-start coral when card enters viewport
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const inst = createProjectCoralScene(canvas, p.coral || 'branching');
          instances.push(inst);
          obs.disconnect();
        }
      });
    }, { threshold: 0.1 });
    obs.observe(card);
  });

  return instances;
}

/* ── Skills ── */
export function buildSkills(skills) {
  const container = document.getElementById('skills-groups');
  if (!container) return;

  const groups = [
    { key: 'primary',   label: 'Daily drivers',   data: skills.primary   },
    { key: 'secondary', label: 'Also comfortable', data: skills.secondary },
  ];

  groups.forEach(({ key, label, data }) => {
    const div = document.createElement('div');
    div.className = 'skills-group reveal-up';
    div.innerHTML = `<div class="skills-group-label">${label}</div>
      <div class="skills-pills" id="skills-pills-${key}"></div>`;
    container.appendChild(div);

    const pillsWrap = div.querySelector(`#skills-pills-${key}`);
    data.forEach((skill, i) => {
      const pill = document.createElement('button');
      pill.className = `skill-pill`;
      pill.id        = `skill-pill-${key}-${i}`;
      pill.innerHTML = `<span class="skill-pill-icon">${skill.icon}</span>${skill.name}`;
      pill.dataset.index = i;
      pill.dataset.group = key;
      pillsWrap.appendChild(pill);
    });
  });
}

/* ── Hero ── */
export function buildHero(hero) {
  const nameFirst = document.querySelector('.hero-name-first');
  const nameLast  = document.querySelector('.hero-name-last');
  const tagline   = document.querySelector('.hero-tagline');
  
  if (nameFirst && hero.firstName) nameFirst.textContent = hero.firstName;
  if (nameLast && hero.lastName) nameLast.textContent = hero.lastName;
  if (tagline && hero.tagline) tagline.textContent = hero.tagline;

  // We expose titles to the window so main.js can use it for typing animation
  if (hero.titles) {
    window.__heroTitles = hero.titles;
  }
}

/* ── About ── */
export function buildAbout(about, education) {
  const bio1 = document.getElementById('about-bio');
  const bio2 = document.getElementById('about-bio-2');
  const badge = document.getElementById('about-status-badge');
  const college = document.getElementById('edu-college');
  const year = document.getElementById('edu-year');

  if (bio1 && about.bio && about.bio[0]) bio1.textContent = about.bio[0];
  if (bio2 && about.bio && about.bio[1]) bio2.textContent = about.bio[1];
  if (badge && about.currently) badge.innerHTML = `<span class="status-dot"></span>${about.currently}`;
  if (college && education.college) college.textContent = education.college;
  if (year && education.year) year.textContent = education.year;
}

/* ── Experience ── */
export function buildExperience(experience) {
  const timeline = document.getElementById('experience-timeline');
  if (!timeline) return;

  experience.forEach((exp) => {
    const entry = document.createElement('div');
    entry.className = 'timeline-entry reveal-up';
    entry.id = `exp-entry-${exp.id}`;

    const badgeClass = `badge-${exp.type.toLowerCase()}`;
    const bullets = exp.bullets
      .map(b => `<li class="timeline-bullet">${b}</li>`)
      .join('');

    entry.innerHTML = `
      <div class="timeline-entry-meta">
        <div class="timeline-date">${exp.start} — ${exp.end}</div>
        <span class="timeline-badge ${badgeClass}">${exp.type}</span>
      </div>
      <div class="timeline-entry-body">
        <div class="timeline-org">${exp.org}</div>
        <div class="timeline-role">${exp.role}</div>
        <ul class="timeline-bullets">${bullets}</ul>
      </div>
    `;
    timeline.appendChild(entry);
  });
}

/* ── DSA / CP (LeetCode + Codeforces) ── */
export async function buildDSA(dsaData) {
  const statsEl = document.getElementById('leet-stats');
  const catsEl  = document.getElementById('leet-categories');
  const linkEl  = document.getElementById('leet-profile-link');
  
  const cfEl = document.getElementById('cf-stats'); // Codeforces container if we add it

  let data = { ...(dsaData.leetcode || {}) };
  let calendarDataStr = "{}";

  if (data.username) {
    try {
      const [solvedRes, calRes] = await Promise.all([
        fetch(`https://alfa-leetcode-api.onrender.com/${data.username}/solved`).then(r => r.json()),
        fetch(`https://alfa-leetcode-api.onrender.com/${data.username}/calendar`).then(r => r.json())
      ]);
      
      if (!solvedRes.errors && !calRes.errors) {
        data.total = solvedRes.solvedProblem || data.total;
        data.easy = solvedRes.easySolved || data.easy;
        data.medium = solvedRes.mediumSolved || data.medium;
        data.hard = solvedRes.hardSolved || data.hard;
        
        data.streak = calRes.streak !== undefined ? calRes.streak : data.streak;
        if (calRes.submissionCalendar) {
          calendarDataStr = calRes.submissionCalendar;
        }
      }
    } catch (err) {
      console.warn("Failed to fetch live LeetCode stats, using fallback.", err);
    }
  }

  if (statsEl) {
    statsEl.innerHTML = `
      <div class="leet-stat-tile reveal-up" id="leet-tile-total">
        <div class="leet-stat-value">${data.total}</div>
        <div class="leet-stat-label">Total Solved</div>
      </div>
      <div class="leet-stat-tile reveal-up delay-1" id="leet-tile-breakdown">
        <div class="leet-stat-value" style="font-size:1.4rem; display:flex; justify-content:center; gap:12px">
          <span class="leet-stat-value easy" style="font-size:1.6rem">${data.easy}</span>
          <span class="leet-stat-value medium" style="font-size:1.6rem">${data.medium}</span>
          <span class="leet-stat-value hard" style="font-size:1.6rem">${data.hard}</span>
        </div>
        <div class="leet-stat-label">Easy · Medium · Hard</div>
      </div>
      <div class="leet-stat-tile reveal-up delay-2" id="leet-tile-streak">
        <div class="leet-stat-value" style="color:var(--clr-coral)">${data.streak}</div>
        <div class="leet-stat-label">Day Streak 🔥</div>
      </div>
    `;
  }

  if (catsEl) {
    catsEl.innerHTML = '';
    
    if (data.categories && data.categories.length > 0) {
      const maxCount = Math.max(...data.categories.map(c => c.count));
      data.categories.forEach((cat, i) => {
        const pct = (cat.count / maxCount * 100).toFixed(1);
        const row = document.createElement('div');
        row.className = 'leet-cat-row reveal-up';
        row.id        = `leet-cat-${i}`;
        row.innerHTML = `
          <span class="leet-cat-name">${cat.name}</span>
          <div class="leet-cat-bar-wrap">
            <div class="leet-cat-bar" style="width:0%; background:${cat.color}" data-width="${pct}%"></div>
          </div>
          <span class="leet-cat-count">${cat.count}</span>
        `;
        catsEl.appendChild(row);
      });
    }

    if (calendarDataStr !== "{}") {
      renderSubmissionHeatmap(catsEl, calendarDataStr);
    }
  }

  if (linkEl && data.profile) linkEl.href = data.profile;

  if (cfEl && dsaData.codeforces) {
    const cf = dsaData.codeforces;
    cfEl.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: var(--text-200);">Handle</span>
          <span style="font-weight: 600; color: #fff;">${cf.handle}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: var(--text-200);">Rating</span>
          <span style="font-weight: 600; color: #3182ce;">${cf.rating}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: var(--text-200);">Max Rating</span>
          <span style="font-weight: 600; color: #4299e1;">${cf.maxRating}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: var(--text-200);">Rank</span>
          <span style="font-weight: 600; color: #63b3ed;">${cf.rank}</span>
        </div>
        <a href="${cf.profile}" target="_blank" rel="noopener" class="btn btn-ghost leet-link reveal-up" style="margin-top: 1rem; border-color: rgba(49, 130, 206, 0.5); color: #63b3ed;">
          View Codeforces profile →
        </a>
      </div>
    `;
  }
}

function renderSubmissionHeatmap(container, calendarStr) {
  let cal = {};
  try {
    cal = JSON.parse(calendarStr);
  } catch (e) {
    return;
  }

  const dateCounts = {};
  for (const [ts, count] of Object.entries(cal)) {
    const d = new Date(parseInt(ts) * 1000);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    dateCounts[dateStr] = (dateCounts[dateStr] || 0) + count;
  }
  
  const now = new Date();
  const days = 140; // 20 weeks
  const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
  startDate.setDate(startDate.getDate() - startDate.getDay()); // Align to Sunday
  
  now.setHours(23, 59, 59, 999);
  const totalDays = Math.round((now.getTime() - startDate.getTime()) / (1000*60*60*24));
  
  const heatmapWrap = document.createElement('div');
  heatmapWrap.className = 'leet-heatmap-wrap reveal-up';
  
  const heatmapGrid = document.createElement('div');
  heatmapGrid.className = 'leet-heatmap';
  
  for (let i = 0; i < totalDays; i++) {
    const date = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
    const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    const count = dateCounts[dateStr] || 0;
    
    const cell = document.createElement('div');
    cell.className = 'heatmap-cell';
    if (count === 0) cell.dataset.level = '0';
    else if (count <= 1) cell.dataset.level = '1';
    else if (count <= 3) cell.dataset.level = '2';
    else if (count <= 5) cell.dataset.level = '3';
    else cell.dataset.level = '4';
    
    cell.title = `${count} submissions on ${date.toDateString()}`;
    heatmapGrid.appendChild(cell);
  }
  
  heatmapWrap.innerHTML = `<div class="heatmap-title" style="margin-top: 3rem; margin-bottom: 1rem; font-size: 1.1rem; color: var(--text-200); font-family: var(--font-mono);">Submission Activity (Last ${days} Days)</div>`;
  heatmapWrap.appendChild(heatmapGrid);
  container.appendChild(heatmapWrap);
}

/* ── Working On ── */
export function buildWorkingOn(items) {
  const container = document.getElementById('working-on-items');
  if (!container || !items) return;

  items.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'working-on-card reveal-up';
    card.innerHTML = `
      <div class="working-on-type">${item.type}</div>
      <h3 class="working-on-title">${item.title}</h3>
      <p class="working-on-desc">${item.description}</p>
    `;
    container.appendChild(card);
  });
}

/* ── Traits ── */
export function buildTraits(items) {
  const container = document.getElementById('personal-items');
  if (!container) return;

  items.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'personal-item reveal-up';
    card.id        = `personal-item-${item.id}`;

    const canvas = document.createElement('canvas');
    canvas.className = 'personal-item-canvas';
    canvas.id        = `personal-canvas-${item.id}`;

    card.innerHTML = `
      <div class="personal-item-label">${item.label}</div>
      <div class="personal-item-note">${item.note}</div>
      <div class="personal-popup" id="popup-${item.id}">
        <p class="personal-popup-text">${item.note}</p>
      </div>
    `;
    card.insertBefore(canvas, card.firstChild);
    container.appendChild(card);

    // Toggle popup
    card.addEventListener('click', () => card.classList.toggle('active'));

    // Lazy-start mini Three.js per card
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          createPersonalItemScene(canvas, item.object, item.color);
          obs.disconnect();
        }
      });
    }, { threshold: 0.1 });
    obs.observe(card);
  });
}

/* ── Footer ── */
export function buildFooter(footer) {
  const yearEl = document.getElementById('footer-year');
  const creatorEl = document.querySelector('.footer-copy');
  const taglineEl = document.querySelector('.footer-tagline');

  if (yearEl && footer.year) yearEl.textContent = footer.year;
  if (taglineEl && footer.closingLine) taglineEl.textContent = footer.closingLine;
  
  if (creatorEl && footer.creator) {
    creatorEl.innerHTML = `© <span id="footer-year">${footer.year}</span> ${footer.creator}. Built as a teaser for Atlantis.`;
  }
}

/* ── Animate LeetCode bars on scroll ── */
export function animateLeetBars() {
  const bars = document.querySelectorAll('.leet-cat-bar');
  const obs  = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        bars.forEach((bar) => {
          bar.style.width = bar.dataset.width;
        });
        obs.disconnect();
      }
    });
  }, { threshold: 0.3 });
  const catsEl = document.getElementById('leet-categories');
  if (catsEl) obs.observe(catsEl);
}
