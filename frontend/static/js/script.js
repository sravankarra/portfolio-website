const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

if (hamburger && navMenu) {
  const setMenuOpen = (open) => {
    hamburger.classList.toggle('active', open);
    navMenu.classList.toggle('active', open);
    hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
    hamburger.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  };
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.addEventListener('click', () => setMenuOpen(!navMenu.classList.contains('active')));
  navMenu.addEventListener('click', (event) => {
    if (!event.target.closest('a')) return;
    setMenuOpen(false);
  });
  document.addEventListener('click', (event) => {
    if (!navMenu.classList.contains('active')) return;
    if (event.target.closest('.nav-menu, .hamburger')) return;
    setMenuOpen(false);
  });
}

document.addEventListener('click', (event) => {
  const anchor = event.target.closest('a[href^="#"]');
  if (!anchor) return;
  const href = anchor.getAttribute('href');
  if (!href || href === '#') return;
  const target = document.querySelector(href);
  if (!target) return;
  event.preventDefault();
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

function playSkillBars() {
  const bars = document.querySelectorAll('#skills .skill-progress');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  bars.forEach((bar, index) => {
    const level = (bar.style.getPropertyValue('--level') || '0%').trim() || '0%';
    bar.style.transition = 'none';
    bar.style.width = '0%';
    if (reduceMotion) {
      bar.style.width = level;
      return;
    }
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        bar.style.transition = `width 1.2s cubic-bezier(0.22, 0.8, 0.28, 1) ${80 + index * 85}ms`;
        bar.style.width = level;
      });
    });
  });
}

function resetSkillBars() {
  document.querySelectorAll('#skills .skill-progress').forEach((bar) => {
    bar.style.transition = 'none';
    bar.style.width = '0%';
  });
}

function initSkillCards() {
  const skillsGrid = document.querySelector('.skills-grid');
  const skillsSection = document.querySelector('#skills');
  if (!skillsGrid || !skillsSection) return;
  if (skillsGrid.dataset.observed === 'true') {
    resetSkillBars();
    window.requestAnimationFrame(() => {
      skillsGrid.classList.add('is-inview');
      playSkillBars();
    });
    return;
  }
  skillsGrid.dataset.observed = 'true';
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        skillsGrid.classList.add('is-inview');
        playSkillBars();
        return;
      }
      skillsGrid.classList.remove('is-inview');
      resetSkillBars();
    });
  }, { threshold: 0.18 });
  observer.observe(skillsSection);
}

initSkillCards();
window.initSkillCards = initSkillCards;

function navButtons() {
  return [...document.querySelectorAll('.nav-menu > a')];
}

function sizeNavOutline() {
  const menu = document.querySelector('.nav-menu');
  const svg = document.querySelector('.nav-outline');
  const rect = document.querySelector('.nav-rect');
  if (!menu || !svg || !rect || window.innerWidth <= 767) return;
  const width = menu.offsetWidth;
  const height = menu.offsetHeight;
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('width', String(width));
  svg.setAttribute('height', String(height));
  const pad = 2.5;
  rect.setAttribute('x', String(pad));
  rect.setAttribute('y', String(pad));
  rect.setAttribute('width', String(Math.max(width - pad * 2, 0)));
  rect.setAttribute('height', String(Math.max(height - pad * 2, 0)));
  rect.setAttribute('rx', String(height / 2));
  rect.setAttribute('ry', String(height / 2));
}

function highlightNav(index) {
  const rect = document.querySelector('.nav-rect');
  const svg = document.querySelector('.nav-outline');
  const buttons = navButtons();
  if (!rect || !svg || !buttons.length) return;
  if (index < 0) {
    rect.style.strokeDashoffset = '5';
    rect.style.strokeDasharray = '0 0 10 40 10 40';
    return;
  }
  const width = Number(svg.getAttribute('width')) || 400;
  const height = Number(svg.getAttribute('height')) || 60;
  const topLen = (width / (2 * (width + height))) * 100;
  const slot = topLen / buttons.length;
  const start = slot * index + 0.6;
  const len = Math.max(slot - 1.2, 3);
  rect.style.strokeDashoffset = '0';
  rect.style.strokeDasharray = `0 ${start.toFixed(2)} ${len.toFixed(2)} ${(100 - start - len).toFixed(2)}`;
}

function initNavOutline() {
  const menu = document.querySelector('.nav-menu');
  if (!menu) return;
  sizeNavOutline();
  navButtons().forEach((button, index) => {
    button.onmouseenter = () => highlightNav(index);
    button.onfocus = () => highlightNav(index);
  });
  if (menu.dataset.outlineReady === 'true') return;
  menu.dataset.outlineReady = 'true';
  menu.addEventListener('mouseleave', () => highlightNav(-1));
  window.addEventListener('resize', sizeNavOutline);
}

