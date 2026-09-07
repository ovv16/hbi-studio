# Backlog

From the 1 August 2026 audit. `reference/Site Audit.html` has the full
reasoning; this is the queue.

---

## P0 — launch blockers

### 1. Telegram bot token is exposed in `main.js`
`main.js` line ~452 contains the live token and both chat IDs in plain text.
Everything in that file is public. Scrapers harvest tokens from public repos
within days; whoever has it can send as the bot, read history, or delete the
webhook.

**Do this:**
1. `/revoke` in @BotFather immediately — the current token must be considered
   compromised regardless of what else changes.
2. Move the send server-side. Cheapest correct option is a Cloudflare Worker
   or Netlify Function holding the token in an env var; the browser POSTs to
   your endpoint, the endpoint talks to Telegram.
3. Simplest option if you'd rather not run anything: switch the form to
   Formspree or Basin (free tier) and forward to
   `hbistudio24@gmail.com`.

Either way, add rate limiting or a honeypot check server-side — the existing
`.hp` honeypot field in the form is a good signal to forward.

### 2. Stock photos presented as real client work
The Before & After block is headed *"Real People · Real Results"* and reads
*"Every client. Every result. Documented honestly."* — but the two images are
different Unsplash models. Same for all 7 gallery tiles (sitting under the real
Instagram handle), the bleed hero, and the contact photo.

FTC rules treat a beauty before/after as a substantiated claim. Reverse image
search finds the originals in seconds.

**Do this:** replace with real pairs. Sources to change:
- `main.js` → the `pairs` array (before/after URLs)
- `index.html` → `#baBeforeImg`, `#baAfterImg`, the 7 `.gallery-tile` images,
  `.bleed-photo img`, `.contact-media img`
If a slot has no real photo, delete the slot rather than filling it.

### 3. Testimonials appear fabricated
"Megan S.", "Ashley T.", "Lauren B." each carry a Google glyph implying they
came from the Business Profile.

**Do this:** copy three real reviews verbatim with the reviewers' real first
names. Markup is at `index.html` → `.review-grid`.

---

## P1 — launch week

### 4. Review count is inconsistent, and `aggregateRating` is risky
Site says **13** in three places (visible text, `aria-label`, JSON-LD
`reviewCount`); the brand sheet recorded **12**.

Google's structured-data policy forbids self-serving `aggregateRating` for your
own business, and a mismatch with the live profile can suppress rich results.

**Do this:** verify the real count, then either sync all three or delete the
`aggregateRating` object from the `HairSalon` JSON-LD and keep only the visible
link. Google surfaces the real rating from the Business Profile either way.

### 5. Custom service dropdown has no keyboard support
`#serviceTrigger` + `role="listbox"` menu; `main.js` registers no key handlers
on it (only the lightbox has any). Keyboard and screen-reader users cannot pick
a service, so **they cannot complete the booking form.**

**Do this:** ArrowUp/Down to move the active option, Enter/Space to select,
Escape to close and restore focus to the trigger, Home/End to jump, plus
`aria-activedescendant` on the trigger. Or replace with a native `<select>`
styled to match — much less code and correct for free.

### 6. Custom cursor hides the system cursor site-wide
`cursor: none !important` is applied to every link, button, summary and label
(inline `<style>` in `index.html`). Anyone relying on the OS cursor — low
vision, tremor, screen magnifier, bright room — loses their pointer.

**Do this:** gate it behind
`@media (pointer: fine) and (prefers-reduced-motion: no-preference)` and add a
persisted off switch.

### 7. No image dimensions anywhere → layout shift
Not one `<img>` has `width`/`height`. Every image reflows the page on arrival,
which is exactly what CLS measures. Cheapest large win available.

**Do this:** add intrinsic `width`/`height` attributes, or `aspect-ratio` on
each image class in CSS.

### 8. Verify the "500+ Happy Clients" and "9+" stats
Both are presented as hard numbers in the About block. Confirm or reword to
something defensible.

### 9. Duplicate homepage files (resolved in this package)
The original project had `index.html`, `index-nano-ktip.html` and
`index-nano-ktip-v2.html` at root, with the plain `index.html` being a stale
draft — a real risk of serving or indexing the wrong one.

**Already done:** this package ships one `site/index.html` (the v2 content).
Keep it single. Don't hand-copy a `build/` folder again; generate it.

---

## P2 — after launch

### 10. Hero image isn't prioritised
The hero fallback is the LCP element but has no `fetchpriority="high"` and no
preload, so it's discovered late. Add both
(`assets/hero-fallback-800.webp`).

### 11. Trim the Google Fonts request
11 cuts requested; far fewer used. Cormorant 400/500 + italics, Inter
300/400/500/600.

### 12. Self-host the photos
Gallery, before/after, bleed hero and contact all hotlink Unsplash — a
third-party dependency on the critical path that disappears if a photo is taken
down. Resolves itself with P0 #2; do it once, then.

### 13. Real social share card
`og:image` is just the logo on a dark field, which previews poorly in DMs and
on Facebook. Export 1200×630: hero photo, gold wordmark,
"Micro K-Tip Extensions · Austin, TX".

### 14. Sitemap is incomplete and stale
Only the homepage is listed; `privacy.html` and `terms.html` are missing, and
`lastmod` reads 2026-07-07. Add both and refresh on deploy.

### 15. Gallery tiles are `<a href="#">`
Screen readers announce a link; without JS it jumps to the top of the page.
Make them `<button type="button">` (they open a lightbox) or point `href` at
the real Instagram post.

### 16. `--mute-2` fails AA for small text
`#807666` on `#0D0B09` ≈ 4.2:1. Reserve it for large text and hairlines; use
`--mute` (`#B0A595`) wherever it carries small copy.

### 17. Canonical URL still on GitHub Pages
Expected for now. Update `canonical`, `og:url`, `robots.txt`, `sitemap.xml`
together the day the domain moves.

---

## Loose ends

- TikTok social icon is commented out awaiting a URL — add the profile or
  delete the block (`index.html` → `.socials`).
- Service modal shows the "Add service photo" placeholder for every service.
- The Before/After block still contains the authoring hint
  *"Drop your before/after pair via the slots panel"* (`.ba-slot-hint`) —
  confirm it can never surface to a visitor, or remove it.
- Second Telegram recipient `164306473` still needs to press **Start** on the
  bot before it can receive anything.
- Decide whether the tweaks FAB ships on the customer-facing domain.

---

## Already correct — don't "fix" these

- Structured data is thorough: `HairSalon` with address, hours, phone,
  `sameAs`, plus a complete `FAQPage`.
- Exactly one `<h1>`; alternate hero variants correctly use
  `<p class="hero-h1">` instead of competing headings.
- Skip link, `aria-label`ed landmarks, real (visually-hidden) form labels,
  correct `alt=""` on the decorative hair layer.
- Responsive `srcset`/`sizes` on every photo, `loading="lazy"` below the fold.
- Hero video degrades to an animated still on save-data and slow connections.
- Lightbox keyboard support: Escape, ArrowLeft, ArrowRight.
- Brand facts are consistent throughout; no stray "hand-tied" anywhere.
