import { Bot, Code2, Gauge, LayoutDashboard } from 'lucide-react';
import Section from '../components/ui/Section';
import { skillGroups } from '../data/skills';

const ICONS = {
  wordpress: LayoutDashboard,
  web: Code2,
  optimization: Gauge,
  ai: Bot,
};

export default function Skills() {
  return (
    <Section
      id="skills"
      index={3}
      label="Skills & Technologies"
      title="The toolkit behind the work."
      intro="WordPress, e-commerce, modern deployment tooling and AI-assisted development, grouped by what they are used for."
    >
      <div className="grid gap-5 md:grid-cols-2">
        {skillGroups.map((group, i) => {
          const Icon = ICONS[group.id] ?? Code2;
          return (
            <article key={group.id} className="hud-card p-6 sm:p-7" data-reveal data-reveal-delay={(i % 2) * 0.08}>
              <header className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-md border border-signal/30 bg-signal/[0.06] text-signal">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <h3 className="font-display text-lg font-semibold text-white">{group.title}</h3>
              </header>
              <ul className="mt-5 flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <li key={item} className="chip">
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </Section>
  );
}
