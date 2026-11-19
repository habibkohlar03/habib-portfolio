import { Facebook, Ghost, Instagram, Linkedin, Music2 } from 'lucide-react';
import { socials } from '../../data/contact';

const ITEMS = [
  { id: 'linkedin', label: 'LinkedIn', Icon: Linkedin },
  { id: 'instagram', label: 'Instagram', Icon: Instagram },
  { id: 'facebook', label: 'Facebook', Icon: Facebook },
  { id: 'tiktok', label: 'TikTok', Icon: Music2 },
  { id: 'snapchat', label: 'Snapchat', Icon: Ghost },
];

// Round icon buttons. Only profiles with a URL in src/data/contact.js are shown.
export default function SocialLinks({ className = '' }) {
  const items = ITEMS.filter((item) => socials[item.id]);
  if (!items.length) return null;

  return (
    <ul className={`flex flex-wrap gap-3 ${className}`}>
      {items.map(({ id, label, Icon }) => (
        <li key={id}>
          <a
            href={socials[id]}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${label} (opens in a new tab)`}
            title={label}
            className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 bg-ink-950 text-slate-300 transition hover:-translate-y-0.5 hover:border-brand hover:bg-brand-soft hover:text-signal-deep"
          >
            <Icon size={18} aria-hidden="true" />
          </a>
        </li>
      ))}
    </ul>
  );
}
