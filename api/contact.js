// Vercel serverless function: POST /api/contact
// Sends the contact form to your inbox through Resend. The API key is read ONLY from the
// RESEND_API_KEY environment variable (Vercel dashboard); it never appears in website code,
// browser responses or logs.
//
// Env vars (Vercel -> Project -> Settings -> Environment Variables, then REDEPLOY):
//   RESEND_API_KEY   required
//   CONTACT_TO       optional, default habibwebdeveloper3@gmail.com
//   CONTACT_FROM     optional, default "Portfolio Contact <onboarding@resend.dev>".
//                    onboarding@resend.dev is Resend's test sender: it can ONLY deliver to the email
//                    address your Resend account was registered with. To send to any other address
//                    (or to the same one reliably), verify your own domain in Resend and use e.g.
//                    "Portfolio Contact <contact@yourdomain.com>".
//   CONTACT_DEBUG    optional, set to 1 to enable GET /api/contact (safe status check, no secrets)

const clean = (v) => String(v || '').trim().replace(/^["']|["']$/g, '').trim();
const KEY = () => clean(process.env.RESEND_API_KEY);
const TO = () => clean(process.env.CONTACT_TO) || 'habibwebdeveloper3@gmail.com';
const FROM = () => clean(process.env.CONTACT_FROM) || 'Portfolio Contact <onboarding@resend.dev>';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FROM_OK = /^(?:[^<>]+<[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+>|[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+)$/;
const hits = new Map(); // best-effort rate limit per instance: 5 messages / 10 min / IP

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const log = (level, msg, extra) => console[level](`[contact] ${msg}`, extra ? JSON.stringify(extra) : '');

export default async function handler(req, res) {
  // Optional status check (CONTACT_DEBUG=1). Reports configuration only, never the key.
  if (req.method === 'GET' && process.env.CONTACT_DEBUG === '1') return diagnose(res);
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const key = KEY();
  if (!key) {
    log('error', 'RESEND_API_KEY is missing or empty in this deployment (add it in Vercel and redeploy).');
    return res.status(500).json({ ok: false, error: 'Email service is not configured.' });
  }
  const from = FROM();
  const to = TO();
  if (!FROM_OK.test(from) || !EMAIL.test(to)) {
    log('error', 'CONTACT_FROM or CONTACT_TO has an invalid format.', { from, to });
    return res.status(500).json({ ok: false, error: 'Email service is not configured.' });
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body || {};
  const { name = '', email = '', subject = '', message = '', website = '', startedAt = 0 } = body;

  // Spam protection: honeypot + minimum fill time + rate limit.
  if (website) return res.status(200).json({ ok: true }); // pretend success to bots
  if (startedAt && Date.now() - Number(startedAt) < 2500) return res.status(200).json({ ok: true });
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 600000);
  if (recent.length >= 5) return res.status(429).json({ ok: false, error: 'Too many messages. Please try again later.' });
  hits.set(ip, [...recent, now]);

  const n = String(name).trim();
  const e = String(email).trim();
  const s = String(subject).trim();
  const m = String(message).trim();
  if (n.length < 2 || n.length > 100) return bad(res, 'Please enter your name.');
  if (!EMAIL.test(e) || e.length > 200) return bad(res, 'Please enter a valid email address.');
  if (s.length < 3 || s.length > 150) return bad(res, 'Please enter a subject.');
  if (m.length < 10 || m.length > 5000) return bad(res, 'Please write a message of at least 10 characters.');
  if (/[\r\n]/.test(n + e + s)) return bad(res, 'Invalid characters in the form.');

  let r;
  try {
    r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: e,
        subject: `[Portfolio] ${s}`,
        text: `Name: ${n}\nEmail: ${e}\nSubject: ${s}\n\n${m}`,
        html: `<p><b>Name:</b> ${esc(n)}<br><b>Email:</b> ${esc(e)}<br><b>Subject:</b> ${esc(s)}</p><p style="white-space:pre-wrap">${esc(m)}</p>`,
      }),
    });
  } catch (err) {
    log('error', 'Could not reach the Resend API (network error).', { message: err && err.message });
    return res.status(502).json({ ok: false, error: 'The message could not be delivered. Please try again later.' });
  }

  const raw = await r.text().catch(() => '');
  const data = safeParse(raw);
  if (!r.ok || !data.id) {
    // Full diagnostic goes to the Vercel function logs only. The visitor sees a generic message.
    log('error', `Resend rejected the email: HTTP ${r.status}`, {
      resendName: data.name,
      resendMessage: data.message || raw.slice(0, 300),
      from,
      to,
      hint: hint(r.status, data),
    });
    return res.status(502).json({ ok: false, error: 'The message could not be delivered. Please try again later.' });
  }

  log('info', 'Email accepted by Resend', { id: data.id });
  return res.status(200).json({ ok: true });
}

// What a Resend failure usually means, for the server log.
function hint(status, data) {
  const msg = String(data.message || '').toLowerCase();
  if (status === 401 || status === 400 && msg.includes('api key')) return 'API key invalid, revoked or mistyped: create a new key and update RESEND_API_KEY, then redeploy.';
  if (status === 403 && msg.includes('testing emails')) return 'onboarding@resend.dev can only send to the Resend account owner email. Use that address as CONTACT_TO, or verify a domain and set CONTACT_FROM.';
  if (status === 403 && msg.includes('domain')) return 'The CONTACT_FROM domain is not verified in Resend (resend.com/domains).';
  if (status === 403) return 'Resend refused the request: check key permissions ("Sending access") and the sender domain.';
  if (status === 422) return 'Invalid from/to/subject format.';
  if (status === 429) return 'Resend rate limit reached.';
  return 'See resendMessage.';
}

async function diagnose(res) {
  const key = KEY();
  const out = { keyPresent: Boolean(key), keyLooksValid: /^re_[A-Za-z0-9_]+$/.test(key), to: TO(), from: FROM(), usingTestSender: /@resend\.dev>?$/.test(FROM()) };
  if (key) {
    try {
      const r = await fetch('https://api.resend.com/domains', { headers: { Authorization: `Bearer ${key}` } });
      out.resendDomainsHttp = r.status; // 200 = full access key; 401 "restricted" = sending-only key (fine for sending)
      if (r.ok) {
        const d = safeParse(await r.text());
        out.verifiedDomains = (d.data || []).filter((x) => x.status === 'verified').map((x) => x.name);
      }
    } catch (err) {
      out.network = err && err.message;
    }
  }
  return res.status(200).json(out);
}

function bad(res, error) {
  return res.status(400).json({ ok: false, error });
}
function safeParse(text) {
  try {
    return JSON.parse(text) || {};
  } catch {
    return {};
  }
}
