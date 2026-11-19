export default function Section({ id, index, label, title, intro, children, className = '' }) {
  const headingId = `${id}-title`;

  return (
    <section id={id} aria-labelledby={headingId} className={`relative py-14 md:py-20 ${className}`}>
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <header className="mb-9 max-w-3xl md:mb-12" data-reveal>
          <p className="label-mono flex items-center gap-3">
            <span aria-hidden="true" className="h-[2px] w-8 rounded-full bg-brand" />
            {`${String(index).padStart(2, '0')} · ${label}`}
          </p>
          <h2
            id={headingId}
            className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl"
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
