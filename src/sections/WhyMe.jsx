import { Cpu, ListChecks, ShieldCheck, Smartphone, Smile, Target } from 'lucide-react';
import Section from '../components/ui/Section';
import { whyPoints } from '../data/process';

const ICONS = {
  target: Target,
  phone: Smartphone,
  shield: ShieldCheck,
  cpu: Cpu,
  list: ListChecks,
  smile: Smile,
};

export default function WhyMe() {
  return (
    <Section id="why-me" index={8} label="Why Work With Me" title="What you can expect.">
      <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {whyPoints.map((point, i) => {
          const Icon = ICONS[point.icon] ?? Target;
          return (
            <li key={point.id} className="flex gap-4" data-reveal data-reveal-delay={(i % 3) * 0.07}>
              <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-signal">
                <Icon size={18} aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-display text-lg font-semibold text-white">{point.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{point.description}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
