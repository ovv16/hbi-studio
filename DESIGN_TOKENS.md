# Design tokens

All declared on `:root` at the top of `site/style.css`. These are the complete
set — introduce nothing outside it.

## Color

### Grounds (warm near-blacks)
| Token | Value | Use |
|---|---|---|
| `--ink` | `#0D0B09` | Page background |
| `--ink-2` | `#100E0B` | Footer, alternating sections |
| `--panel` | `#15120F` | Panels, inline code fields |
| `--panel-2` | `#19161220` | Translucent panel (note the 8-digit hex) |
| `--card` | `#1C1915` | Cards |
| `--card-2` | `#221E18` | Card hover / raised |
| `--warm` | `#241C14` | Warm fill |
| `--warm-2` | `#332514` | Warmer fill |

### Gold — the single accent
| Token | Value | Use |
|---|---|---|
| `--gold` | `#C9A36A` | Accent text, icons, active states |
| `--gold-deep` | `#AB824C` | Rules, eyebrow dashes, pressed |
| `--gold-dim` | `rgba(201,163,106,.35)` | Hairline, emphasized |
| `--gold-line` | `rgba(201,163,106,.22)` | **The standard hairline.** Use instead of a solid border. |
| `--gold-glow` | `rgba(201,163,106,.12)` | Glow / soft fill |

### Text
| Token | Value | Use | Contrast on `--ink` |
|---|---|---|---|
| `--cream` | `#E8D5B8` | Headings, primary | pass |
| `--cream-2` | `#DCC8AA` | Body | pass |
| `--mute` | `#B0A595` | Secondary, labels | ~7:1 pass |
| `--mute-2` | `#807666` | **Large text / hairlines only** | ~4.2:1 **fails AA for small text** |
| `--white` | `#FFFFFF` | Rare |
| `--black` | `#000000` | Rare |

## Type

```css
--serif: "Cormorant Garamond", "Times New Roman", Georgia, serif;
--sans:  "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

- **Serif** — display headings, italic emphasis inside headlines, prices.
  Weights in use: 400, 500, 600 + italics.
- **Sans** — everything else. Weights in use: 300, 400, 500, 600, 700.
- Body base: `15px / 1.65`.
- Headings: fluid `clamp()`, negative tracking (`-.005em` to `-.01em`).
- Eyebrows: `11px`, uppercase, `--track-md` (`0.18em`) or `--track-lg` (`0.28em`).

The Google Fonts request currently pulls 11 cuts. Trim it to the above.

## Tracking
| Token | Value |
|---|---|
| `--track-md` | `0.18em` |
| `--track-lg` | `0.28em` |

## Layout
| Token | Value | Notes |
|---|---|---|
| `--maxw` | `1440px` | Content cap |
| `--gutter` | `clamp(20px, 4vw, 80px)` | Side padding |
| `--section-y` | `clamp(60px, 7vw, 110px)` | Vertical section rhythm |

## Effects
| Token | Value | Notes |
|---|---|---|
| `--grain-opacity` | `.06` | Film-grain overlay |
| `--reveal-duration` | `1100ms` | Scroll reveal |
| `--reveal-ease` | `cubic-bezier(.2,.7,.15,1)` | The house easing — use it for new motion too |

## Radii & borders

Deliberately minimal. Radii are 0–3px on most surfaces; images and the modal
use slightly more. **There is no radius token** — the aesthetic is squared.
Separation is done with `1px solid var(--gold-line)`, not with shadow.

## Motion

One easing curve (`--reveal-ease`), one duration family (~1100ms for reveals,
300ms for hovers). Hovers shift color toward `--gold`; they do not scale or
lift. No bounce anywhere.
