import { ArrowRight, Mail } from 'lucide-react';
import Section from '../components/ui/Section';
import { site } from '../data/site';
import { projects } from '../data/projects';

// Taken from the About text above: the four qualities Habib says his websites aim for.
const focus = [
  ['Visually professional', 'Clean, polished design that suits the business.'],
  ['User-friendly', 'Easy to navigate and simple to use.'],
  ['Responsive', 'Works properly across phones, tablets and desktops.'],
  ['Technically reliable', 'Built carefully, reviewed and customized by hand.'],
];

export default function About() {
  const rows = [
    ['Name', site.name],
    ['Role', site.title],
    ['Experience', `${site.experienceYears} years`],
    ['Location', site.location],
  ];

  return (
    <Section id="about" index={2} label="About" title="Reliable websites, built with a clear purpose.">
      <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start lg:gap-14">
        <div data-reveal>
          <div className="space-y-5 text-base leading-relaxed text-slate-300 md:text-lg">
            {site.about.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {focus.map(([title, text]) => (
              <div key={title} className="hud-card p-4">
                <p className="font-display text-sm font-semibold text-white">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">{text}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a href="#projects" className="btn-primary">
              View {projects.length} featured projects
              <ArrowRight size={16} aria-hidden="true" />
            </a>
            <a href="#contact" className="btn-ghost">
              <Mail size={16} aria-hidden="true" />
              Contact Me
            </a>
          </div>
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
