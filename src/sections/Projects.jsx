import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import Section from '../components/ui/Section';
import { projects } from '../data/projects';

const initials = (name) => name.replace(/[^A-Za-z0-9 ]/g, '').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

// Real screenshot of the live site when /images/projects/<id>.webp exists; otherwise a clearly
// branded panel (not a fake screenshot).
function ProjectVisual({ project, index }) {
  const [failed, setFailed] = useState(false);
  if (project.image && !failed) {
    return (
      <img
        src={project.image}
        alt={`${project.name} website homepage`}
        loading="lazy"
        decoding="async"
        width="1600"
        height="1000"
        onError={() => setFailed(true)}
        className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
      />
    );
  }
  return (
    <div className="relative grid h-full w-full place-items-center overflow-hidden bg-gradient-to-br from-brand-soft to-ink-800">
      <div aria-hidden="true" className="bg-grid absolute inset-0 opacity-70" />
      <div aria-hidden="true" className={`absolute -bottom-10 h-40 w-40 rounded-full blur-3xl ${index % 2 ? 'bg-brand/25' : 'bg-brand/20'}`} />
      <span aria-hidden="true" className="relative font-display text-6xl font-bold tracking-tight text-signal">
        {initials(project.name)}
      </span>
      <span className="absolute bottom-3 left-3 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">{project.name}</span>
    </div>
  );
}

function ProjectCard({ project, index }) {
  const body = (
    <article className="hud-card group flex h-full flex-col overflow-hidden">
      <div className="aspect-[16/10] w-full shrink-0 overflow-hidden border-b border-white/10">
        <ProjectVisual project={project} index={index} />
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-signal">{project.category}</p>
        <h3 className="mt-2 font-display text-xl font-semibold text-white">{project.name}</h3>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-400">{project.description}</p>
        {project.tech.length ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {project.tech.map((t) => (
              <li key={t} className="chip">
                {t}
              </li>
            ))}
          </ul>
        ) : null}
        <span className="mt-5 inline-flex items-center gap-1.5 font-display text-sm font-semibold text-signal">
          {project.url ? (
            <>
              Visit website
              <ArrowUpRight size={16} aria-hidden="true" />
            </>
          ) : (
            <span className="text-slate-500">Link coming soon</span>
          )}
        </span>
      </div>
    </article>
  );

  return (
    <li data-reveal data-reveal-delay={(index % 3) * 0.08} className="h-full">
      {project.url ? (
        <a href={project.url} target="_blank" rel="noopener noreferrer" className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
          {body}
          <span className="sr-only"> (opens {project.name} in a new tab)</span>
        </a>
      ) : (
        body
      )}
    </li>
  );
}

export default function Projects() {
  return (
    <Section
      id="projects"
      index={5}
      label="Featured Projects"
      title="Selected work."
      intro="Live websites I have built or worked on. Click a card to open the site."
    >
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project, index) => (
          <ProjectCard key={project.id} project={project} index={index} />
        ))}
      </ul>
    </Section>
  );
}
