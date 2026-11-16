import Section from '../components/ui/Section';
import { site } from '../data/site';

export default function About() {
  const rows = [
    ['Name', site.name],
    ['Role', site.title],
    ['Experience', `${site.experienceYears} years`],
    ['Location', site.location],
  ];

  return (
    <Section id="about" index={2} label="About" title="Reliable websites, built with a clear purpose.">
      <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
        <div className="space-y-5 text-base leading-relaxed text-slate-300 md:text-lg" data-reveal>
          {site.about.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <div className="space-y-6" data-reveal data-reveal-delay="0.1">
          <div className="hud-card p-6">
            <p className="label-mono">Operator profile</p>
            <dl className="mt-5 divide-y divide-white/[0.06]">
              {rows.map(([key, value]) => (
                <div key={key} className="flex items-baseline justify-between gap-4 py-3">
                  <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">{key}</dt>
                  <dd className="text-right font-display text-sm text-white">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="hud-card p-6">
            <p className="label-mono">What I build</p>
            <ul className="mt-4 grid gap-2.5 text-sm text-slate-300">
              {site.buildsList.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-signal" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Section>
  );
}
