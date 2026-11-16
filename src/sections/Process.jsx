import { Bug, ClipboardList, Code2, Gauge, PencilRuler, Send } from 'lucide-react';
import Section from '../components/ui/Section';
import { processSteps } from '../data/process';

const ICONS = {
  clipboard: ClipboardList,
  code: Code2,
  pencil: PencilRuler,
  bug: Bug,
  gauge: Gauge,
  send: Send,
};

export default function Process() {
  return (
    <Section
      id="process"
      index={7}
      label="My Development Process"
      title="From first plan to final launch."
      intro="A structured, detail-oriented workflow that covers every stage of a project."
    >
      <ol className="relative grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {processSteps.map((step, i) => {
          const Icon = ICONS[step.icon] ?? Code2;
          return (
            <li key={step.id} data-reveal data-reveal-delay={(i % 3) * 0.07}>
              <div className="hud-card h-full p-6">
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-md border border-signal/30 bg-signal/[0.06] text-signal">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <span className="font-mono text-xs tracking-[0.2em] text-amber-glow/80">
                    STEP {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{step.description}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}
