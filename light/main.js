/* =====================================================================
   HBI Studio — main.js
   ===================================================================== */

(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ============== Smooth cinematic snap-scroll ============== */
  (() => {
    const SNAP_SELECTOR = 'section';
    const DURATION = 1100; // ms — cinematic, not jarring
    const easeInOutCubic = (t) => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;

    let animating = false;
    let lastWheelTime = 0;
    let touchStartY = 0;

    const getSnapPoints = () => {
      const els = Array.from(document.querySelectorAll(SNAP_SELECTOR));
      return els.map(el => Math.round(el.getBoundingClientRect().top + window.scrollY)).sort((a,b)=>a-b);
    };

    const animateScrollTo = (target) => {
      animating = true;
      const startY = window.scrollY;
      const distance = target - startY;
      if (Math.abs(distance) < 4) { animating = false; return; }
      const startT = performance.now();
      const tick = (t) => {
        const k = Math.min(1, (t - startT) / DURATION);
        const eased = easeInOutCubic(k);
        window.scrollTo(0, startY + distance * eased);
        if (k < 1) requestAnimationFrame(tick);
        else { animating = false; }
      };
      requestAnimationFrame(tick);
    };

    const findNext = (direction) => {
      const points = getSnapPoints();
      const y = window.scrollY;
      const vh = window.innerHeight;
      if (direction > 0) {
        // next section start that is below current viewport top by > 20px
        for (const p of points) if (p > y + 20) return p;
        // already at/past the last section: scroll to bottom (footer)
        return Math.max(...points, document.documentElement.scrollHeight - vh);
      } else {
        const reversed = [...points].reverse();
        for (const p of reversed) if (p < y - 20) return p;
        return 0;
      }
    };

    const handleWheel = (e) => {
      if (Math.abs(e.deltaY) < 8) return;
      // Allow free scrolling inside very tall sections — but at boundaries, snap
      const direction = e.deltaY > 0 ? 1 : -1;
      const target = findNext(direction);
      const dist = Math.abs(target - window.scrollY);
      // If next snap point is more than one viewport away (long section), let native scroll work
      const vh = window.innerHeight;
      const currentSec = [...document.querySelectorAll(SNAP_SELECTOR)].find(s => {
        const r = s.getBoundingClientRect();
        return r.top <= 80 && r.bottom > 80;
      });
      if (currentSec && currentSec.offsetHeight > vh + 40) {
        // Inside a tall section — only snap when near its end/start
        const r = currentSec.getBoundingClientRect();
        if (direction > 0 && r.bottom > vh + 40) return; // more content below — native scroll
        if (direction < 0 && r.top < -40) return; // more content above — native scroll
      }
      if (animating) { e.preventDefault(); return; }
      const now = Date.now();
      if (now - lastWheelTime < 200) { e.preventDefault(); return; }
      lastWheelTime = now;
      e.preventDefault();
      animateScrollTo(target);
    };

    // Cinematic wheel/touch snapping is a desktop-only affordance.
    // On touch devices and small screens it fights native momentum scroll and
    // jumps past tall sections before they can be read — so we skip it there and
    // let the browser scroll naturally. Anchor-link smooth scrolling still works.
    const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches
      || window.matchMedia('(max-width: 1024px)').matches;

    if (!isTouch) {
      // Only on devices with a real wheel
      window.addEventListener('wheel', handleWheel, { passive: false });

      window.addEventListener('touchstart', (e) => { touchStartY = e.touches[0].clientY; }, { passive: true });
      window.addEventListener('touchend', (e) => {
        if (animating) return;
        const endY = e.changedTouches[0].clientY;
        const dy = touchStartY - endY;
        if (Math.abs(dy) < 50) return;
        const target = findNext(dy > 0 ? 1 : -1);
        animateScrollTo(target);
      });
    }

    // Anchor links — smooth animate
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY;
      animateScrollTo(top);
    });

    window.__animateScrollTo = animateScrollTo;
  })();

  /* ============== Sticky nav ============== */  const header = $('#siteHeader');
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 24);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ============== Mobile menu ============== */
  const ham = $('#hamburger');
  const mob = $('#mobileMenu');
  if (ham && mob) {
    const setOpen = (open) => {
      mob.dataset.open = open ? 'true' : 'false';
      ham.setAttribute('aria-expanded', open ? 'true' : 'false');
      ham.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.style.overflow = open ? 'hidden' : '';
    };
    ham.addEventListener('click', () => setOpen(mob.dataset.open !== 'true'));
    $$('.mobile-menu a').forEach(a => a.addEventListener('click', () => setOpen(false)));
  }

  /* ============== Reveal on scroll ============== */
  const reveals = $$('.reveal');
  const revealEl = (el, animate = true) => {
    if (el.dataset.revealed) return;
    el.dataset.revealed = '1';
    const d = parseInt(el.dataset.delay || '0', 10);
    // Set inline final state directly so element is "settled"
    el.style.opacity = '1';
    el.style.transform = 'none';
    el.classList.add('is-in');
    // Use Web Animations API for the fade — survives external CSS mutations
    if (animate && el.animate) {
      try {
        el.animate(
          [{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'none' }],
          { duration: 900, delay: d, easing: 'cubic-bezier(.2,.7,.15,1)', fill: 'both' }
        );
      } catch (_) {}
    }
  };
  if ('IntersectionObserver' in window) {
    // Reveal slightly BEFORE the element enters the viewport (positive bottom
    // margin) so fast momentum scrolling on phones never catches un-revealed
    // text popping in late.
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { revealEl(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0, rootMargin: '0px 0px 20% 0px' });
    reveals.forEach(el => io.observe(el));
    // Anything already in viewport on load — reveal it right away
    requestAnimationFrame(() => {
      reveals.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) {
          revealEl(el); io.unobserve(el);
        }
      });
    });
    // Safety net: if the observer never fired for something visible (edge
    // cases), settle it WITHOUT animation and stop observing — previously this
    // blanket-revealed everything, which caused a visible "already there, then
    // re-animates" flash on mobile.
    setTimeout(() => {
      reveals.forEach(el => {
        if (el.dataset.revealed) return;
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) {
          revealEl(el, false); io.unobserve(el);
        }
      });
    }, 2500);
  } else {
    reveals.forEach(el => el.classList.add('is-in'));
  }

  /* ============== Marquee — duplicate for seamless loop ============== */
  const mq = $('#marqueeTrack');
  if (mq) {
    const items = Array.from(mq.children);
    items.forEach(n => mq.appendChild(n.cloneNode(true)));
  }

  /* ============== Before / After slider ============== */
  const stage = $('#baStage');
  const handle = $('#baHandle');
  const after = $('#baAfter');
  const baDots = $$('#baDots .ba-dot');

  if (stage && handle && after) {
    /* Both frames are shown together at every width - side by side on wide
       screens, stacked on narrow ones. The slider markup stays in place but
       is never engaged, so the reveal logic stands down everywhere. */
    stage.classList.add('is-split');
    const isSplit = () => stage.classList.contains('is-split');

    let dragging = false;
    const setPos = (pct) => {
      if (isSplit()) return;
      pct = Math.max(2, Math.min(98, pct));
      handle.style.left = pct + '%';
      after.style.width = pct + '%';
      const afterImg = after.querySelector('img');
      if (afterImg) afterImg.style.width = (100 / (pct / 100)) + '%';
    };

    /* Clear any inline sizing the reveal logic may have left behind so the
       split layout is free to size the two frames itself. */
    handle.style.left = '';
    after.style.width = '';
    const initialAfterImg = after.querySelector('img');
    if (initialAfterImg) initialAfterImg.style.width = '';

    const moveTo = (clientX) => {
      if (isSplit()) return;
      const r = stage.getBoundingClientRect();
      const pct = ((clientX - r.left) / r.width) * 100;
      setPos(pct);
    };

    handle.addEventListener('mousedown', () => { dragging = true; document.body.style.userSelect = 'none'; });
    window.addEventListener('mousemove', (e) => { if (dragging) moveTo(e.clientX); });
    window.addEventListener('mouseup', () => { dragging = false; document.body.style.userSelect = ''; });

    handle.addEventListener('touchstart', () => { dragging = true; }, { passive: true });
    window.addEventListener('touchmove', (e) => { if (dragging) moveTo(e.touches[0].clientX); }, { passive: true });
    window.addEventListener('touchend', () => { dragging = false; });

    // Click anywhere on stage to seek
    stage.addEventListener('click', (e) => {
      if (e.target.closest('.ba-handle')) return;
      moveTo(e.clientX);
    });

    /* Pairs — real client results, base paths into assets/results/ */
    /* Photographs get regenerated in place; the version keeps a returning
       browser from showing last week's crop. Bump it whenever they change. */
    const IMG_V = '20260912-1';
    const baSrcset = (base) => [700, 1000, 1400].map(w => `${base}-${w}.webp?v=${IMG_V} ${w}w`).join(', ');
    const pairs = [
      { before: 'assets/results/ba-01-before', after: 'assets/results/ba-01-after' },
      { before: 'assets/results/ba-02-before', after: 'assets/results/ba-02-after' },
      { before: 'assets/results/ba-03-before', after: 'assets/results/ba-03-after' },
      { before: 'assets/results/ba-04-before', after: 'assets/results/ba-04-after' },
      { before: 'assets/results/ba-05-before', after: 'assets/results/ba-05-after' },
      { before: 'assets/results/ba-06-before', after: 'assets/results/ba-06-after' },
      { before: 'assets/results/ba-07-before', after: 'assets/results/ba-07-after' }
    ];

    /* Warm the cache so a switch crossfades instead of flashing an empty stage */
    const warm = (base) => { const i = new Image(); i.srcset = baSrcset(base); i.src = base + '-1400.webp?v=' + IMG_V; };
    const warmPair = (idx) => { const p = pairs[idx]; if (p) { warm(p.before); warm(p.after); } };

    let current = 0;
    const showPair = (idx, focusDot) => {
      const p = pairs[idx];
      if (!p || idx === current) return;
      current = idx;

      baDots.forEach((b, i) => {
        const on = i === idx;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
        b.tabIndex = on ? 0 : -1;
      });
      if (focusDot && baDots[idx]) baDots[idx].focus();

      const beforeImg = $('#baBeforeImg');
      const afterImg = $('#baAfterImg');
      stage.dataset.pair = idx;
      stage.style.transition = 'opacity .4s';
      stage.style.opacity = '0';
      setTimeout(() => {
        if (beforeImg) { beforeImg.srcset = baSrcset(p.before); beforeImg.src = p.before + '-1400.webp?v=' + IMG_V; }
        if (afterImg) { afterImg.srcset = baSrcset(p.after); afterImg.src = p.after + '-1400.webp?v=' + IMG_V; }
        stage.style.opacity = '1';
        setPos(50);
        /* Neighbours are the likeliest next click */
        warmPair((idx + 1) % pairs.length);
        warmPair((idx - 1 + pairs.length) % pairs.length);
      }, 220);
    };

    baDots.forEach((d, i) => {
      d.addEventListener('click', () => showPair(i));
      d.addEventListener('mouseenter', () => warmPair(i));
    });

    /* Arrow keys step through the set; Home/End jump to the ends */
    const baDotsWrap = $('#baDots');
    if (baDotsWrap) {
      baDotsWrap.addEventListener('keydown', (e) => {
        const last = pairs.length - 1;
        let next = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = current === last ? 0 : current + 1;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = current === 0 ? last : current - 1;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = last;
        if (next === null) return;
        e.preventDefault();
        showPair(next, true);
      });
    }

    warmPair(1);
  }

  /* ============== Reviews rail nav ============== */
  (() => {
    const rail = $('#reviewsRail');
    const prev = $('#revPrev');
    const next = $('#revNext');
    if (!rail || !prev || !next) return;
    const step = () => {
      const card = rail.querySelector('.review-card');
      return card ? card.offsetWidth + 20 : 340;
    };
    prev.addEventListener('click', () => rail.scrollBy({ left: -step(), behavior: 'smooth' }));
    next.addEventListener('click', () => rail.scrollBy({ left: step(), behavior: 'smooth' }));
  })();

  /* ============== Gallery rail nav ============== */
  const rail = $('#galleryRail');
  const prev = $('#galPrev');
  const next = $('#galNext');
  const scrollBy = () => {
    if (!rail) return 0;
    const tile = rail.querySelector('.gallery-tile');
    return tile ? tile.offsetWidth + 14 : 300;
  };
  if (rail && prev) prev.addEventListener('click', () => rail.scrollBy({ left: -scrollBy() * 2, behavior: 'smooth' }));
  if (rail && next) next.addEventListener('click', () => rail.scrollBy({ left: scrollBy() * 2, behavior: 'smooth' }));

  /* Hover-to-scroll: on a real pointer, drift the rail when the cursor nears an edge */
  if (rail && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const EDGE = 0.20, MAX = 12;
    let targetVel = 0, vel = 0, pos = 0, raf = null;
    const loop = () => {
      vel += (targetVel - vel) * 0.14;            // ease velocity in/out
      if (targetVel === 0 && Math.abs(vel) < 0.06) {
        vel = 0; rail.classList.remove('is-drifting'); raf = null; return;
      }
      pos = Math.max(0, Math.min(pos + vel, rail.scrollWidth - rail.clientWidth));
      rail.scrollLeft = pos;
      raf = requestAnimationFrame(loop);
    };
    rail.addEventListener('mousemove', (e) => {
      const r = rail.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      if (x < EDGE) targetVel = -((EDGE - x) / EDGE) * MAX;
      else if (x > 1 - EDGE) targetVel = ((x - (1 - EDGE)) / EDGE) * MAX;
      else targetVel = 0;
      if (targetVel !== 0 || vel !== 0) {
        rail.classList.add('is-drifting');
        if (!raf) { pos = rail.scrollLeft; raf = requestAnimationFrame(loop); }
      }
    });
    rail.addEventListener('mouseleave', () => { targetVel = 0; });
  }

  /* Lightbox: click a tile to view the image full-screen, arrow through the set */
  (function () {
    const lb = $('#lightbox');
    if (!rail || !lb) return;
    const lbImg = $('#lbImg'), lbCap = $('#lbCap');
    const lbClose = $('#lbClose');
    const tiles = $$('.gallery-tile', rail);
    let idx = 0, lastFocus = null;
    const hiRes = (src) => src ? src.replace(/-(?:400|700|1000)\.webp(\?[^#]*)?$/, '-1400.webp$1') : src;

    function show(i) {
      idx = (i + tiles.length) % tiles.length;
      const t = tiles[idx];
      const img = t.querySelector('img');
      const tag = t.querySelector('.tag');
      lbImg.src = hiRes(img && (img.currentSrc || img.src));
      lbImg.alt = (tag && tag.textContent.trim()) || t.getAttribute('aria-label') || '';
      lbCap.textContent = (tag && tag.textContent.trim()) || '';
    }
    function open(i) {
      lastFocus = document.activeElement;
      show(i);
      lb.classList.add('is-open');
      lb.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      lbClose.focus();
    }
    function close() {
      lb.classList.remove('is-open');
      lb.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    }
    tiles.forEach((t, i) => {
      t.addEventListener('click', (e) => { e.preventDefault(); open(i); });
    });
    lbClose.addEventListener('click', close);
    // Click the left / right half of the photo to step through the set
    lbImg.addEventListener('click', (e) => {
      const r = lbImg.getBoundingClientRect();
      if ((e.clientX - r.left) < r.width / 2) show(idx - 1);
      else show(idx + 1);
    });
    lbImg.addEventListener('mousemove', (e) => {
      const r = lbImg.getBoundingClientRect();
      lbImg.classList.toggle('lb-left', (e.clientX - r.left) < r.width / 2);
    });
    lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
    document.addEventListener('keydown', (e) => {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(idx - 1);
      else if (e.key === 'ArrowRight') show(idx + 1);
    });
  })();

  /* ============== Score animation ============== */
  const score = $('#scoreNum');
  if (score && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const target = 5.0;
        let v = 0;
        const start = performance.now();
        const dur = 1200;
        const tick = (t) => {
          const k = Math.min(1, (t - start) / dur);
          const eased = 1 - Math.pow(1 - k, 3);
          v = target * eased;
          score.textContent = v.toFixed(1);
          if (k < 1) requestAnimationFrame(tick);
          else score.textContent = target.toFixed(1);
        };
        requestAnimationFrame(tick);
        io.unobserve(score);
      });
    }, { threshold: 0.5 });
    io.observe(score);
  }

  /* ============== Contact form ============== */
  const form = $('#contactForm');
  const msg = $('#formMsg');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (form.website.value) return; // honeypot
      const name = form.name.value.trim();
      const phone = form.phone.value.trim();
      if (!name) {
        msg.textContent = 'Please add your name.';
        msg.style.color = '#AB824C';
        return;
      }
      if (!phone) {
        msg.textContent = 'Please add your phone number so we can reach you.';
        msg.style.color = '#AB824C';
        return;
      }
      if (!/^[+()\d\s\-.]{7,}$/.test(phone)) {
        msg.textContent = 'That phone number doesn\u2019t look right.';
        msg.style.color = '#AB824C';
        return;
      }
      const message = form.message.value.trim();
      const service = (form.service && form.service.value.trim()) || '';

      // Send the enquiry to Telegram
      const TG_TOKEN = '8589819476:AAHLPpvbJIiav4KCS7c-qkSf1Zs8H2utSBY';
      const TG_CHAT_IDS = ['164306473', '686514608'];
      const esc = (s) => String(s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
      const text =
        '💇 <b>New enquiry — HBI Studio</b>\n\n' +
        '<b>Name:</b> ' + esc(name) + '\n' +
        '<b>Phone:</b> ' + esc(phone) + '\n' +
        '<b>Service:</b> ' + (service ? esc(service) : '—') + '\n' +
        '<b>Hair goals:</b> ' + (message ? esc(message) : '—');

      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      msg.textContent = 'Sending…';
      msg.style.color = '#C9A36A';

      Promise.all(TG_CHAT_IDS.map((id) =>
        fetch('https://api.telegram.org/bot' + TG_TOKEN + '/sendMessage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: id, text: text, parse_mode: 'HTML' })
        }).then((r) => r.json())
      ))
        .then((results) => {
          if (results.some((r) => r && r.ok)) {
            msg.textContent = 'Thank you \u2014 we\u2019ll be in touch within one business day.';
            msg.style.color = '#C9A36A';
            form.reset();
            if (window.setServiceValue) window.setServiceValue('');
          } else {
            throw new Error('Telegram rejected the message');
          }
        })
        .catch(() => {
          msg.textContent = 'Something went wrong sending your message. Please call or text (737) 288-5377.';
          msg.style.color = '#AB824C';
        })
        .finally(() => {
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }

  /* ============== Year ============== */
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ============================================================
     TWEAKS
     ============================================================ */
  const defaults = window.TWEAK_DEFAULTS || {};
  let state = { ...defaults };

  const fab = $('#tweaksFab');
  const panel = $('#tweaksPanel');
  const closeBtn = $('#tweaksClose');

  const persist = (edits) => {
    try {
      window.parent.postMessage({ type: '__edit_mode_set_keys', edits }, '*');
    } catch (_) { /* ok */ }
  };

  const applyHero = (variant) => {
    document.body.dataset.hero = variant;
    $$('.tweak-segmented[data-tweak="hero"] button').forEach(b => {
      b.classList.toggle('active', b.dataset.value === variant);
    });
    state.hero = variant;
  };

  const BG_PRESETS = {
    ivory: { ink: '#F6F1E8', ink2: '#F1EBDF', panel: '#EEE7D9', card: '#FCFAF4', warm: '#E6DAC5' },
    paper: { ink: '#FBF9F5', ink2: '#F6F3EC', panel: '#F2EEE5', card: '#FFFFFF', warm: '#EAE3D5' },
    sand:  { ink: '#EFE7DA', ink2: '#EAE1D2', panel: '#E5DBC9', card: '#F8F4EB', warm: '#DBCCB1' }
  };
  const applyBg = (k) => {
    const p = BG_PRESETS[k] || BG_PRESETS.ivory;
    const r = document.documentElement.style;
    r.setProperty('--ink', p.ink);
    r.setProperty('--ink-2', p.ink2);
    r.setProperty('--panel', p.panel);
    r.setProperty('--card', p.card);
    r.setProperty('--warm', p.warm);
    document.querySelector(`.tweak-segmented[data-tweak="bg"] button[data-value="${k}"]`)?.classList.add('active');
    $$('.tweak-segmented[data-tweak="bg"] button').forEach(b => {
      b.classList.toggle('active', b.dataset.value === k);
    });
    state.bg = k;
  };

  const applyAccent = (idx) => {
    const buttons = $$('.tweak-swatches[data-tweak="accent"] .tweak-swatch');
    const btn = buttons[idx] || buttons[0];
    if (!btn) return;
    buttons.forEach(b => b.classList.toggle('active', b === btn));
    const r = document.documentElement.style;
    r.setProperty('--gold', btn.dataset.gold);
    r.setProperty('--gold-deep', btn.dataset.deep);
    r.setProperty('--cream', btn.dataset.cream);
    state.accent = idx;
  };

  const LOGOS = { bronze: 'assets/logo-bronze.svg', ink: 'assets/logo-ink.svg' };
  const applyLogo = (k) => {
    const src = LOGOS[k] || LOGOS.bronze;
    ['#brandLogo', '#footerLogo'].forEach(sel => { const el = $(sel); if (el) el.setAttribute('src', src); });
    $$('.tweak-segmented[data-tweak="logo"] button').forEach(b => {
      b.classList.toggle('active', b.dataset.value === k);
    });
    state.logo = k;
  };

  const applyGrain = (on) => {
    document.body.dataset.grain = on ? 'on' : 'off';
    const t = $('#grainToggle');
    if (t) t.dataset.on = on ? 'true' : 'false';
    state.grain = on;
  };

  const applyMarquee = (on) => {
    document.body.dataset.marquee = on ? 'on' : 'off';
    const t = $('#marqueeToggle');
    if (t) t.dataset.on = on ? 'true' : 'false';
    state.marquee = on;
  };

  // Wire UI
  $$('.tweak-segmented[data-tweak="hero"] button').forEach(b => {
    b.addEventListener('click', () => { applyHero(b.dataset.value); persist({ hero: b.dataset.value }); });
  });
  $$('.tweak-segmented[data-tweak="bg"] button').forEach(b => {
    b.addEventListener('click', () => { applyBg(b.dataset.value); persist({ bg: b.dataset.value }); });
  });
  $$('.tweak-segmented[data-tweak="logo"] button').forEach(b => {
    b.addEventListener('click', () => { applyLogo(b.dataset.value); persist({ logo: b.dataset.value }); });
  });
  $$('.tweak-swatches[data-tweak="accent"] .tweak-swatch').forEach((b, i) => {
    b.addEventListener('click', () => { applyAccent(i); persist({ accent: i }); });
  });
  $('#grainToggle')?.addEventListener('click', () => {
    const on = $('#grainToggle').dataset.on !== 'true';
    applyGrain(on); persist({ grain: on });
  });
  $('#marqueeToggle')?.addEventListener('click', () => {
    const on = $('#marqueeToggle').dataset.on !== 'true';
    applyMarquee(on); persist({ marquee: on });
  });

  // Apply initial state from defaults
  applyHero(defaults.hero || 'split');
  applyBg(defaults.bg || 'ivory');
  applyLogo(defaults.logo || 'bronze');
  applyAccent(typeof defaults.accent === 'number' ? defaults.accent : 0);
  applyGrain(defaults.grain !== false);
  applyMarquee(defaults.marquee !== false);

  // Host-driven edit-mode toggle
  const openPanel = (open) => {
    panel.classList.toggle('open', open);
    fab.classList.toggle('show', open);
  };
  window.addEventListener('message', (e) => {
    if (!e.data || !e.data.type) return;
    if (e.data.type === '__activate_edit_mode') openPanel(true);
    if (e.data.type === '__deactivate_edit_mode') openPanel(false);
  });
  try {
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
  } catch (_) {}

  fab?.addEventListener('click', () => panel.classList.toggle('open'));
  closeBtn?.addEventListener('click', () => {
    panel.classList.remove('open');
    fab.classList.remove('show');
    try { window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*'); } catch (_) {}
  });

})();
