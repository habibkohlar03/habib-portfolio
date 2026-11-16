import { useEffect, useState } from 'react';
import { Mic, Pause, Play, RotateCcw } from 'lucide-react';

function useAudioTime(element) {
  const [time, setTime] = useState({ current: 0, duration: 0 });

  useEffect(() => {
    if (!element) return undefined;
    const update = () =>
      setTime({
        current: element.currentTime || 0,
        duration: Number.isFinite(element.duration) ? element.duration : 0,
      });
    const events = ['timeupdate', 'loadedmetadata', 'ended'];
    events.forEach((name) => element.addEventListener(name, update));
    return () => events.forEach((name) => element.removeEventListener(name, update));
  }, [element]);

  return time;
}

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

const STATUS_TEXT = {
  playing: 'Voice introduction playing',
  paused: 'Voice introduction paused',
  ended: 'Voice introduction finished',
  error: 'The voice introduction could not be played',
};

export default function IntroPlayer({ audio, transcript }) {
  const { enabled, status, element, play, pause, replay } = audio;
  const { current, duration } = useAudioTime(element);

  if (!enabled) {
    return (
      <div className="flex flex-col items-start gap-2">
        <button type="button" className="btn-ghost" disabled aria-describedby="intro-note">
          <Mic size={16} aria-hidden="true" />
          Introduce Myself
        </button>
        <p id="intro-note" className="font-mono text-[11px] text-slate-500">
          Voice introduction coming soon
        </p>
      </div>
    );
  }

  const active = status === 'playing' || status === 'paused' || status === 'loading';
  const percent = duration ? Math.min(100, (current / duration) * 100) : 0;

  return (
    <div className="flex flex-col items-start gap-3">
      <p className="sr-only" role="status" aria-live="polite">
        {STATUS_TEXT[status] || ''}
      </p>

      {!active ? (
        <button type="button" className="btn-ghost" onClick={play}>
          <Mic size={16} aria-hidden="true" />
          {status === 'ended' ? 'Introduce Myself again' : 'Introduce Myself'}
        </button>
      ) : (
        <div className="flex w-full max-w-sm items-center gap-3 rounded-md border border-signal/30 bg-signal/[0.04] p-2">
          <button
            type="button"
            className="grid h-9 w-9 shrink-0 place-items-center rounded bg-signal text-ink-950"
            onClick={status === 'playing' ? pause : play}
            aria-label={status === 'playing' ? 'Pause introduction' : 'Resume introduction'}
            disabled={status === 'loading'}
          >
            {status === 'playing' ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button
            type="button"
            className="grid h-9 w-9 shrink-0 place-items-center rounded border border-white/15 text-slate-200 hover:border-signal hover:text-signal"
            onClick={replay}
            aria-label="Replay introduction from the start"
          >
            <RotateCcw size={16} />
          </button>
          <div className="min-w-0 flex-1">
            <div
              className="h-1 overflow-hidden rounded bg-white/10"
              role="progressbar"
              aria-label="Introduction progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(percent)}
            >
              <div className="h-full bg-signal" style={{ width: `${percent}%` }} />
            </div>
            <p className="mt-1 font-mono text-[11px] text-slate-400">
              {fmt(current)} / {fmt(duration)}
            </p>
          </div>
        </div>
      )}

      {status === 'error' ? (
        <p className="font-mono text-[11px] text-amber-glow">Audio could not be loaded. Please try again later.</p>
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
