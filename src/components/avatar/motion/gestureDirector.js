import { GESTURE_NAMES } from './proceduralPose';

// Chooses WHEN to gesture and WHICH gesture.
//
// Two modes:
//  1. cues (assets.voice.gestureCues): a list of { t, name, d } on the audio timeline, so the
//     gesture matches what is being said at that moment (wave on the greeting, hand to the
//     chest on "I am ...", open hands on what Habib builds, an inviting hand at the end).
//     Rewinding or restarting the audio replays them correctly.
//  2. no cues: random gestures triggered by loudness onsets (the previous behaviour).
//
// Either way a gesture fades out within ~0.25 s the moment speech stops.

const smooth = (v) => {
  const t = Math.min(1, Math.max(0, v));
  return t * t * (3 - 2 * t);
};

export function createGestureDirector({ rng = Math.random, names = GESTURE_NAMES, cues = null } = {}) {
  const timeline = Array.isArray(cues) && cues.length ? [...cues].sort((a, b) => a.t - b.t) : null;
  const randomNames = names.filter((n) => n !== 'wave' && n !== 'invite');

  let active = null; // { name, age, duration }
  let cooldown = 0.8;
  let sinceLast = 0;
  let prevLevel = 0;
  let lastCue = -1;
  const history = [];

  const pick = () => {
    const options = randomNames.filter((n) => !history.slice(-2).includes(n));
    const pool = options.length ? options : randomNames;
    return pool[Math.floor(rng() * pool.length) % pool.length];
  };

  function start(name, duration) {
    history.push(name);
    if (history.length > 6) history.shift();
    active = { name, age: 0, duration };
    sinceLast = 0;
  }

  function update(dt, { speaking, level = 0, time = 0 }) {
    if (!speaking) {
      if (active) active.duration = Math.min(active.duration, active.age + 0.25);
      prevLevel = 0;
      cooldown = 0.8;
      sinceLast = 0;
      lastCue = -1;
    } else if (timeline) {
      // index of the latest cue whose time has passed
      let idx = -1;
      for (let i = 0; i < timeline.length; i += 1) if (timeline[i].t <= time) idx = i;
      if (idx !== lastCue) {
        const cue = timeline[idx];
        // only fire when playback just reached it (not after a long skip past it)
        if (cue && time - cue.t < 1.2) start(cue.name, cue.d ?? 2.2);
        lastCue = idx;
      }
    } else {
      sinceLast += dt;
      if (!active) cooldown -= dt;
      const phraseOnset = level > 0.14 && prevLevel < 0.08;
      if (!active && cooldown <= 0 && (phraseOnset || sinceLast > 2.6)) {
        start(pick(), 1.7 + rng() * 0.9);
      }
      prevLevel = level;
    }

    if (!active) return null;

    active.age += dt;
    if (active.age >= active.duration) {
      active = null;
      cooldown = 0.7 + rng() * 0.8;
      return null;
    }
    const rise = smooth(active.age / 0.35);
    const fall = smooth((active.duration - active.age) / 0.4);
    return { name: active.name, p: Math.min(rise, fall) };
  }

  return { update, get history() { return history.slice(); } };
}
