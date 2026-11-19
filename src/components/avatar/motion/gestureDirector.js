import { GESTURE_NAMES } from './proceduralPose';

// Chooses WHEN to gesture and WHICH gesture, so the character does not repeat
// the same movement over and over.
//
// While the voice is playing it starts a gesture when the speaker has just
// become louder (a new phrase) or when too long has passed without one. A gesture
// never repeats either of the last two used, has a rest between gestures, and
// fades out within ~0.25 s the moment speech stops.

const smooth = (v) => {
  const t = Math.min(1, Math.max(0, v));
  return t * t * (3 - 2 * t);
};

export function createGestureDirector({ rng = Math.random, names = GESTURE_NAMES } = {}) {
  let active = null; // { name, age, duration }
  let cooldown = 0.8; // seconds before the first gesture
  let sinceLast = 0;
  let prevLevel = 0;
  const history = [];

  const pick = () => {
    const options = names.filter((n) => !history.slice(-2).includes(n));
    const pool = options.length ? options : names;
    return pool[Math.floor(rng() * pool.length) % pool.length];
  };

  function update(dt, { speaking, level = 0 }) {
    if (!speaking) {
      // Stop: shorten whatever is playing so it fades out fast, and reset.
      if (active) active.duration = Math.min(active.duration, active.age + 0.25);
      prevLevel = 0;
      cooldown = 0.8;
      sinceLast = 0;
    } else {
      sinceLast += dt;
      if (!active) cooldown -= dt;

      const phraseOnset = level > 0.14 && prevLevel < 0.08;
      if (!active && cooldown <= 0 && (phraseOnset || sinceLast > 2.6)) {
        const name = pick();
        history.push(name);
        if (history.length > 6) history.shift();
        active = { name, age: 0, duration: 1.7 + rng() * 0.9 };
        sinceLast = 0;
      }
      prevLevel = level;
    }

    if (!active) return null;

    active.age += dt;
    if (active.age >= active.duration) {
      active = null;
      cooldown = 0.7 + rng() * 0.8; // rest before the next one
      return null;
    }
    const rise = smooth(active.age / 0.35);
    const fall = smooth((active.duration - active.age) / 0.4);
    return { name: active.name, p: Math.min(rise, fall) };
  }

  return { update, get history() { return history.slice(); } };
}
