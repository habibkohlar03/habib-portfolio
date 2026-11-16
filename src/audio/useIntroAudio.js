import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Voice introduction controller.
 *
 * Exposes play / pause / toggle / replay and a `stateRef` that the 3D scene
 * reads every frame WITHOUT causing React re-renders:
 *   stateRef.current = { playing, getLevel(), getTime(), cues }
 *
 * - getLevel(): 0..1 loudness from a Web Audio analyser (0 if unavailable)
 * - getTime():  current playback time in seconds
 * - cues:       optional Rhubarb mouth cues, loaded on first play
 *
 * status: 'unavailable' | 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error'
 */
export function useIntroAudio(config) {
  const enabled = Boolean(config && config.enabled && config.url);
  const url = config ? config.url : '';
  const timelineUrl = config ? config.visemeTimeline : null;

  const stateRef = useRef({ playing: false, getLevel: () => 0, getTime: () => 0, cues: null });
  const audioRef = useRef(null);
  const graphRef = useRef(null);
  const srcSetRef = useRef(false);
  const [element, setElement] = useState(null);
  const [status, setStatus] = useState(enabled ? 'idle' : 'unavailable');

  useEffect(() => {
    if (!enabled) {
      setStatus('unavailable');
      return undefined;
    }

    const audio = new Audio();
    audio.preload = 'none'; // nothing is downloaded until the visitor presses play
    audioRef.current = audio;
    srcSetRef.current = false;
    const state = stateRef.current;
    state.getTime = () => audio.currentTime;
    setElement(audio);
    setStatus('idle');

    const onPlay = () => {
      state.playing = true;
      setStatus('playing');
    };
    const onPause = () => {
      if (audio.ended) return;
      state.playing = false;
      setStatus('paused');
    };
    const onEnded = () => {
      // Reset so the avatar returns to idle and a replay starts from the top.
      state.playing = false;
      audio.currentTime = 0;
      setStatus('ended');
    };
    const onError = () => {
      state.playing = false;
      setStatus('error');
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.pause();
      state.playing = false;
      state.getLevel = () => 0;
      state.cues = null;
      if (graphRef.current) {
        graphRef.current.ctx.close().catch(() => {});
        graphRef.current = null;
      }
      audioRef.current = null;
      setElement(null);
    };
  }, [enabled, url]);

  // Builds the analyser once, from inside a user gesture.
  const setupAnalyser = useCallback(() => {
    if (graphRef.current || !audioRef.current) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const source = ctx.createMediaElementSource(audioRef.current);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.6;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      const buffer = new Uint8Array(analyser.fftSize);
      graphRef.current = { ctx };
      stateRef.current.getLevel = () => {
        analyser.getByteTimeDomainData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i += 1) {
          const v = (buffer[i] - 128) / 128;
          sum += v * v;
        }
        return Math.min(1, Math.sqrt(sum / buffer.length) * 4.5);
      };
    } catch {
      // Analyser is optional: playback still works, the avatar just gets no level signal.
    }
  }, []);

  const loadCues = useCallback(() => {
    if (!timelineUrl || stateRef.current.cues) return;
    fetch(timelineUrl)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json && Array.isArray(json.mouthCues) && json.mouthCues.length) {
          stateRef.current.cues = json.mouthCues;
        }
      })
      .catch(() => {
        // Missing or invalid timeline: fall back to amplitude-driven animation.
      });
  }, [timelineUrl]);

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      if (!srcSetRef.current) {
        audio.src = url;
        srcSetRef.current = true;
        loadCues();
      }
      setStatus((s) => (s === 'paused' ? s : 'loading'));
      setupAnalyser();
      if (graphRef.current && graphRef.current.ctx.state === 'suspended') {
        await graphRef.current.ctx.resume();
      }
      await audio.play();
    } catch {
      stateRef.current.playing = false;
      setStatus('error');
    }
  }, [url, loadCues, setupAnalyser]);

  const pause = useCallback(() => {
    if (audioRef.current) audioRef.current.pause();
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (audio && !audio.paused) pause();
    else play();
  }, [pause, play]);

  const replay = useCallback(() => {
    if (audioRef.current) audioRef.current.currentTime = 0;
    play();
  }, [play]);

  return { enabled, status, element, stateRef, play, pause, toggle, replay };
}
