// Vercel serverless function: POST /api/contact
// Sends the contact form to your inbox through Resend. The API key is read ONLY from the
// RESEND_API_KEY environment variable (Vercel dashboard); it never appears in the website code.
//
// Env vars (Vercel -> Project -> Settings -> Environment Variables):
//   RESEND_API_KEY   required
//   CONTACT_TO       optional, default khalidameer367@gmail.com
//   CONTACT_FROM     optional, default "Portfolio <onboarding@resend.dev>" (works without a verified domain,
//                    but then Resend only delivers to the email address of your Resend account)

const TO = process.env.CONTACT_TO || 'khalidameer367@gmail.com';
const FROM = process.env.CONTACT_FROM || 'Portfolio Contact <onboarding@resend.dev>';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const hits = new Map(); // best-effort rate limit per instance: 5 messages / 10 min / IP

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });
  if (!process.env.RESEND_API_KEY) return res.status(500).json({ ok: false, error: 'Email service is not configured.' });

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

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        reply_to: e,
        subject: `[Portfolio] ${s}`,
        text: `Name: ${n}\nEmail: ${e}\nSubject: ${s}\n\n${m}`,
        html: `<p><b>Name:</b> ${esc(n)}<br><b>Email:</b> ${esc(e)}<br><b>Subject:</b> ${esc(s)}</p><p style="white-space:pre-wrap">${esc(m)}</p>`,
      }),
    });
    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      console.error('Resend error', r.status, detail);
      return res.status(502).json({ ok: false, error: 'The message could not be delivered. Please try again later.' });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Contact error', err);
    return res.status(502).json({ ok: false, error: 'The message could not be delivered. Please try again later.' });
  }
}

function bad(res, error) {
  return res.status(400).json({ ok: false, error });
}
function safeParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}
