# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# HBI Studio — website

Marketing site for HBI Studio, a private Custom K-Tip hair-extension studio in
Austin, Texas. Plain HTML/CSS/JS, no build step, no dependencies, no tests.
Live at **https://hbi-studio.com** (Cloudflare Pages, auto-deploys from `main`).

## Brand facts (always honor — never paraphrase these)

- The service is **Custom K-Tip** (keratin-bonded, strand-by-strand). Never write
  "Micro K-Tip" or "hot fusion" — both were retired from the site on 2026-09-15.
- The installation technique is called **"invisible bonds"** — NOT "hand-tied".
  Use "Invisible Bonds" as a proper service name, "invisible bonds" lowercase
  mid-sentence. **Never write "hand-tied" anywhere.**
- Instagram: **@__hair_by_inna__** → https://www.instagram.com/__hair_by_inna__/
  · TikTok: **@hbi_studio_atx**
- Phone: **(737) 288-5377** · Email: **hbistudio24@gmail.com**
- Address: **13740 N Hwy 183, Building H, Office 8, Austin, TX 78750**
  → https://maps.app.goo.gl/on6bKGeQYGcoW2rF8. Write it exactly this way
  everywhere (site, JSON-LD, directories) — it must match the Google profile.
- Hours: Mon–Fri 10–7, Sat 10–5, Sun closed (matches Google Business Profile).
- Google rating **5.0**. Review count: **verify against the live Google profile
  before changing the number** (site says 16). Do not guess.
- Owner-confirmed: "over 9 years of experience"; first salon in Kyiv; in
  Austin since 2024. Other claims (client counts, "certified/licensed",
  prices) are unverified — don't add or strengthen them.
- Don't promise "damage-free" unconditionally; the FAQ's careful wording
  (applied and maintained correctly) is the standard.
- Assistants (Yulia/Julia, Masha) exist but are not named on the site.

## Aesthetic — "Light Couture"

Production is the **light** variant: warm ivory grounds, a single **bronze**
accent (`--gold: #82602F`), bronze hairlines rather than borders, film-grain
overlay, generous negative space. Cormorant Garamond (display + italic
accents) over Inter (UI/body), both self-hosted in `light/assets/fonts/`.
Token names are inherited from the old dark theme — `--ink` is the page
*ground* and `--cream` the primary *text* colour. The owner wants the site to
read as luxury: no SEO keyword-stuffing in visible headings, no cookie banner,
no cheapening copy.

## Hard rules

- **Never hard-code a secret in `main.js`** (or anywhere under `light/`) —
  everything there is public. Telegram credentials live only in Cloudflare
  env vars.
- **Never present stock or AI imagery as real client work.**
- **Never invent a testimonial, a client count, or a years-of-experience figure.**
- Copy exact values from `style.css` — the scale is intentionally not on a 4/8 grid.
- Every colour comes from the token block at the top of `light/style.css`. No new
  hex; derive new shades in `oklch()` from an existing token and add a token.
- Voice: first person singular from the stylist ("my clients"), warm and
  restrained, no exclamation marks, **no emoji**.
- Small, targeted edits. This codebase is hand-tuned; don't reformat or
  "improve" regions you weren't asked to touch.

## Layout and where things live

- `light/` — **the production site**, served as the Pages output directory.
  `archive-dark-site/` is the retired dark variant (not deployed).
  `photo do i posle/`, `фото для оброботки/`, `new light hero/` are raw source
  photos, not served. `ARCHITECTURE.md` describes the old dark build and is
  stale (tweaks panel, Unsplash, Google Fonts are all gone).
- `light/index.html` is the whole page. Besides markup it carries: two JSON-LD
  blocks (HairSalon + FAQPage — keep them in sync with visible FAQ/NAP),
  a page-scoped `<style>` for the hero, and inline scripts for the **service
  cards + modal** (the `SVC` data object, photos with `pos:[desktopY, mobileY]`),
  the **hero video loader**, the **preloader**, and the **custom service
  dropdown** (exposes `window.setServiceValue`, used by the modal CTA).
- `light/main.js` — one IIFE, sectioned by `/* ===== Name ===== */` banners:
  sectional wheel-scroll engine (desktop only), reveal-on-scroll, before/after
  slider (the `pairs` array + per-photo `--oy` crown alignment; stacked plates
  above 1199px, drag slider at ≤1199px), gallery rail + lightbox (swipe on
  touch), contact form, hover star cursor.