initNavOutline();
window.initNavOutline = initNavOutline;

function scrollBanner() {
  const layer0 = document.querySelector('.parallax-00');
  const layer2 = document.querySelector('.parallax-02');
  const giant = document.querySelector('.hero-giant');
  const cutout = document.querySelector('.hero-cutout');
  const shadow = document.querySelector('.parallax-top-shadow');
  const scene = document.querySelector('.scene-3d-layer');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const y = window.scrollY || 0;
  if (layer0) layer0.style.top = `${y / -3.5}px`;
  if (layer2) layer2.style.top = `${y / -1.8}px`;
  if (shadow) shadow.style.top = `${y / -2}px`;
  if (scene) scene.style.transform = `translateY(${y / -4.2}px)`;
  if (giant) giant.style.transform = `translate(-50%, calc(-50% + ${y / 10}px))`;
  if (cutout) {
    cutout.dataset.scrollY = String(y / -7);
    applyPhotoTransform();
  }
}

function applyPhotoTransform() {
  const cutout = document.querySelector('.hero-cutout');
  if (!cutout) return;
  const scrollY = Number(cutout.dataset.scrollY || 0);
  const tiltX = Number(cutout.dataset.tiltX || 0);
  const tiltY = Number(cutout.dataset.tiltY || 0);
  const rotateY = tiltX * 0.45;
  const rotateX = -tiltY * 0.5;
  cutout.style.transform = `translate3d(${tiltX}px, ${scrollY + tiltY}px, 90px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
}

document.addEventListener('mousemove', (event) => {
  const cutout = document.querySelector('.hero-cutout');
  if (!cutout || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.innerWidth <= 900) return;
  cutout.dataset.tiltX = String((event.clientX / window.innerWidth - 0.5) * 22);
  cutout.dataset.tiltY = String((event.clientY / window.innerHeight - 0.5) * 14);
  applyPhotoTransform();
});

document.addEventListener('scroll', scrollBanner, { passive: true });
scrollBanner();

const cursor = document.getElementById('cursor');
const cursor2 = document.getElementById('cursor2');
const cursor3 = document.getElementById('cursor3');
const canCursor = cursor && cursor2 && cursor3 && window.matchMedia('(pointer: fine)').matches && window.innerWidth > 1200;

if (canCursor) {
  document.addEventListener('mousemove', (event) => {
    cursor.style.left = `${event.clientX}px`;
    cursor.style.top = `${event.clientY}px`;
    cursor2.style.left = `${event.clientX}px`;
    cursor2.style.top = `${event.clientY}px`;
    cursor3.style.left = `${event.clientX}px`;
    cursor3.style.top = `${event.clientY}px`;
  });
  const hoverIn = () => {
    cursor2.classList.add('hover');
    cursor3.classList.add('hover');
  };
  const hoverOut = () => {
    cursor2.classList.remove('hover');
    cursor3.classList.remove('hover');
  };
  document.addEventListener('mouseover', (event) => {
    if (event.target.closest('.hover-target')) hoverIn();
  });
  document.addEventListener('mouseout', (event) => {
    if (event.target.closest('.hover-target') && !event.relatedTarget?.closest('.hover-target')) hoverOut();
  });
}

const toTop = document.querySelector('.scroll-to-top');
if (toTop) {
  window.addEventListener('scroll', () => {
    toTop.classList.toggle('active-arrow', window.scrollY > 300);
  }, { passive: true });
  toTop.addEventListener('click', (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function alignWorkSideText() {
  const mobile = window.innerWidth <= 767;
  document.querySelectorAll('.case-study-images li').forEach((item) => {
    const card = item.querySelector('.img-hero-background');
    const title = item.querySelector('.case-study-title');
    if (!card || !title) return;
    const cardBox = card.getBoundingClientRect();
    const hostBox = item.getBoundingClientRect();
    const topInset = mobile ? 18 : 28;
    const bottomInset = mobile ? 64 : 20;
    const target = Math.max(40, cardBox.height - topInset - bottomInset);
    const insetX = mobile ? 14 : 0;
    title.style.left = `${cardBox.left - hostBox.left + insetX}px`;
    title.style.top = `${cardBox.top - hostBox.top + topInset}px`;
    title.style.height = 'auto';
    title.style.letterSpacing = '0px';
    title.style.transform = mobile ? 'none' : '';
    const natural = title.getBoundingClientRect().height;
    const letters = Math.max((title.textContent || '').trim().length - 1, 1);
    if (natural > 0 && target > natural) {
      title.style.letterSpacing = `${(target - natural) / letters}px`;
    }
    title.style.height = `${target}px`;
  });
}

window.alignWorkSideText = alignWorkSideText;
window.addEventListener('resize', alignWorkSideText);
if (document.fonts?.ready) document.fonts.ready.then(alignWorkSideText);
requestAnimationFrame(alignWorkSideText);

function showCase(index) {
  const names = document.querySelectorAll('.case-study-name');
  const images = document.querySelectorAll('.case-study-images li');
  names.forEach((item, i) => item.classList.toggle('active', i === index));
  images.forEach((item, i) => item.classList.toggle('show', i === index));
  requestAnimationFrame(alignWorkSideText);
}

document.querySelector('.case-study-wrapper')?.addEventListener('mouseover', (event) => {
  const item = event.target.closest('.case-study-name');
  if (!item) return;
  const names = [...document.querySelectorAll('.case-study-name')];
  const index = names.indexOf(item);
  if (index >= 0) showCase(index);
});

document.querySelector('.case-study-wrapper')?.addEventListener('click', (event) => {
  const item = event.target.closest('.case-study-name');
  if (!item) return;
  const names = [...document.querySelectorAll('.case-study-name')];
  const index = names.indexOf(item);
  if (index < 0) return;
  if (window.innerWidth <= 767 && !item.classList.contains('active')) {
    event.preventDefault();
  }
  showCase(index);
});

if (document.querySelector('.case-study-name')) showCase(0);

const workCard = document.querySelector('.img-hero-background');
if (workCard && typeof ResizeObserver === 'function') {
  new ResizeObserver(() => alignWorkSideText()).observe(workCard);
}

function initSparks() {
  const canvas = document.querySelector('.spark-field');
  if (!canvas || document.body.classList.contains('embed-preview')) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const sparks = [];
  let width = 0;
  let height = 0;
  let frame = 0;

  function sparkCount() {
    return window.innerWidth <= 767 ? 22 : 42;
  }

  function makeSpark() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      size: 1.4 + Math.random() * 3.2,
      speedX: (Math.random() - 0.5) * 0.28,
      speedY: -0.12 - Math.random() * 0.32,
      phase: Math.random() * Math.PI * 2,
      twinkle: 0.8 + Math.random() * 1.6,
      warm: Math.random() > 0.35,
    };
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    sparks.length = 0;
    for (let i = 0; i < sparkCount(); i += 1) sparks.push(makeSpark());
  }

  function drawSpark(spark, alpha) {
    const { x, y, size } = spark;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = spark.warm ? '#c5a47e' : '#f3eadc';
    ctx.lineCap = 'round';
    ctx.lineWidth = 1.15;
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x, y + size);
    ctx.moveTo(x - size, y);
    ctx.lineTo(x + size, y);
    ctx.stroke();
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(x - size * 0.55, y - size * 0.55);
    ctx.lineTo(x + size * 0.55, y + size * 0.55);
    ctx.moveTo(x + size * 0.55, y - size * 0.55);
    ctx.lineTo(x - size * 0.55, y + size * 0.55);
    ctx.stroke();
    ctx.fillStyle = spark.warm ? 'rgba(197, 164, 126, 0.9)' : 'rgba(243, 234, 220, 0.85)';
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0.6, size * 0.18), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function tick() {
    if (document.hidden) {
      frame = window.requestAnimationFrame(tick);
      return;
    }
    ctx.clearRect(0, 0, width, height);
    sparks.forEach((spark) => {
      spark.x += spark.speedX;
      spark.y += spark.speedY;
      if (spark.y < -12) spark.y = height + 8;
      if (spark.x < -12) spark.x = width + 8;
      if (spark.x > width + 12) spark.x = -8;
      const pulse = 0.22 + Math.abs(Math.sin((performance.now() / 900) * spark.twinkle + spark.phase)) * 0.78;
      drawSpark(spark, pulse);
    });
    frame = window.requestAnimationFrame(tick);
  }

  resize();
  window.addEventListener('resize', resize);
  frame = window.requestAnimationFrame(tick);
  return () => window.cancelAnimationFrame(frame);
}

initSparks();

function initCodeStreams() {
  if (document.body.classList.contains('embed-preview')) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const snippets = [
    'const stack = { ui, api }',
    'function craft(idea) {',
    '  return idea.ship()',
    '}',
    'export default Work',
    'import React from "react"',
    '<section className="skills">',
    'async def build():',
    '    return True',
    'class Portfolio:',
    'git commit -m "ship it"',
    'npm run build',
    'map((skill) => skill.level)',
    'if (ready) deploy()',
    '{ gold: "#c5a47e" }',
    'const level = 90',
    '</> developer',
    'let live = true;',
    'fn main() {',
    'useState(null)',
    '=> <Live />',
    'from flask import Flask',
    'flex: 1 1 auto;',
    'print("hello")',
    'SELECT * FROM projects',
    'border-radius: 20px;',
    'await fetch("/api")',
    'def ship(code):',
    'return f"{idea}"',
    'module.exports = app',
  ];
  const colors = ['#c5a47e', '#f3eadc', '#a89f93', '#e4c9a3'];

  function pick() {
    return snippets[Math.floor(Math.random() * snippets.length)];
  }

  document.querySelectorAll('.code-stream').forEach((canvas) => {
    const host = canvas.parentElement;
    const ctx = canvas.getContext('2d');
    if (!host || !ctx) return;

    const columns = [];
    const pieces = [];
    let width = 0;
    let height = 0;
    let running = false;
    let frame = 0;

    function columnCount() {
      if (width <= 767) return 6;
      if (width <= 1100) return 9;
      return 14;
    }

    function pieceCount() {
      return width <= 767 ? 8 : 16;
    }

    function makeColumn(x) {
      const size = width <= 767 ? 10 : 12 + Math.random() * 3;
      const trail = 8 + Math.floor(Math.random() * 8);
      return {
        x,
        y: Math.random() * height,
        speed: 0.35 + Math.random() * 0.7,
        size,
        gap: size * 1.7,
        trail,
        lines: Array.from({ length: trail }, pick),
        color: colors[Math.floor(Math.random() * colors.length)],
      };
    }

    function makePiece() {
      return {
        text: pick(),
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: -0.12 - Math.random() * 0.28,
        size: 11 + Math.random() * 7,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.12 + Math.random() * 0.22,
        rot: (Math.random() - 0.5) * 0.12,
      };
    }

    function edgeBoost(x) {
      const mid = width / 2;
      const dist = Math.abs(x - mid) / Math.max(mid, 1);
      return 0.28 + dist * 0.72;
    }

    function resize() {
      width = host.clientWidth;
      height = host.clientHeight;
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(width * ratio));
      canvas.height = Math.max(1, Math.floor(height * ratio));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      columns.length = 0;
      pieces.length = 0;
      const count = columnCount();
      for (let i = 0; i < count; i += 1) {
        columns.push(makeColumn(((i + 0.5) / count) * width));
      }
      for (let i = 0; i < pieceCount(); i += 1) pieces.push(makePiece());
    }

    function tick() {
      if (!running) return;
      if (document.hidden) {
        frame = window.requestAnimationFrame(tick);
        return;
      }
      ctx.clearRect(0, 0, width, height);
      ctx.textBaseline = 'top';

      columns.forEach((col) => {
        col.y += col.speed;
        if (col.y - col.trail * col.gap > height) {
          col.y = -col.gap;
          col.lines = Array.from({ length: col.trail }, pick);
        }
        ctx.font = `${col.size}px "IBM Plex Mono", ui-monospace, monospace`;
        for (let i = 0; i < col.trail; i += 1) {
          const y = col.y - i * col.gap;
          if (y < -20 || y > height) continue;
          const head = i === 0;
          ctx.globalAlpha = (head ? 0.55 : 0.12 + (1 - i / col.trail) * 0.28) * edgeBoost(col.x);
          ctx.fillStyle = head ? '#f3eadc' : col.color;
          ctx.fillText(col.lines[i], col.x, y);
        }
      });

      pieces.forEach((piece) => {
        piece.x += piece.vx;
        piece.y += piece.vy;
        if (piece.y < -24) piece.y = height + 10;
        if (piece.x < -160) piece.x = width + 10;
        if (piece.x > width + 160) piece.x = -10;
        ctx.save();
        ctx.globalAlpha = piece.alpha * edgeBoost(piece.x);
        ctx.fillStyle = piece.color;
        ctx.font = `${piece.size}px "IBM Plex Mono", ui-monospace, monospace`;
        ctx.translate(piece.x, piece.y);
        ctx.rotate(piece.rot);
        ctx.fillText(piece.text, 0, 0);
        ctx.restore();
      });

      ctx.globalAlpha = 1;
      frame = window.requestAnimationFrame(tick);
    }

    resize();
    window.addEventListener('resize', resize);
    if (typeof ResizeObserver === 'function') {
      new ResizeObserver(resize).observe(host);
    }

    const section = canvas.closest('section') || host;
    new IntersectionObserver((entries) => {
      const visible = entries.some((entry) => entry.isIntersecting);
      if (visible && !running) {
        running = true;
        frame = window.requestAnimationFrame(tick);
      } else if (!visible) {
        running = false;
        window.cancelAnimationFrame(frame);
      }
    }, { threshold: 0.08 }).observe(section);
  });
}

initCodeStreams();
