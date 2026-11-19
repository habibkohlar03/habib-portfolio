import { ArrowRight, ArrowUp } from 'lucide-react';
import { site } from '../../data/site';
import SocialLinks from '../ui/SocialLinks';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-ink-900 py-10">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 sm:px-8 md:grid-cols-[1fr_auto_1fr]">
        <div>
          <img src="/brand/logo-full.webp" alt={site.name} width="900" height="315" loading="lazy" decoding="async" className="mb-3 h-16 w-auto" />
          <p className="sr-only">{site.name}</p>
          <p className="mt-1 text-sm text-slate-500">
            {site.title} · {site.location}
          </p>
        </div>

        <div className="md:text-center">
          <p className="font-display text-lg font-semibold text-white">Have a website project in mind?</p>
          <p className="mt-1 text-sm text-slate-500">{site.availability}.</p>
          <a href="#contact" className="btn-primary mt-4">
            Let&apos;s talk
            <ArrowRight size={16} aria-hidden="true" />
          </a>
        </div>

        <div className="flex flex-col gap-4 md:items-end">
          <SocialLinks className="md:justify-end" />
        </div>
      </div>

      <div className="mx-auto mt-8 flex max-w-7xl items-center justify-between gap-4 border-t border-white/10 px-5 pt-5 sm:px-8">
        <p className="font-mono text-[11px] text-slate-500">
          © {new Date().getFullYear()} {site.name}. All rights reserved.
        </p>
        <a
          href="#top"
          className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500 hover:text-signal"
        >
          Back to top
          <ArrowUp size={14} aria-hidden="true" />
        </a>
      </div>
    </footer>
  );
}
