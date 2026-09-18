/**
 * POST /api/lead — consultation request from the contact form.
 *
 * Cloudflare Pages Function. Static site lives in /light, this file in
 * /functions at the repository root, as Pages expects. The browser posts
 * JSON here (same origin, so no CORS is involved); this function validates
 * it and forwards a message to Telegram using secrets that never reach the
 * client.
 *
 * Secrets (Cloudflare Pages → Settings → Environment variables, Production):
 *   TELEGRAM_BOT_TOKEN   bot token from BotFather — the NEW one, never the
 *                        token that was once shipped in main.js
 *   TELEGRAM_CHAT_IDS    comma-separated chat ids that should receive leads
 *
 * Delivery today is Telegram only. Email or a spreadsheet log can be added
 * later as further `deliver*` steps without touching the form.
 */

const LIMITS = { name: 80, phone: 30, service: 60, message: 1000 };
/* Reference the browser generates once per lead and repeats on retries, so a
   message that arrives twice can be recognised as one client. Optional. */
const LEAD_ID = /^[a-z0-9-]{8,24}$/;
const SERVICES = new Set([
  'Free Consultation',
  'Hair Extension Installation (Hair Included)',
  'Hair Extension Installation (Client’s Hair)',
  'Extension Reinstallation',
  'Extension Removal',
  'Premium Slavic Human Hair',
  'Not sure yet',
]);

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/* Keep digits, one leading plus; the rest of the punctuation people type is
   dropped. The original spelling is kept for the message, this is for the
   check. */
const digitsOf = (phone) => phone.replace(/\D/g, '');

/* Telegram's HTML parse mode: only these three need escaping. */
const esc = (s) => String(s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));

export async function onRequestPost({ request, env }) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_IDS) {
    /* Misconfiguration is the operator's problem, not the visitor's. */
    return json({ ok: false, error: 'not_configured' }, 503);
  }

  const ct = request.headers.get('content-type') || '';
  if (!ct.includes('application/json')) return json({ ok: false, error: 'bad_content_type' }, 415);

  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'bad_json' }, 400); }
  if (!body || typeof body !== 'object') return json({ ok: false, error: 'empty' }, 400);

  /* Honeypot: the hidden "website" field is filled only by bots. Answer as if
     it worked so the bot has nothing to learn from. */
  if (str(body.website, 200)) return json({ ok: true });

  const name = str(body.name, LIMITS.name);
  const phone = str(body.phone, LIMITS.phone);
  const service = str(body.service, LIMITS.service);
  const message = str(body.message, LIMITS.message);
  const id = str(body.id, 24);
  const ref = LEAD_ID.test(id) ? id : '';

  const errors = [];
  if (!name) errors.push('name');
  if (!phone || !/^[+()\d\s\-.]+$/.test(phone)) errors.push('phone');
  else {
    const d = digitsOf(phone).length;
    if (d < 10 || d > 15) errors.push('phone');
  }
  if (!service || !SERVICES.has(service)) errors.push('service');
  if (errors.length) return json({ ok: false, error: 'invalid', fields: errors }, 422);

  const text =
    '💇 <b>New enquiry — HBI Studio</b>\n\n' +
    '<b>Name:</b> ' + esc(name) + '\n' +
    '<b>Phone:</b> ' + esc(phone) + '\n' +
    '<b>Service:</b> ' + esc(service) + '\n' +
    '<b>Hair goals:</b> ' + (message ? esc(message) : '—') +
    (ref ? '\n\n<i>Ref ' + esc(ref) + '</i>' : '');

  const delivered = await deliverTelegram(env, text);
  if (!delivered) return json({ ok: false, error: 'delivery_failed' }, 502);
  return json({ ok: true });
}

/* Anything but POST is refused outright rather than falling through to the
   static site. */
const methodNotAllowed = () => new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST' } });
export const onRequestGet = methodNotAllowed;
export const onRequestHead = methodNotAllowed;
export const onRequestPut = methodNotAllowed;
export const onRequestPatch = methodNotAllowed;
export const onRequestDelete = methodNotAllowed;
export const onRequestOptions = methodNotAllowed;

async function deliverTelegram(env, text) {
  const ids = env.TELEGRAM_CHAT_IDS.split(',').map((s) => s.trim()).filter(Boolean);
  const results = await Promise.allSettled(ids.map((chat_id) =>
    fetch('https://api.telegram.org/bot' + env.TELEGRAM_BOT_TOKEN + '/sendMessage', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id, text, parse_mode: 'HTML' }),
    }).then((r) => r.ok)
  ));
  /* One recipient reached is a delivered lead. */
  return results.some((r) => r.status === 'fulfilled' && r.value === true);
}
