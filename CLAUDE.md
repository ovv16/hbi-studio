# HBI Studio — website

Static marketing site for HBI Studio, a private Micro K-Tip hair-extension
studio in Austin, Texas. Plain HTML/CSS/JS, no build step, no dependencies.

## Brand facts (always honor — never paraphrase these)

- The service is **Micro K-Tip** hot fusion (keratin-bonded, strand-by-strand).
- The installation technique is called **"invisible bonds"** — NOT "hand-tied".
  Use "Invisible Bonds" as a proper service name, "invisible bonds" lowercase
  mid-sentence. **Never write "hand-tied" anywhere.**
- Instagram: **@__hair_by_inna__** → https://www.instagram.com/__hair_by_inna__/
- Phone: **(737) 288-5377** · Email: **hbistudio24@gmail.com**
- Address: **13740 N Hwy 183, Building H, Office 8, Austin, TX 78750**
  → https://maps.app.goo.gl/on6bKGeQYGcoW2rF8
- Google rating: **5.0**. Review count: **verify against the live Google profile
  before writing a number** — the site currently says 13, the brand sheet said
  12. Do not guess.
- By appointment only.

## Aesthetic — "Dark Couture"

Warm near-black grounds, a single gold accent (`#C9A36A`), gold hairlines
rather than borders, film-grain overlay, generous negative space.
Cormorant Garamond (serif, display + italic accents) over Inter (sans, UI and
body). Italic serif is used for emphasis inside headlines. See
`DESIGN_TOKENS.md` and `reference/Brand Guidelines.html`.

## Hard rules

- **Never hard-code a secret in `main.js`.** Everything in that file is public.
- **Never present stock photography as real client work.** Any before/after or
  gallery image must be a genuine result, or the surrounding copy must not
  claim it is.
- **Never invent a testimonial, a client count, or a years-of-experience
  figure.** If a number can't be verified, remove it or qualify it.
- Copy exact values from `style.css`. If it says `13px`, it is 13px — the
  scale is intentionally not on a 4/8 grid.
- Every color comes from the token block at the top of `style.css`. Don't
  introduce a new hex; if a new shade is genuinely needed, derive it in
  `oklch()` from an existing token and add it as a token.
- Voice: first person singular from the stylist ("my clients"), warm and
  restrained, no exclamation marks, **no emoji**.
- Small, targeted edits. This codebase has been hand-tuned; don't reformat or
  "improve" regions you weren't asked to touch.

## Layout conventions

- Sections are `<section id="…" aria-label="…">`, each with a `*-wrap` inner
  container capped at `--maxw` with `--gutter` side padding.
- Anything that should animate in on scroll gets `class="reveal"` and an
  optional `data-delay="<ms>"`. `main.js` handles the rest.
- Sibling groups use flex/grid + `gap`, never margins on children.
- Section eyebrows are `<span class="eyebrow">`, which draws its own gold rule
  via `::before`.

## Running it

Use the `hbi-studio` config in `.claude/launch.json` (serves `site/` on port
3000) via the preview tools — not a raw Bash server. A plain HTTP server is
required, not `file://`.

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