- Sections are `<section id="…" aria-label="…">` with a `*-wrap` inner container;
  animate-in elements get `class="reveal"` + optional `data-delay="<ms>"`;
  sibling groups use flex/grid `gap`; eyebrows are `<span class="eyebrow">`.

## Cache-busting — required on every asset change

`light/_headers` serves `style.css`/`main.js`/`legal.css` for a day and
`/assets/results/*` (before/after photos) as **immutable for a year**, so:

- Changing `style.css` / `main.js` / `legal.css` → bump its `?v=YYYYMMDD-N` in
  `index.html` (and `style.css`/`legal.css` also in `privacy.html`, `terms.html`,
  `404.html`).
- Changing any file in `assets/results/` → bump the image version everywhere:
  `?v=` in `index.html` **and** `const IMG_V` in `main.js` (main.js builds the
  srcsets for most pairs itself), then bump `main.js?v=` too.
  `grep -r <old-version> light/` must return nothing.
- Overwriting any other asset under the same name (e.g. hero video) → add or
  bump a `?v=` on its reference, or the edge keeps serving the old file.

## Contact form → Telegram

Form posts JSON to `/api/lead`, a Cloudflare Pages Function in
`functions/api/lead.js` (repo root, not inside `light/`). It validates
(honeypot `website`, service whitelist that must match the dropdown options,
phone 10–15 digits), and forwards to Telegram using env vars
`TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_IDS` (comma-separated). The browser
adds a per-lead `id` (reused on retries; printed as "Ref" — its base36 prefix
is a timestamp) and a `src` block (utm/referrer/landing/device, kept in
`sessionStorage`), printed as "Source". Client aborts after 20 s.
`functions/_middleware.js` 301s the `hbi-studio.pages.dev` alias to the domain.
A WAF rate-limit rule on `POST /api/lead` lives in the Cloudflare dashboard.

`light/_redirects` holds same-host redirects: old paths (`/contact`, `/about`,
…) and the short profile links `/ig` `/tt` `/g` `/yelp` `/fb` →
`/?utm_source=…`. www→apex is a zone Redirect Rule, not in this file.

## Running and verifying

- Local: the `hbi-studio` config in `.claude/launch.json` (`npx serve -p 3000 light`)
  via the preview tools — not a raw Bash server, not `file://`. The local
  server has no Functions, so `/api/lead` 404s locally; stub `window.fetch` to
  test form UI.
- No test suite. Verify in the preview at phone (~390px) and desktop widths.
  A hidden/minimised browser tab won't load `loading="lazy"` images — check
  `document.hidden` before trusting image-load results.
- Validate JSON-LD after editing it (parse each `application/ld+json` block
  with `node`). `node --check light/main.js` catches syntax errors.
- Deploy = push to `main`; Cloudflare builds in ~1–2 min. Confirm with
  `curl -s https://hbi-studio.com/ | grep <new ?v= string>`.
- `DEPLOYMENT.md` is the owner guide (Pages settings, env vars, domain,
  redirects, rate limiting, go-live checklist).
- Files use CRLF line endings; prefer the Edit tool or CRLF-aware scripts.

## Recipes — do these the same way every time

All photo work uses `ffmpeg`/`ffprobe` (installed). Work on copies in a temp
folder; only final files go into `light/assets/`. After any asset change, do
the cache-busting step above, verify in the preview, push, then curl the live
URL with the new `?v=`.

### Colour grade (house look for every client photo)

Lifts shadows slightly, softens contrast, cools blue, warms red so photos sit
on the ivory page:

```
-vf "eq=saturation=0.93:contrast=0.96:brightness=0.03,curves=master='0/0.045 0.5/0.545 1/1',colorbalance=rs=0.02:rm=0.015:bs=-0.02:bm=-0.015"
```

Scale with `flags=lanczos`. Never sharpen, never beautify faces/hair.

### Add a before/after pair (newest goes first)

1. Source is usually iPhone HEIC — convert to PNG first, check orientation.
   Both photos of a pair must be the same shot type (back of head, same
   framing); crop both to **1400×2488** (portrait ~9:16) keeping the whole
   head and hair length in frame.
