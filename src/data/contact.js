// All contact details live here. Leave a value as '' and the site shows a
// clearly labelled placeholder instead of a broken link.

export const contact = {
  email: '', // e.g. 'name@example.com'
  whatsapp: '', // international format, digits only, e.g. '923001234567'
  linkedin: 'https://www.linkedin.com/in/habib-ullah-wp/', // full URL, e.g. 'https://www.linkedin.com/in/your-handle'
  github: '', // full URL, e.g. 'https://github.com/your-handle'
  upwork: '', // optional, full URL
  fiverr: '', // optional, full URL
  location: 'Lahore, Pakistan',
};

// Contact form. Not connected yet.
// Works with any service that accepts a JSON POST and answers 2xx on success
// (Formspree, Getform, Basin, a Vercel serverless function, etc.).
export const contactForm = {
  endpoint: '/api/contact', // Vercel function in /api/contact.js (needs RESEND_API_KEY in Vercel)
  // Flip to true ONLY after you have submitted a real test message and
  // confirmed it arrived in your inbox. Until then the form never says
  // "message sent".
  deliveryVerified: false,
};
