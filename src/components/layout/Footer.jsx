import { site, nav } from '../../data/site';

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 sm:px-8 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-display text-base font-semibold text-white">{site.name}</p>
          <p className="mt-1 text-sm text-slate-500">
            {site.title} · {site.location}
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
          {nav.map(({ id, label }) => (
            <a key={id} href={`#${id}`} className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500 hover:text-signal">
              {label}
            </a>
          ))}
        </nav>
      </div>
      <p className="mx-auto mt-8 max-w-7xl px-5 font-mono text-[11px] text-slate-600 sm:px-8">
        © {new Date().getFullYear()} {site.name}. Built with React, Three.js and Tailwind CSS.
      </p>
    </footer>
  );
}
