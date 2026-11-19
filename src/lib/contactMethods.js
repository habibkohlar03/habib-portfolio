import { contact } from '../data/contact';

// Turns the raw contact config into a list of renderable methods.
// A method with `href: null` is rendered as a labelled placeholder.
export function getContactMethods() {
  const digits = (contact.whatsapp || '').replace(/\D/g, '');

  return [
    {
      id: 'email',
      label: 'Email',
      value: contact.email,
      href: contact.email ? `mailto:${contact.email}` : null,
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      value: digits ? `+${digits}` : '',
      href: digits ? `https://wa.me/${digits}` : null,
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      value: contact.linkedin ? contact.linkedin.replace(/^https?:\/\/(www\.)?/, '') : '',
      href: contact.linkedin || null,
    },
    {
      id: 'github',
      label: 'GitHub',
      value: contact.github ? contact.github.replace(/^https?:\/\/(www\.)?/, '') : '',
      href: contact.github || null,
    },
    {
      id: 'upwork',
      label: 'Upwork',
      value: contact.upwork ? contact.upwork.replace(/^https?:\/\/(www\.)?/, '') : '',
      href: contact.upwork || null,
      optional: true,
    },
    {
      id: 'fiverr',
      label: 'Fiverr',
      value: contact.fiverr ? contact.fiverr.replace(/^https?:\/\/(www\.)?/, '') : '',
      href: contact.fiverr || null,
      optional: true,
    },
  ].filter((m) => m.href);
}
