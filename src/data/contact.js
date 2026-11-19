// All contact details live here. Leave a value as '' and the site shows a
// clearly labelled placeholder instead of a broken link.

export const contact = {
  email: '', // e.g. 'name@example.com'
  whatsapp: '', // international format, digits only, e.g. '923001234567'
  linkedin: 'https://www.linkedin.com/in/habib-ullah-wp/',
  github: '', // full URL, e.g. 'https://github.com/your-handle'
  upwork: '', // optional, full URL
  fiverr: '', // optional, full URL
  location: 'Lahore, Pakistan',
};

// Contact form. Sends through the Vercel function in /api/contact (Resend), which emails the
// message to the inbox set in CONTACT_TO_EMAIL (default habibwebdeveloper3@gmail.com).
// The function answers 200 only after Resend accepted the email, so the success message is real.
export const contactForm = {
  endpoint: '/api/contact',
  deliveryVerified: true,
};

// Social icons (Contact section and footer). An icon is shown only when its URL is filled in,
// so there are never dead links. Paste the full profile URL for each one.
export const socials = {
  linkedin: 'https://www.linkedin.com/in/habib-ullah-wp/',
  instagram: 'https://www.instagram.com/kohlar03/',
  facebook: 'https://www.facebook.com/habib.ullah.517576',
  tiktok: 'https://www.tiktok.com/@kohlar03',
  snapchat: 'https://www.snapchat.com/add/kohlar03',
};
