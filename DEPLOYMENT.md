# Deploying hbi-studio.com on Cloudflare Pages

Production is the `light/` folder, served as-is (no build step) with one
Cloudflare Pages Function at `functions/api/lead.js` that forwards
consultation requests to Telegram.

```
GitHub (ovv16/hbi-studio, branch main)
   → Cloudflare Pages (build output: light/, functions: functions/)
   → https://hbi-studio.com
```

Everything below is written for the owner. Do the steps in order.

---

## 0. Before anything else: the Telegram token

The bot token that used to sit in `main.js` is public and must be treated as
stolen, even though it is no longer in the code.

1. Open Telegram, talk to **@BotFather**.
2. `/mybots` → choose the HBI Studio bot → **API Token** → **Revoke current token**.
3. Copy the **new** token. It goes into Cloudflare (step 3), nowhere else.

**DO NOT USE THE OLD EXPOSED TOKEN.** After revoking, only the new token works.

Chat IDs stay the same (the two chats that receive leads today). If you need to
look them up: send a message to the bot, then open
`https://api.telegram.org/bot<NEW_TOKEN>/getUpdates` in a browser and read
`chat.id` — and close that tab afterwards.

---

## 1. Create the Pages project

1. Log in to Cloudflare → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git**.
2. Authorise GitHub and pick the repository **ovv16/hbi-studio**.
3. Build settings:

| Setting | Value |
|---|---|
| Production branch | `main` (after the deploy branch is merged) |
| Framework preset | **None** |
| Root directory | *(leave empty — repository root)* |
| Build command | *(leave empty)* |
| Build output directory | `light` |
| Deploy command | *(leave empty)* |

   The Function is picked up automatically because `functions/` sits at the
   repository root, next to `light/`. Do not move it into `light/`.

4. **Save and Deploy**. The first deploy produces a `*.pages.dev` preview URL.
   Open it and check the site loads. The contact form will answer "couldn't
   be sent" until step 3 is done — that is expected.

---

## 2. Preview deployments

Every branch and pull request gets its own `*.pages.dev` preview. Previews
inherit the **Preview** environment variables, so set the Telegram secrets in
both environments if you want the form to work on previews, or leave Preview
empty so test submissions can never reach the real chats (recommended).

---

## 3. Environment variables (secrets)

Workers & Pages → the project → **Settings** → **Variables and Secrets**
(older UI: *Environment variables*) → **Production** → **Add**:

| Name | Type | Value |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Secret | the **new** token from step 0 |
| `TELEGRAM_CHAT_IDS` | Secret | chat ids separated by commas, e.g. `111111111,222222222` |

Click **Save**, then **Deployments** → latest → **Retry deployment** so the
Function restarts with the values.

Never put these values in the repository. `.env.example` lists the names only.

---

## 4. Custom domain

Workers & Pages → the project → **Custom domains** → **Set up a custom domain**.
Add **both**, one after the other:

1. `hbi-studio.com`
2. `www.hbi-studio.com`

The primary address is **hbi-studio.com** (no `www`). What happens next depends
on where the domain's DNS lives:

**A. The domain already uses Cloudflare nameservers**
Cloudflare adds the DNS records itself and activates the domain in a few
minutes. Nothing to do at the registrar.

