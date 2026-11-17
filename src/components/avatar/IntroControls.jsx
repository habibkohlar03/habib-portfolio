import { AlertCircle, Loader2, Play, Square } from 'lucide-react';

const STATUS_TEXT = {
  starting: 'Preparing the voice introduction',
  playing: 'Voice introduction playing',
  idle: '',
  error: '',
};

// Four bars that pulse while the introduction plays. They stop for visitors who
// prefer reduced motion (the global reduced-motion rule in index.css).
function Equalizer() {
  return (
    <span aria-hidden="true" className="flex h-5 items-end gap-[3px]">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="w-[3px] animate-pulse rounded-full bg-signal"
          style={{ height: `${8 + ((i * 7) % 4) * 4}px`, animationDelay: `${i * 140}ms` }}
        />
      ))}
    </span>
  );
}

export default function IntroControls({ enabled, status, message, onPlay, onStop, transcript }) {
  if (!enabled) {
    return (
      <div className="flex flex-col items-start gap-2">
        <button type="button" className="btn-ghost" disabled aria-describedby="intro-note">
          <Play size={16} aria-hidden="true" />
          Play Introduction
        </button>
        <p id="intro-note" className="font-mono text-[11px] text-slate-500">
          Voice introduction coming soon
        </p>
      </div>
    );
  }

  const active = status === 'starting' || status === 'playing';

  return (
    <div className="flex flex-col items-start gap-3">
      <p className="sr-only" role="status" aria-live="polite">
        {STATUS_TEXT[status]}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        {active ? (
          <button
            type="button"
            onClick={onStop}
            className="btn border border-amber-glow/50 bg-amber-glow/[0.06] text-amber-glow hover:border-amber-glow hover:bg-amber-glow/15"
          >
            <Square size={14} fill="currentColor" aria-hidden="true" />
            Stop
          </button>
        ) : (
          <button type="button" onClick={onPlay} className="btn-ghost">
            <Play size={16} fill="currentColor" aria-hidden="true" />
            {status === 'error' ? 'Try again' : 'Play Introduction'}
          </button>
        )}

        {status === 'playing' ? (
          <span className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-signal/90">
            <Equalizer />
            Playing
          </span>
        ) : null}
        {status === 'starting' ? (
          <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-slate-400">
            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            Preparing
          </span>
        ) : null}
      </div>

      {status === 'error' && message ? (
        <p role="alert" className="flex max-w-md items-start gap-2 text-sm text-amber-glow">
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          {message}
        </p>
      ) : null}

      {transcript ? (
        <details className="max-w-md text-sm text-slate-400">
          <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500 hover:text-signal">
            Read transcript
          </summary>
          <p className="mt-2 leading-relaxed">{transcript}</p>
        </details>
      ) : null}
    </div>
  );
}