2. Grade (above), then export 4 widths per photo:
   `ba-NN-{before,after}-{400,700,1000,1400}.webp` (400×712, 700×1244,
   1000×1777, 1400×2488), `-c:v libwebp -quality 88 -compression_level 6`.
   Quality below ~85 visibly softens hair texture — the owner noticed at q82.
3. **Crown alignment**: pick `by`/`ay` (object-position Y %, 0 = top) so the
   crown of the head sits at the same height in the before and the after
   frame. Check by switching the pair at desktop width (plates side by side).
4. Register it in three places (keep order identical, newest = index 0):
   - `main.js` `pairs` array: `{ before, after, by, ay }`;
   - `index.html` thumbnail row `.ba-dots`: a `<button class="ba-dot"
     data-pair="i" …>` with the `-400` after image and `style="--oy: ay%"`,
     `aria-label="Result i of N — <colour>, <what was done>"` — renumber all
     `data-pair` and "of N" labels;
   - `index.html` gallery `#galleryRail`: an `<a class="gallery-tile">` with
     the 400/700/1000 srcset, a short `.tag` and alt "<description> Custom
     K-Tip result". The lightbox opens the `-1400` file automatically.
   - The first pair is also hard-coded as the initial `#baAfterImg` /
     `#baBeforeImg` in `index.html` with its `--oy` values.
5. Bump image version (`?v=` + `IMG_V`) and `main.js?v=`.
6. Check at 390px and 1440px: every thumbnail loads both photos, the
   thumbnail row scrolls sideways on phones and does **not** widen the page
   (`document.documentElement.scrollWidth === innerWidth`), slider drags.

### Replace a service photo

Files: `assets/services/<key>-{480,720,1080}.webp` (portrait, 1080×1920 at
full size; narrower sources end at their real width, e.g. `-1031`), graded,
`-quality 92`. In the `SVC` object in `index.html`: `photo: { base, widths,
pos: [desktopY, mobileY], alt, v }` — `widths` must list the real file widths,
`pos` is object-position Y % for the tall desktop column and the short (220px)
phone strip separately, and bump `v` when overwriting the same name. Photos
must show real studio work; the modal hides the image until the new one has
decoded, and all six are prefetched when #services nears the viewport.

### Hero video

Three encodes of the same clip, all muted/loop/playsinline, still image
`hero-light-fallback(-800).webp` underneath:

| File | Used at | Encode |
|---|---|---|
| `hero-ad-light.{webm,mp4}` 1920×1080 | > 1024px | vp9 / h264 |
| `hero-ad-light-720.{webm,mp4}` 1280×720 | 981–1024px | vp9 / h264 |
| `hero-ad-light-mobile.{webm,mp4}` 600×800 | ≤ 980px (portrait) | see below |

Mobile clip is a 3:4 crop that **tracks the model** (she sways ~67–75% across
the 16:9 frame): measure her horizontal centroid per frame at 4 fps, smooth it,
build a piecewise-linear `crop=810:1080:'<x(t)>':0` expression, then
`scale=600:800:flags=lanczos`; h264 `-profile:v main -crf 27 -preset veryslow
-movflags +faststart -an`, vp9 `-crf 36 -b:v 0 -row-mt 1`. Target ≤ 500 KB each.
The loader (inline script in `index.html`) picks the file by width, defers the
phone download until `load`, and on slow connections (save-data, 2g/3g,
downlink < 1.5, rtt > 400, or HTML took > 2.5 s) adds `.is-lite` = still photo,
no video, no motion layers. Overwriting a clip → bump its `?v=` in the
`data-src*` attributes (videos are cached a week).

### Other assets

- Contact photo: `contact-inna-{700,1000,1400}.webp` (1400×1866), focus
  `object-position: 50% 28%` in `style.css`.
- Social preview: `assets/og/home-1200x630.jpg` (logo left, a before/after
  right, cream ground); absolute URL in `og:image`/`twitter:image`.
- Reviews: when the Google count changes, update **both** `reviewCount` in the
  HairSalon JSON-LD and "Based on N Google reviews" in the Reviews section.
  Each review card links to that exact review on Google Maps (copy the link
  from Google Maps → review → Share).

## Responsive breakpoints that matter

