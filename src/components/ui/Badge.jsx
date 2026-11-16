// Used to mark content that is a placeholder until verified details arrive.
export default function PlaceholderBadge({ children = 'Placeholder' }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded border border-amber-glow/40 bg-amber-glow/[0.08] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-amber-glow">
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-amber-glow" />
      {children}
    </span>
  );
}