**B. The domain is registered elsewhere and its nameservers are still the
registrar's**
Cloudflare shows the exact records to create (a `CNAME` for each hostname
pointing at the project's `*.pages.dev` address). Create them in the
registrar's DNS panel exactly as shown. Alternatively, add the domain to your
Cloudflare account as a zone and switch the nameservers at the registrar —
this is the better long-term option because the www redirect and rate limiting
below are zone features.

Do not create records by guesswork; use what the Custom domains screen shows.

HTTPS is automatic. After activation, open
`https://hbi-studio.com/` and `https://www.hbi-studio.com/` — both must load.

---

## 5. www → apex redirect (301)

Once the zone is on Cloudflare: **the domain** → **Rules** → **Redirect Rules**
→ **Create rule** → template **"Redirect from WWW to Root"** (or write it by
hand):

| Field | Value |
|---|---|
| When incoming requests match | Hostname equals `www.hbi-studio.com` |
| Then | Dynamic redirect |
| Expression | `concat("https://hbi-studio.com", http.request.uri.path)` |
| Status code | 301 |
| Preserve query string | on |

Check: `curl -I https://www.hbi-studio.com/privacy` → `301` with
`location: https://hbi-studio.com/privacy`.

(The `_redirects` file in `light/` cannot do this — Pages only supports
same-host rules there.)

---

## 6. Rate limiting for the form endpoint

Pages Functions cannot keep a reliable counter without extra storage, so the
Function does validation and the honeypot only. Add the limit at the edge:

**The domain** → **Security** → **WAF** → **Rate limiting rules** → **Create**:

| Field | Value |
|---|---|
| If incoming requests match | URI Path equals `/api/lead` **and** Request Method equals `POST` |
| Rate | 5 requests per 1 minute, counted per IP |
| Then | Block for 10 minutes |

If spam still gets through later, the next step is Cloudflare **Turnstile**
(invisible challenge): a widget on the form plus a server-side check of the
token in `functions/api/lead.js`. Not wired until it is needed.

---

## 7. Go-live checklist

Run these against `https://hbi-studio.com` after the domain is active:

```bash
curl -sI https://hbi-studio.com/ | grep -iE "HTTP|x-content|referrer|permissions|x-frame"
curl -s  https://hbi-studio.com/ | grep -iE 'rel="canonical"|og:url|name="robots"'
curl -s  https://hbi-studio.com/robots.txt
curl -s  https://hbi-studio.com/sitemap.xml
curl -sI https://hbi-studio.com/privacy.html          # → 308 to /privacy
curl -sI https://hbi-studio.com/does-not-exist        # → 404, branded page
curl -sI https://www.hbi-studio.com/                  # → 301 to apex
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://hbi-studio.com/api/lead \
  -H 'content-type: application/json' -d '{}'          # → 422
```

Then send **one** real test through the form on the live site and confirm
it arrives in Telegram. Check the social preview with Facebook's Sharing
Debugger or by pasting the link into iMessage/WhatsApp.

Expected: canonical and og:url are `https://hbi-studio.com/`; robots meta is
`index, follow`; nothing mentions `github.io`.

---

## 8. Retire the GitHub Pages copy

Only after step 7 passes. Until then the GitHub Pages site stays up so the
current address keeps working.

1. GitHub → repository → **Settings** → **Pages** → **Build and deployment**
   → Source: **None** (this unpublishes `ovv16.github.io/hbi-studio`).
2. The `Deploy site to GitHub Pages` workflow has been removed from the
   repository (done 2026-09-15), so nothing tries to publish there any more.

There is no way to redirect `github.io` addresses to the new domain once the
Pages site is off; the pages simply stop existing, which is the safe outcome
for search engines — the last version they saw already carried the
`hbi-studio.com` canonical.

---

## 9. Optional: Content-Security-Policy (report-only first)

The page uses inline `<script>` and `<style>` blocks, so a strict CSP would
break it. If you want one later, start in **Report-Only** mode by adding to
`light/_headers` under `/*`:

```
Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self'; font-src 'self'; connect-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'
```

Watch the browser console for violations for a week, then decide whether to
enforce it. Not part of this launch.

---

## Day-to-day

- **Deploys:** push to `main` → Cloudflare builds in under a minute. Preview
  branches deploy to their own URLs.
- **Rollback:** Workers & Pages → project → **Deployments** → older deployment →
  **Rollback**. Git history is the source of truth.
- **Changing style.css / main.js:** bump the `?v=` in the HTML `<link>`/`<script>`
  tags; the edge caches those files for a day.
- **Replacing a result photo:** keep the file name, bump `IMG_V` in `main.js`
  and the `?v=` in `index.html`; those URLs are cached for a year.
- **Local run with the Function:** copy `.env.example` to `.dev.vars`, fill the
  values, then `npx wrangler pages dev light`. `.dev.vars` is gitignored.

---

## Later (not part of this launch)

- Email copy of each lead and a spreadsheet log — add as extra `deliver*`
  steps in `functions/api/lead.js`; needs a mail provider (MailChannels via
  Cloudflare, or Resend) — decide when needed.
- Google Analytics 4, Search Console, Bing Webmaster Tools, Clarity.
- Service pages after the keyword/SERP review.