- ≤ 1199px — before/after becomes one frame with a drag handle (`sliderMQ`).
- ≤ 1080px or touch/reduced-motion — wheel-scroll engine off, native scroll.
- ≤ 980px — portrait hero: copy over an ivory wash, mobile video, seal moves
  to top-right at 80px, scroll cue hidden, eyebrow narrowed.
- ≤ 880px — before/after grid collapses to one column (`minmax(0,1fr)`).
- ≤ 700px — "phone": shorter preloader, service modal photo becomes a 220px strip.
- Hero pills must fit one row in the ~540px copy column: keep labels short
  (current: Invisible K-Tips · Keratin Bonds · Slavic Hair · Color Match).
  A longer label wraps and the fold clips the second row.

## Decisions already made (don't reopen without the owner)

- No Google Analytics / cookies / cookie banner. Traffic = Cloudflare Web
  Analytics (dashboard → Analytics → Web analytics → hbi-studio.com → Visits;
  counts visits, not unique people). Search = Google Search Console
  (domain property, verified by a DNS TXT record — never delete it; sitemap
  submitted). Lead source = the "Source" line in each Telegram message.
- SEO is done through the Google Business Profile, reviews and structured
  data (`areaServed`, `geo`, `hasOfferCatalog` in JSON-LD) — **not** by adding
  "Austin"/keywords to visible headings or alt text, and not by city landing
  pages. The owner rejected that as cheapening the brand.
- Social links in profiles use the short URLs (`hbi-studio.com/ig`, `/tt`,
  `/g`, `/yelp`, `/fb`); add new ones to `_redirects` the same way.
- Google review replies: from Inna, 1–2 sentences, one concrete detail from
  the review, no exclamation marks or emoji; the owner approves each text.

## Skills

Installed 2026-08-01 after a security review. Sources, commit hashes and
SkillSpector scan results: `INSTALLED-SKILLS.md`. Selection rationale:
`SKILLS-AUDIT.md`.

### Project-scoped — `.claude/skills/`

| Skill | When it applies |
|---|---|
| **`gsap-scrolltrigger`** | Anything driven by scroll — the `class="reveal"` / `data-delay` system, parallax, pinning, scrub. First choice for scroll work on this site. |
| **`gsap-core`** | Tweens and timelines not tied to scroll: easing, stagger, `matchMedia()` for responsive and `prefers-reduced-motion`. |
| **`core-web-vitals`** | LCP, INP, CLS. Directly owns backlog **P1 #7** (no `width`/`height` on any `<img>`) and **P2 #10** (hero not prioritised). Run after any hero, font or image change. |
| **`accessibility`** | WCAG 2.2. Owns backlog **P1 #5** (service dropdown has no keyboard support — blocks booking), **P1 #6** (`cursor: none` site-wide) and **P2 #16** (`--mute-2` fails AA). |

### Global — `~/.claude/skills/`

| Skill | When it applies |
|---|---|
| **`color-expert`** | Color spaces, contrast ratios, deriving shades. Required by the "derive new shades in `oklch()` from an existing token" rule above. |
| **`hallmark`** | New pages, redesign, extracting design from a screenshot or URL. **Caution: in image mode it writes `design.md` to the project root without asking.** This project already has a locked system — do not let it overwrite `DESIGN_TOKENS.md` or the token block in `style.css`. |
| **`taste-skill`** | Landing-page craft, anti-template checks. Overlaps `hallmark` almost exactly — invoke explicitly (`/hallmark` or `/taste-skill`) rather than relying on auto-trigger. |
| **`higgsfield-product-photoshoot`** | TikTok / Instagram visuals via the Higgsfield MCP. **Not** a substitute for the real client photography that backlog P0 #2 requires — generated images must never appear in before/after or gallery slots. |
| **`stop-slop`** | Copy for the site and socials. Respects the "no exclamation marks, no emoji" voice rule. |
| **`ui-ux-pro-max`** | General UI/UX. Its `data/` and `scripts/` are broken (dangling symlinks) — use `color-expert` for anything about color. |

### Skills that do not apply here

`remotion-best-practices`, `react-native-best-practices`, `playwright-cli`,
`web-scraping` — no React Native, no e2e suite, video goes through the
`remotion-superpowers` inline plugin.

## Connected MCP

Higgsfield (media generation), Metricool (social), Google Drive, Figma, Canva.
Keys live in environment variables only — never in a config file, and never in
`main.js` (see Hard rules).
