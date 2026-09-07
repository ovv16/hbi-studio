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
├── light/                 ← second version: the same site on a light palette
│   └── (mirrors site/, plus assets/logo-bronze.svg and logo-ink.svg)
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

## The light variant

`light/` is a second, self-contained version of the site on a warm light
palette — cream grounds (`--ink: #F6F1E8`) with bronze as the single accent
(`--gold: #82602F`, dark enough to carry 11px eyebrow type on both grounds).
It also drops the custom cursor and adds bronze/ink logo variants.

Both versions share the same markup, components and copy; they differ only in
the token block, the scattered colour rules that follow from it, and their
before/after photography, which is graded lighter to suit the cream ground.

Run it on its own port with the `hbi-studio-light` launch config (port 3001).
Only `site/` is deployed — see below.

## Deploying


GitHub Pages, deployed by `.github/workflows/pages.yml`. The workflow uploads
the contents of `site/` as the Pages artifact so it is served at the root of the
URL rather than under `/site/`.

This needs **Settings -> Pages -> Build and deployment -> Source = GitHub
Actions**. With "Deploy from a branch" the legacy Jekyll build races the
workflow and renders `README.md` as the home page instead.

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
