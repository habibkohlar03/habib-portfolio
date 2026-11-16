export default function Section({ id, index, label, title, intro, children, className = '' }) {
  const headingId = `${id}-title`;

  return (
    <section id={id} aria-labelledby={headingId} className={`relative py-24 md:py-32 ${className}`}>
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <header className="mb-12 max-w-3xl md:mb-16" data-reveal>
          <p className="label-mono">{`// ${String(index).padStart(2, '0')} — ${label}`}</p>
          <h2
            id={headingId}
            className="mt-4 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl"
          >
            {title}
          </h2>
          {intro ? <p className="mt-5 text-base leading-relaxed text-slate-400 md:text-lg">{intro}</p> : null}
        </header>
        {children}
      </div>
    </section>
  );
}
