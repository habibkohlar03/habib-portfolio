import { ArrowUpRight } from 'lucide-react';
import Section from '../components/ui/Section';
import PlaceholderBadge from '../components/ui/Badge';
import TiltCard from '../components/ui/TiltCard';
import { projects } from '../data/projects';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useReducedMotion } from '../hooks/useReducedMotion';

const initials = (name) => name.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase();

function ProjectVisual({ project, index }) {
  const warm = index % 2 === 1;

  if (project.image) {
    return (
      <img
        src={project.image}
        alt={`Screenshot of ${project.name}`}
        loading="lazy"
        decoding="async"
        width="1600"
        height="1000"
        className="h-full w-full object-cover"
      />
    );
  }

  // No screenshot yet: a clearly synthetic monogram panel, not a fake screenshot.
  return (
    <div className="relative grid h-full w-full place-items-center overflow-hidden bg-gradient-to-br from-brand-soft to-ink-800">
      <div aria-hidden="true" className="bg-grid absolute inset-0 opacity-70" />
      <div
        aria-hidden="true"
        className={`absolute -bottom-10 h-40 w-40 rounded-full blur-3xl ${warm ? 'bg-brand/25' : 'bg-brand/20'}`}
      />
      <span
        aria-hidden="true"
        className={`relative font-display text-6xl font-bold tracking-tight ${warm ? 'text-signal-soft' : 'text-signal'}`}
      >
        {initials(project.name)}
      </span>
      <span className="absolute bottom-3 left-3 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
        Screenshot pending
      </span>
    </div>
  );
}

function ProjectCard({ project, index, tiltDisabled }) {
  const hasDetails = Boolean(project.description);

  return (
    <li data-reveal data-reveal-delay={(index % 2) * 0.08}>
      <TiltCard disabled={tiltDisabled} className="h-full">
        <article className="hud-card group flex h-full flex-col overflow-hidden">
          <div className="aspect-[16/10] w-full overflow-hidden border-b border-white/10">
            <ProjectVisual project={project} index={index} />
          </div>

          <div className="flex flex-1 flex-col p-6">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-[11px] text-slate-600">
                {String(index + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}
              </span>
              {!hasDetails ? <PlaceholderBadge>Details pending</PlaceholderBadge> : null}
            </div>

            <h3 className="mt-3 font-display text-xl font-semibold text-white">{project.name}</h3>

            {project.category ? <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-signal">{project.category}</p> : null}

            <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-400">
              {hasDetails ? project.description : 'Project description to be added.'}
            </p>

            {project.role ? <p className="mt-3 text-sm text-slate-300">Role: {project.role}</p> : null}

            {project.tech.length ? (
              <ul className="mt-4 flex flex-wrap gap-2">
                {project.tech.map((t) => (
                  <li key={t} className="chip">
                    {t}
                  </li>
                ))}
              </ul>
            ) : null}

            {project.url ? (
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-1.5 font-display text-sm font-semibold text-signal hover:text-amber-glow"
              >
                Visit {project.name}
                <ArrowUpRight size={16} aria-hidden="true" />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            ) : null}
          </div>
        </article>
      </TiltCard>
    </li>
  );
}

export default function Projects() {
  const reduced = useReducedMotion();
  const coarse = useMediaQuery('(pointer: coarse)');

  return (
    <Section
      id="projects"
      index={5}
      label="Featured Projects"
      title="Selected work."
      intro="Websites and tools I have worked on. Detailed case information and screenshots are being added."
    >
      <ul className="grid gap-6 md:grid-cols-2">
        {projects.map((project, index) => (
          <ProjectCard key={project.id} project={project} index={index} tiltDisabled={reduced || coarse} />
        ))}
      </ul>
    </Section>
  );
}
