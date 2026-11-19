// Vercel serverless function: POST /api/contact
// Sends the contact form to your inbox through Resend.
//
// Environment variables (Vercel -> Project -> Settings -> Environment Variables):
//   RESEND_API_KEY       required
//   CONTACT_TO_EMAIL     optional, default habibwebdeveloper3@gmail.com
//   CONTACT_FROM_EMAIL   optional, default "Portfolio Contact <onboarding@resend.dev>"
//                        (use an address on a domain you verified in Resend to send to any inbox)

const TO_DEFAULT = 'habibwebdeveloper3@gmail.com';
const FROM_DEFAULT = 'Portfolio Contact <onboarding@resend.dev>';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const clean = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
// Header values must never contain line breaks.
const oneLine = (value) => value.replace(/[\r\n]+/g, ' ');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Email service is not configured.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  body = body || {};

  // Honeypot: pretend success so bots learn nothing.
  if (clean(body.website, 200)) return res.status(200).json({ ok: true });

  const name = oneLine(clean(body.name, 120));
  const email = oneLine(clean(body.email, 200));
  const subject = oneLine(clean(body.subject, 150));
  const projectType = oneLine(clean(body.projectType, 120));
  const message = clean(body.message, 5000);

  if (!name) return res.status(400).json({ error: 'Please enter your name.' });
  if (!EMAIL_PATTERN.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (message.length < 10) return res.status(400).json({ error: 'Please write at least a short message.' });

  const html = `
    <div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#1f2937">
      <h2 style="margin:0 0 12px">New message from your portfolio</h2>
      <p style="margin:0"><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p style="margin:0"><strong>Email:</strong> ${escapeHtml(email)}</p>
      ${projectType ? `<p style="margin:0"><strong>Project type:</strong> ${escapeHtml(projectType)}</p>` : ''}
      ${subject ? `<p style="margin:0"><strong>Subject:</strong> ${escapeHtml(subject)}</p>` : ''}
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0" />
      <p style="white-space:pre-wrap;margin:0">${escapeHtml(message)}</p>
    </div>`;

  const text = [
    `Name: ${name}`,
    `Email: ${email}`,
    projectType ? `Project type: ${projectType}` : null,
    subject ? `Subject: ${subject}` : null,
    '',
    message,
  ]
    .filter((line) => line !== null)
    .join('\n');

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL || FROM_DEFAULT,
        to: [process.env.CONTACT_TO_EMAIL || TO_DEFAULT],
        reply_to: email,
        subject: `Portfolio: ${subject || projectType || 'New message'} (${name})`.slice(0, 200),
        html,
        text,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      console.error('Resend error', response.status, detail);
      return res.status(502).json({ error: 'Could not send the message. Please try again.' });
    }
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Contact form error', error);
    return res.status(502).json({ error: 'Could not send the message. Please try again.' });
  }
}
