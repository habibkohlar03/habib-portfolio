// Used to mark content that is a placeholder until verified details arrive.
export default function PlaceholderBadge({ children = 'Placeholder' }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/40 bg-brand-soft px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-signal-deep">
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand" />
      {children}
    </span>
  );
}
