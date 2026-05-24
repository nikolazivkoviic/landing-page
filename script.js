/* =================================================================
   NEBULA — script.js
   Čist, modularan vanilla JS. Svaki modul je samostalna funkcija.

   MODULI:
   01. Loader            — animacija učitavanja
   02. ScrollProgress    — traka napretka skrola
   03. Navbar            — scroll state + hamburger + zatvaranje
   04. SmoothScroll      — custom smooth scroll na anchor linkove
   05. Reveal            — Intersection Observer za ulazne animacije
   06. CountUp           — animirani brojači (Intersection Observer)
   07. Cursor            — custom kursor (samo desktop, samo pointer)
   08. Magnetic          — magnetna dugmad koja prate miša
   09. CardGlow          — glow koji prati miša po feature karticama
   10. Spotlight         — spotlight efekat na dashboard panelu
   11. Tilt              — 3D tilt na karticama
   12. Particles         — suptilan canvas particle background
================================================================= */

(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---------- 01. LOADER ---------- */
  function initLoader() {
    const loader = $('#loader');
    const bar = $('#loaderBar');
    if (!loader) return;

    let p = 0;
    const tick = setInterval(() => {
      p = Math.min(100, p + Math.random() * 18);
      if (bar) bar.style.width = p + '%';
      if (p >= 100) clearInterval(tick);
    }, 130);

    const finish = () => {
      if (bar) bar.style.width = '100%';
      setTimeout(() => {
        loader.classList.add('is-done');
        document.body.style.overflow = '';
      }, 450);
    };

    // čekamo i potpuni load i minimalno vreme da loader ne "blicne"
    document.body.style.overflow = 'hidden';
    if (document.readyState === 'complete') setTimeout(finish, 700);
    else window.addEventListener('load', () => setTimeout(finish, 600));
  }

  /* ---------- 02. SCROLL PROGRESS ---------- */
  function initScrollProgress() {
    const bar = $('#scrollProgress');
    if (!bar) return;
    const onScroll = () => {
      const h = document.documentElement;
      const scrolled = h.scrollTop / (h.scrollHeight - h.clientHeight);
      bar.style.width = (scrolled * 100) + '%';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- 03. NAVBAR ---------- */
  function initNavbar() {
    const nav = $('#nav');
    const burger = $('#burger');
    const links = $('#navLinks');

    window.addEventListener('scroll', () => {
      nav.classList.toggle('is-scrolled', window.scrollY > 40);
    }, { passive: true });

    if (burger && links) {
      const toggle = (open) => {
        burger.classList.toggle('is-open', open);
        links.classList.toggle('is-open', open);
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      };
      burger.addEventListener('click', () => toggle(!burger.classList.contains('is-open')));
      // klik na link u meniju zatvara meni
      $$('.nav__link, .nav__cta', links).forEach(a =>
        a.addEventListener('click', () => toggle(false))
      );
    }
  }

  /* ---------- 04. SMOOTH SCROLL ---------- */
  function initSmoothScroll() {
    $$('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        const id = link.getAttribute('href');
        if (id === '#' || id.length < 2) return;
        const target = $(id);
        if (!target) return;
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: prefersReduced ? 'auto' : 'smooth' });
      });
    });
  }

  /* ---------- 05. REVEAL (Intersection Observer) ---------- */
  function initReveal() {
    const items = $$('[data-reveal]');
    if (prefersReduced) { items.forEach(i => i.classList.add('is-visible')); return; }

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    items.forEach(i => io.observe(i));
  }

  /* ---------- 06. COUNT UP ---------- */
  function initCountUp() {
    const nums = $$('[data-count]');
    if (!nums.length) return;

    const animate = (el) => {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const dur = 1600;
      const start = performance.now();
      const isFloat = !Number.isInteger(target);

      const step = (now) => {
        const t = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
        const val = target * eased;
        el.textContent = (isFloat ? val.toFixed(1) : Math.floor(val).toLocaleString('sr-RS')) + suffix;
        if (t < 1) requestAnimationFrame(step);
        else el.textContent = (isFloat ? target.toFixed(1) : target.toLocaleString('sr-RS')) + suffix;
      };
      requestAnimationFrame(step);
    };

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { animate(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });

    nums.forEach(n => io.observe(n));
  }

  /* ---------- 07. CUSTOM CURSOR ---------- */
  function initCursor() {
    if (!canHover) return;
    const ring = $('#cursor');
    const dot = $('#cursorDot');
    if (!ring || !dot) return;
    document.body.classList.add('cursor-ready');

    let mx = 0, my = 0, rx = 0, ry = 0;
    window.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
    });
    // ring lagano "kasni" za prirodan osećaj
    const loop = () => {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    };
    loop();

    // ring se širi nad interaktivnim elementima
    $$('a, button, [data-magnetic], [data-tilt]').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('is-active'));
      el.addEventListener('mouseleave', () => ring.classList.remove('is-active'));
    });
  }

  /* ---------- 08. MAGNETIC BUTTONS ---------- */
  function initMagnetic() {
    if (!canHover) return;
    $$('[data-magnetic]').forEach(el => {
      const strength = 22;
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) / r.width;
        const y = (e.clientY - r.top - r.height / 2) / r.height;
        el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- 09. CARD GLOW (feature kartice) ---------- */
  function initCardGlow() {
    $$('.feature').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ---------- 10. SPOTLIGHT (dashboard) ---------- */
  function initSpotlight() {
    const dash = $('#dashboard');
    if (!dash) return;
    dash.addEventListener('mousemove', (e) => {
      const r = dash.getBoundingClientRect();
      dash.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      dash.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  }

  /* ---------- 11. TILT (3D na karticama) ---------- */
  function initTilt() {
    if (!canHover) return;
    $$('[data-tilt]').forEach(el => {
      const max = 8;
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform =
          `perspective(900px) rotateY(${px * max}deg) rotateX(${-py * max}deg) translateY(-4px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- 12. PARTICLES (canvas background) ---------- */
  function initParticles() {
    const canvas = $('#particles');
    if (!canvas || prefersReduced) return;
    const ctx = canvas.getContext('2d');
    let w, h, particles = [], raf;

    const COUNT = window.innerWidth < 680 ? 28 : 60;
    const COLORS = ['rgba(124,247,212,', 'rgba(79,140,255,', 'rgba(192,132,252,'];

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }

    function make() {
      particles = Array.from({ length: COUNT }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.8 + 0.4,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        a: Math.random() * 0.5 + 0.1,
        c: COLORS[Math.floor(Math.random() * COLORS.length)],
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      // tačkice
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.c + p.a + ')';
        ctx.fill();
      });
      // linije između bliskih tačkica
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(124,247,212,${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    }

    resize(); make(); draw();
    window.addEventListener('resize', () => { cancelAnimationFrame(raf); resize(); make(); draw(); });
  }

  /* ---------- INIT SVE ---------- */
  function init() {
    initLoader();
    initScrollProgress();
    initNavbar();
    initSmoothScroll();
    initReveal();
    initCountUp();
    initCursor();
    initMagnetic();
    initCardGlow();
    initSpotlight();
    initTilt();
    initParticles();
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', init);
  else init();
})();
