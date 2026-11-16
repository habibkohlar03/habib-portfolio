import Section from '../components/ui/Section';
import PlaceholderBadge from '../components/ui/Badge';
import { experience } from '../data/experience';

export default function Experience() {
  return (
    <Section id="experience" index={6} label="Professional Experience" title="Two years of hands-on development.">
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="hud-card flex flex-col justify-between p-8" data-reveal>
          <p className="label-mono">Professional experience</p>
          <div className="mt-6 flex items-baseline gap-3">
            <span className="bg-gradient-to-br from-signal-soft to-amber-glow bg-clip-text font-display text-8xl font-bold leading-none text-transparent">
              {experience.years}
            </span>
            <span className="font-display text-xl text-white">years</span>
          </div>
          <p className="mt-6 text-sm leading-relaxed text-slate-400">{experience.summary}</p>
        </div>

        <div className="space-y-6" data-reveal data-reveal-delay="0.1">
          <div className="hud-card p-8">
            <p className="label-mono">Focus areas</p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {experience.focus.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-300">
                  <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-signal" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {experience.timeline.length ? (
            <ol className="hud-card divide-y divide-white/[0.06]">
              {experience.timeline.map((entry) => (
                <li key={`${entry.company}-${entry.period}`} className="p-6">
                  <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-signal/80">{entry.period}</p>
                  <h3 className="mt-1 font-display text-lg font-semibold text-white">
                    {entry.role}, {entry.company}
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">{entry.description}</p>
                </li>
              ))}
            </ol>
          ) : (
            <div className="rounded-lg border border-dashed border-white/15 p-6">
              <PlaceholderBadge>Role history pending</PlaceholderBadge>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                A detailed role-by-role timeline will appear here once it is added.
              </p>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}
