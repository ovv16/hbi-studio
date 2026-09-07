# Architecture

Three files, no build step, no dependencies. Fonts come from Google Fonts;
placeholder photos come from Unsplash's CDN. Everything else is local.

## `index.html` (1291 lines)

```
<head>
  meta / OG / Twitter cards
  two JSON-LD blocks:  HairSalon  +  FAQPage
  Google Fonts link, style.css link
  page-scoped <style>   ← ~200 lines: custom cursor overrides, the cinematic
                           hero (.hero-cine), USP strip, FAQ. Kept inline
                           because it's hero-critical and variant-specific.
</head>
<body data-hero="…">
  #cursorRing / #cursorDot     custom cursor elements
  .skip-link                   "Skip to content"
  .grain                       film-grain overlay
  header.site-header           brand mark, nav, "Book Now", hamburger
  .mobile-menu#mobileMenu      full-screen overlay, data-open="true|false"
  main#main
    section.hero               three variants, switched by body[data-hero]:
                                 "cine"  — video + masked-hair still  (default)
                                 "bleed" — full-bleed photo, centered copy
                                 "ed"    — editorial split
    .marquee                   scrolling service words, JS-duplicated
    section#before-after       drag slider + pair dots
    section#services           free-consult band + 5 service cards
    .svc-modal-overlay#svcModal   service detail modal
    section#about              founder portrait, stats, copy
    section#gallery            horizontal rail, 7 tiles
    .lightbox#lightbox         gallery lightbox
    section#reviews            score block + 3 review cards
    section#faq                6 <details> items
    section#contact            form + studio photo + 4-column info block
  footer.site-footer
  .tweaks-fab / .tweaks-panel  live style switcher (see below)
  inline <script>              window.TWEAK_DEFAULTS = { … }
  <script src="main.js">
</body>
```

### The tweaks panel

A dev/preview affordance, not a customer feature. `window.TWEAK_DEFAULTS` is
declared in an inline script; `main.js` reads it, applies the state, and
persists changes. Three axes:

- **hero** — `cine` | `bleed` | `ed`; sets `body[data-hero]`.
- **bg** — swaps `--ink`, `--ink-2`, `--panel`, `--card`, `--warm` at runtime
  via `documentElement.style.setProperty`.
- **accent** — swaps the gold family from a swatch row.

If you ship to a real customer domain, decide deliberately whether the FAB
stays. It is currently always visible.

## `style.css` (2168 lines)

Ordered, commented sections — search for the banner comment:

| Line | Section |
|---|---|
| 1 | Token block (`:root`) + resets |
| 214 | Typography primitives (`.eyebrow`, `.italic`) |
| 245 | Buttons (`.btn`, `.btn-gold`, `.btn-ghost`) |
| 276 | Nav + mobile menu |
| 806 | Marquee |
| 846 | Before & After |
| 973 | Services |
| 1328 | Service modal |
| 1476 | About / Experience |
| 1613 | Gallery + lightbox |
| 1759 | Reviews |
| 1844 | Contact (form, info columns) |
| 2012 | Footer |
| 2073 | Tweaks panel |

Breakpoints in use: **1024px** (nav collapses, snap-scroll disabled),
**900px** (grids → 1–2 col), **540px** (single column).

## `main.js` (~600 lines)

One IIFE. Every block is independently guarded (`if (el)`), so removing any
piece of markup can't break the rest. In source order:

| Block | What it does |
|---|---|
| Smooth snap-scroll | Custom wheel/touch handler, 1100ms `easeInOutCubic`. **Disabled** on touch and ≤1024px, and skipped inside sections taller than the viewport. Also owns smooth anchor-link scrolling. |
| Sticky nav | Toggles `.is-scrolled` on `#siteHeader` past 24px. |
| Mobile menu | `data-open` + `aria-expanded`; line-mask reveal on the items. |
| Reveal on scroll | `IntersectionObserver` on `.reveal`, honors `data-delay`. Elements already in view on load are revealed immediately without animation, so nothing pops in late during fast momentum scrolling. |
| Custom cursor | Lerped ring (`0.16`) + instant dot. Gated on `(pointer: fine)`; adds `.cursor-on` to `<html>`, which is what the `cursor: none` rules key off. |
| Marquee | Clones its children once for a seamless loop. |
| Before / After | Drag handle sets `.ba-after` width and counter-scales the inner image so it doesn't squash. Pair data is the `pairs` array — **currently Unsplash URLs, replace here.** |
| Gallery rail | Arrow buttons scroll by tile width + 14px gap. On a fine pointer, also drifts when the cursor nears either edge (`EDGE = 0.20`, `MAX = 12`), and draws on-brand gold arrow cursors over the left/right thirds. |
| Lightbox | Click a tile to open; Escape / ArrowLeft / ArrowRight; staggered image transition. |
| Score counter | Counts `#scoreNum` up to 5.0 when the reviews block enters view. |
| Custom select | `#serviceTrigger` + `role="listbox"` menu. **Mouse only — no keyboard handling. See BACKLOG P1.** |
| Form submit | Validates, then POSTs to the Telegram Bot API from the browser. **Token is in the clear — see BACKLOG P0.** |
| Tweaks | Reads `window.TWEAK_DEFAULTS`, wires the panel, persists. |

## Things worth knowing before you edit

- **The custom cursor** is the reason for the `cursor: none !important` block in
  `index.html`'s inline `<style>`. Both halves must change together.
- **Snap-scroll fights normal scrolling.** It's already disabled on mobile and
  inside tall sections. If a new section behaves oddly, that's the first
  suspect.
- **Reveal is one-shot.** `data-revealed="1"` is set and the observer
  unsubscribes; elements never re-animate.
- **`build/` in the original project was a manual copy** of these files and had
  drifted out of date. In this package there is one copy only — keep it that
  way, and generate any build output rather than hand-copying.
