/* =====================================================================
   HBI Studio — main.js
   ===================================================================== */

(() => {
  'use strict';

  /* The head marks <html class="js"> before first paint; this tells it the
     script really arrived, so it can stop its fallback timer. */
  window.__hbiJs = true;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ============== Smooth sectional scroll ============== */
  /* Desktop only, pointer + wheel, and only when the visitor has not asked
     for reduced motion. One deliberate wheel gesture moves one section; the
     stream of small events a trackpad or an inertial wheel emits during that
     gesture is treated as the same gesture, not as several. Sections taller
     than the viewport scroll natively inside; the engine only steps on from a
     tall section once its edge has been reached. Keys, anchors, forms,
     overlays and inner scroll containers are never intercepted. */
  (() => {
    const HEADER = () => {
      const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height'));
      return Number.isFinite(v) ? v : 85;
    };
    const DURATION = 1100;             // ms — unhurried; the pace the site had before
    const SETTLE_DURATION = 700;       // ms — nudging a small overshoot home
    const GESTURE_GAP = 140;           // ms of wheel silence that ends a gesture
    const COOLDOWN = 180;              // ms after a glide before the next may start
    const TRIGGER = 12;                // px of accumulated delta that counts as intent

    /* Sine in-out. Measured against the alternatives for a 900px move: it
       peaks at ~1300px/s where cubic in-out peaks at ~2450 and an ease-out
       curve kicks off at 3000+. No shove at the start, no lurch in the middle,
       and the last fifth of the time is spent settling the last tenth of the
       distance — which is what reads as expensive. */
    const ease = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const desktop = window.matchMedia('(min-width: 1081px) and (hover: hover) and (pointer: fine)');
    const engineOn = () => desktop.matches && !reduced.matches;

    const sections = () => Array.from(document.querySelectorAll('main > section[id]'));
    /* Where a section's top should land: the top of the viewport. Every
       section carries 110-140px of top padding, more than the 85px header, so
       the header floats over padding and never over content. Landing a section
       lower than that pushed its bottom 85px past the fold — which cut the
       gallery tiles and the before/after thumb strip on 100vh sections. */
    const targetFor = (sec) => Math.max(0, sec.getBoundingClientRect().top + window.scrollY);
    const overlayOpen = () =>
      document.body.style.overflow === 'hidden' ||
      document.documentElement.style.overflow === 'hidden';

    /* --- the glide --- */
    let raf = null;
    let animating = false;
    let lockedUntil = 0;
    /* The reveal code listens: while the page glides it holds new blocks
       back, and lets them rise once the page has come to rest. */
    const root = document.documentElement;
    const settled = () => { root.classList.remove('is-gliding'); window.dispatchEvent(new CustomEvent('hbi:glide-end')); };
    const cancel = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
      if (animating) { animating = false; settled(); }
    };
    const glideTo = (target, duration = DURATION) => {
      cancel();
      const startY = window.scrollY;
      const distance = target - startY;
      if (Math.abs(distance) < 2) return;
      if (reduced.matches) { window.scrollTo(0, target); return; }
      animating = true;
      root.classList.add('is-gliding');
      let landing = false;
      const startT = performance.now();
      const tick = (t) => {
        const k = Math.min(1, (t - startT) / duration);
        window.scrollTo(0, startY + distance * ease(k));
        /* Past 55% the sine curve is into its deceleration with a third of the
           distance still to run: release the held blocks now, so they rise
           with the page as it settles and are home by the time it stops. */
        if (!landing && k >= 0.55) { landing = true; window.dispatchEvent(new CustomEvent('hbi:glide-landing')); }
        if (k < 1) { raf = requestAnimationFrame(tick); }
        else { raf = null; animating = false; lockedUntil = performance.now() + COOLDOWN; settled(); }
      };
      raf = requestAnimationFrame(tick);
    };

    /* --- where we are --- */
    const currentSection = () => {
      const probe = 1;
      const list = sections();
      for (const s of list) {
        const r = s.getBoundingClientRect();
        if (r.top <= probe && r.bottom > probe) return s;
      }
      /* Outside every section (the footer): the page is native there. */
      return null;
    };
    /* "Tall" means taller than the viewport, with a little slack for bottom
       padding, so a 100vh section stays a single glide. */
    const isTall = (sec) => sec.offsetHeight > window.innerHeight + 24;
    /* For a tall section: may we leave it in this direction yet? */
    const atEdge = (sec, dir) => {
      const r = sec.getBoundingClientRect();
      return dir > 0 ? r.bottom <= window.innerHeight + 2
                     : r.top >= -2;
    };
    /* Is the wheel over something that scrolls on its own and still can? */
    const innerScrollable = (el, dir) => {
      for (let n = el; n && n !== document.body && n !== document.documentElement; n = n.parentElement) {
        const cs = getComputedStyle(n);
        if (/(auto|scroll)/.test(cs.overflowY) && n.scrollHeight > n.clientHeight + 1) {
          if (dir > 0 && n.scrollTop + n.clientHeight < n.scrollHeight - 1) return true;
          if (dir < 0 && n.scrollTop > 0) return true;
        }
      }
      return false;
    };

    /* --- wheel: gestures, not events --- */
    let acc = 0, lastWheel = 0, gestureSpent = false, settleTimer = null;
    const onWheel = (e) => {
      if (!engineOn() || overlayOpen()) return;
      const dir = e.deltaY > 0 ? 1 : e.deltaY < 0 ? -1 : 0;
      if (!dir) return;
      if (innerScrollable(e.target, dir)) return;

      const cur = currentSection();
      if (!cur) return;
      const tall = isTall(cur);
      /* Inside a tall section, away from its edge: native scroll, untouched. */
      if (tall && !atEdge(cur, dir)) { scheduleSettle(); return; }

      /* Nothing further in this direction: the last section gives way to the
         footer natively, and the first one lets the browser bounce at the top. */
      const list = sections();
      const idx = list.indexOf(cur);
      const next = list[idx + dir];
      if (!next) { scheduleSettle(); return; }

      /* From here on the page is ours: a glide is running, cooling down, or
         about to start. Native scroll would fight it or drift off the section. */
      e.preventDefault();

      const now = performance.now();
      const dm = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
      if (now - lastWheel > GESTURE_GAP) { acc = 0; gestureSpent = false; }
      lastWheel = now;
      acc += e.deltaY * dm;

      if (animating || now < lockedUntil || gestureSpent) return;
      if (Math.abs(acc) < TRIGGER) return;

      gestureSpent = true;              // this gesture has had its one move
      glideTo(targetFor(next));
    };

    /* --- settling a small overshoot ---
       Native scrolling out of a tall section can leave a sliver of it above
       the next section's top. Once the wheel goes quiet, if a section's top is
       just below the header, ease it into place. Interiors are never touched:
       the rule only fires when a section top sits between the header and a
       third of the viewport below it. */
    const scheduleSettle = () => {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        if (!engineOn() || overlayOpen() || animating) return;
        const limit = window.innerHeight * 0.34;
        for (const s of sections()) {
          const top = s.getBoundingClientRect().top;
          if (top > 2 && top <= limit) { glideTo(targetFor(s), SETTLE_DURATION); return; }
        }
      }, 200);
    };

    /* --- a new explicit action ends a glide cleanly --- */
    const NAV_KEYS = new Set(['PageUp','PageDown','Home','End','ArrowUp','ArrowDown',' ','Spacebar','Tab']);
    window.addEventListener('keydown', (e) => {
      if (animating && NAV_KEYS.has(e.key)) cancel();   // never preventDefault: keys stay native
    }, { passive: true });
    window.addEventListener('mousedown', () => { if (animating) cancel(); }, { passive: true });
    window.addEventListener('touchstart', () => { if (animating) cancel(); }, { passive: true });

    window.addEventListener('wheel', onWheel, { passive: false });

    /* --- anchors: glide on desktop, native smooth elsewhere, instant if reduced --- */
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      if (engineOn()) {
        const sec = target.closest('main > section[id]') || target;
        const y = sec === target ? targetFor(target) : target.getBoundingClientRect().top + window.scrollY - HEADER();
        glideTo(y);
      } else {
        target.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'start' });
      }
    });
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
    /* 1100ms with the stagger capped at 220ms: the rise overlaps the end of
       the glide rather than following it. Under reduced motion the element is
       already visible via CSS. */
    if (animate && el.animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      try {
        /* A rise, not a fade: 56px of travel, and the block is fully opaque
           by 50% of the way so most of the movement is seen in the open. */
        el.animate(
          [
            { opacity: 0, transform: 'translateY(56px)' },
            { opacity: 1, transform: 'translateY(26px)', offset: 0.5 },
            { opacity: 1, transform: 'none' }
          ],
          { duration: 1100, delay: Math.min(d, 220), easing: 'cubic-bezier(.16,.6,.1,1)', fill: 'both' }
        );
      } catch (_) {}
    }
  };
  if ('IntersectionObserver' in window) {
    // Reveal slightly BEFORE the element enters the viewport (positive bottom
    // margin) so fast momentum scrolling on phones never catches un-revealed
    // text popping in late.
    /* During a sectional glide the observer would fire while the page is
       still moving, and the blocks would be fully in by the time it lands —
       no arrival at all. So while the page glides, newly intersecting blocks
       are held and released as the glide enters its final stretch, so they
       rise while the page settles instead of after it. */
    const held = new Set();
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        if (document.documentElement.classList.contains('is-gliding')) held.add(e.target);
        else revealEl(e.target);
      });
    }, { threshold: 0, rootMargin: '0px 0px 20% 0px' });
    reveals.forEach(el => io.observe(el));
    const release = () => {
      if (!held.size) return;
      const batch = [...held]; held.clear();
      batch.forEach(el => revealEl(el));
    };
    window.addEventListener('hbi:glide-landing', release);   // the page is settling
    window.addEventListener('hbi:glide-end', release);       // cancelled or already home
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
    const IMG_V = '20260912-2';
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

    const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const EASE = 'cubic-bezier(.2,.7,.15,1)';
    let swapping = 0;
    function place(i) {
      idx = (i + tiles.length) % tiles.length;
      const t = tiles[idx];
      const img = t.querySelector('img');
      const tag = t.querySelector('.tag');
      lbImg.src = hiRes(img && (img.currentSrc || img.src));
      lbImg.alt = (tag && tag.textContent.trim()) || t.getAttribute('aria-label') || '';
      lbCap.textContent = (tag && tag.textContent.trim()) || '';
    }
    /* Stepping through the set: the current photo slips out the way it is
       being pushed, the next one settles in from the other side once it has
       decoded, so there is never a blank frame. Opening and reduced motion
       swap instantly. */
    function show(i, dir) {
      if (!dir || !lb.classList.contains('is-open') || reduced() || !lbImg.animate) { place(i); return; }
      const token = ++swapping;
      const out = lbImg.animate(
        [{ opacity: 1, transform: 'translateX(0)' }, { opacity: 0, transform: 'translateX(' + (-22 * dir) + 'px)' }],
        { duration: 200, easing: 'ease-in', fill: 'forwards' });
      out.finished.then(() => {
        if (token !== swapping) return;
        place(i);
        const ready = lbImg.decode ? lbImg.decode().catch(() => {}) : Promise.resolve();
        return ready.then(() => {
          if (token !== swapping) return;
          out.cancel();
          lbImg.animate(
            [{ opacity: 0, transform: 'translateX(' + (26 * dir) + 'px) scale(.985)' }, { opacity: 1, transform: 'none' }],
            { duration: 460, easing: EASE });
        });
      });
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
      if ((e.clientX - r.left) < r.width / 2) show(idx - 1, -1);
      else show(idx + 1, 1);
    });
    lbImg.addEventListener('mousemove', (e) => {
      const r = lbImg.getBoundingClientRect();
      lbImg.classList.toggle('lb-left', (e.clientX - r.left) < r.width / 2);
    });
    lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
    document.addEventListener('keydown', (e) => {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(idx - 1, -1);
      else if (e.key === 'ArrowRight') show(idx + 1, 1);
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
  /* The form only asks for a consultation. The service is a hint for Inna,
     not a booking, which is why "Not sure yet" is a valid answer and the
     placeholder is not. Errors sit under their field, are tied to it with
     aria-describedby / aria-invalid, and clear as the visitor fixes them. */
  const form = $('#contactForm');
  const msg = $('#formMsg');
  if (form) {
    const msgTitle = $('#formMsgTitle');
    const msgText = $('#formMsgText');
    const serviceRoot = $('#serviceSelect');
    const serviceTrigger = $('#serviceTrigger');
    const submitBtn = form.querySelector('button[type="submit"]');
    const submitLabel = submitBtn ? submitBtn.innerHTML : '';
    let sending = false;

    /* Each rule: the control that carries aria-invalid and takes focus, the
       error slot, and a test returning the message or nothing. */
    const rules = [
      { control: form.name, slot: $('#nameError'),
        test: () => form.name.value.trim() ? '' : 'Please enter your name.' },
      { control: form.phone, slot: $('#phoneError'),
        test: () => {
          const v = form.phone.value.trim();
          if (!v) return 'Please enter your phone number so Inna can contact you.';
          /* Lenient on punctuation (spaces, brackets, dashes, dots, +1);
             strict only on there being enough digits for an area code. */
          const digits = v.replace(/\D/g, '').length;
          if (!/^[+()\d\s\-.]+$/.test(v) || digits < 10 || digits > 15) {
            return 'Please check your phone number, including the area code.';
          }
          return '';
        } },
      { control: serviceTrigger, slot: $('#serviceError'),
        test: () => (form.service && form.service.value.trim()) ? '' : 'Please choose a service, or select ‘Not sure yet’.' }
    ];

    const setError = (rule, text) => {
      const { control, slot } = rule;
      if (!control || !slot) return;
      if (text) {
        slot.textContent = text;
        slot.hidden = false;
        control.classList.add('is-invalid');
        control.setAttribute('aria-invalid', 'true');
        control.setAttribute('aria-describedby', slot.id);
      } else {
        slot.textContent = '';
        slot.hidden = true;
        control.classList.remove('is-invalid');
        control.removeAttribute('aria-invalid');
        control.removeAttribute('aria-describedby');
      }
    };
    /* Re-check a field only once it has been flagged, so typing is quiet
       until a submit has pointed something out. */
    const recheck = (rule) => { if (rule.control.classList.contains('is-invalid')) setError(rule, rule.test()); };
    form.name.addEventListener('input', () => recheck(rules[0]));
    form.phone.addEventListener('input', () => recheck(rules[1]));
    if (serviceRoot) serviceRoot.addEventListener('cc-select:change', () => recheck(rules[2]));

    const showStatus = (kind, title, text) => {
      msg.className = 'form-status is-' + kind;
      msgTitle.textContent = title;
      msgText.textContent = text;
      msg.hidden = false;
    };
    const hideStatus = () => { msg.hidden = true; msg.className = 'form-status'; };
    const setSending = (on) => {
      sending = on;
      if (!submitBtn) return;
      submitBtn.disabled = on;
      submitBtn.setAttribute('aria-busy', on ? 'true' : 'false');
      submitBtn.innerHTML = on ? 'Sending your request…' : submitLabel;
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (sending) return;
      if (form.website.value) return; // honeypot

      hideStatus();
      let firstBad = null;
      rules.forEach((rule) => {
        const err = rule.test();
        setError(rule, err);
        if (err && !firstBad) firstBad = rule.control;
      });
      if (firstBad) { firstBad.focus(); return; }

      const name = form.name.value.trim();
      const phone = form.phone.value.trim();
      const message = form.message.value.trim();
      const service = form.service.value.trim();

      // Send the enquiry to Telegram
      const TG_TOKEN = '8589819476:AAHLPpvbJIiav4KCS7c-qkSf1Zs8H2utSBY';
      const TG_CHAT_IDS = ['164306473', '686514608'];
      const esc = (s) => String(s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
      const text =
        '💇 <b>New enquiry — HBI Studio</b>\n\n' +
        '<b>Name:</b> ' + esc(name) + '\n' +
        '<b>Phone:</b> ' + esc(phone) + '\n' +
        '<b>Service:</b> ' + esc(service) + '\n' +
        '<b>Hair goals:</b> ' + (message ? esc(message) : '—');

      setSending(true);
      showStatus('pending', 'Sending your request…', 'This usually takes a moment.');

      Promise.all(TG_CHAT_IDS.map((id) =>
        fetch('https://api.telegram.org/bot' + TG_TOKEN + '/sendMessage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: id, text: text, parse_mode: 'HTML' })
        }).then((r) => r.json())
      ))
        .then((results) => {
          /* Success only on a confirmed ok from the handler. */
          if (results.some((r) => r && r.ok)) {
            showStatus('success', 'Your consultation request has been sent!',
              'Inna will contact you within one business day to arrange your consultation. Your appointment time is not confirmed yet.');
            form.reset();
            if (window.setServiceValue) window.setServiceValue('');
          } else {
            throw new Error('rejected');
          }
        })
        .catch(() => {
          /* The visitor keeps what they typed and can try again. */
          showStatus('error', 'Your request couldn’t be sent.',
            'Please try again, or tap ‘Text Us’ to contact Inna directly.');
        })
        .finally(() => setSending(false));
    });
  }

  /* ============== Hover star ============== */
  /* The seal's star fades in beside the arrow over anything clickable. The
     arrow itself stays the real cursor, so nothing lags: the star is moved
     directly on every pointermove, and only its fade is animated. Fine
     pointers only; the element is never created on touch. */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const ring = document.createElement('div');
    ring.className = 'cur-star';
    ring.setAttribute('aria-hidden', 'true');
    document.body.appendChild(ring);
    const HOT = 'a, button, summary, label, select, [role="button"], [role="tab"], .ba-dot, .svc2-card, .tweak-swatch, .faq-q';
    const COLD = '.gallery-tile, .lb-figure, input, textarea';
    window.addEventListener('pointermove', (e) => {
      ring.style.setProperty('--x', e.clientX + 'px');
      ring.style.setProperty('--y', e.clientY + 'px');
      const t = e.target instanceof Element ? e.target : null;
      const on = !!(t && t.closest(HOT) && !t.closest(COLD));
      ring.classList.toggle('is-on', on);
    }, { passive: true });
    document.addEventListener('pointerleave', () => ring.classList.remove('is-on'));
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
