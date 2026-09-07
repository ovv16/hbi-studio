# HBI Studio — Website Handoff

Everything needed to continue work on the HBI Studio website in Claude Code.

## What this is

A **finished, production-ready static website** for HBI Studio — a private
Micro K-Tip hair-extension studio in Austin, Texas. Single-page marketing site
with a booking form.

This is **not** a design mock to be reimplemented. It is working code: three
files (`index.html`, `style.css`, `main.js`) plus assets, no build step, no
dependencies, no framework. Open `site/index.html` in a browser and it runs.

**Fidelity: high.** Final colors, typography, spacing, copy and interactions.
Treat the existing CSS as the source of truth for every value — do not round
numbers to a 4/8px grid or substitute a framework's defaults.

## Read these first, in order

1. `CLAUDE.md` — brand facts and hard rules. Copy this to the repo root.
2. `ARCHITECTURE.md` — how the three files are organized, every JS module.
3. `DESIGN_TOKENS.md` — the complete token table.
4. `BACKLOG.md` — 19 audited findings, prioritized. **Start here for work.**
5. `reference/Site Audit.html` — the full audit, formatted.
6. `reference/Brand Guidelines.html` — the visual brand sheet.

## Package contents

```
design_handoff_hbi_studio_site/
├── README.md              ← you are here
├── CLAUDE.md              ← copy to repo root
├── ARCHITECTURE.md
├── DESIGN_TOKENS.md
├── BACKLOG.md             ← prioritized work queue
├── site/                  ← the deployable site, root of the web server
│   ├── index.html         (1291 lines — markup + page-scoped <style> + tweak defaults)
│   ├── style.css          (2168 lines — the Dark Couture system)
│   ├── main.js            (~600 lines — all behavior, one IIFE)
│   ├── privacy.html, terms.html, legal.css
│   ├── favicon.svg, robots.txt, sitemap.xml, .nojekyll
│   ├── assets/            (logo, hero video + WebP fallbacks, portraits)
│   └── logo/              (social-share logo, PNG + SVG)
└── reference/
    ├── Site Audit.html
    └── Brand Guidelines.html
```

## Running it

No build, no install:

```bash
cd site
python3 -m http.server 8000
# → http://localhost:8000
```

A plain server is required (not `file://`) because the hero video is fetched by
JS and the form posts cross-origin.

## Deploying

Currently GitHub Pages, served from the contents of `site/` at the repo root.
`.nojekyll` is required so files starting with `_` aren't stripped.

Custom domain: add it in **Settings → Pages**, create a `CNAME` file, then
update the hard-coded URL in **four** places — `canonical`, `og:url`,
`robots.txt`, `sitemap.xml`. All currently read
`https://ovv16.github.io/hbi-studio/`.

## Known state

- **The site is feature-complete and styled.** Nothing is half-built.
- **Three launch blockers remain** (see `BACKLOG.md` P0): an exposed API token,
  stock photos presented as real client work, and apparently-fabricated
  testimonials. Do not launch before those three are resolved.
- Gallery, before/after, bleed hero and contact photos are Unsplash
  placeholders awaiting real photography.
- The project this came from also contained older drafts
  (`index.html`, `index-nano-ktip.html`). They are **not** in this package —
  `site/index.html` here is the current version, renamed from
  `index-nano-ktip-v2.html`.
