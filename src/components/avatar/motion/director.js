import { createEntrance } from './entrance';
import { createGestureDirector } from './gestureDirector';

// The animation sequence:
//
//   entering  the character runs in from the distance and slows to a stop
//   idle      standing, breathing
//   speaking  while the voice plays: conversation stance + gestures
//   (voice ends or Stop pressed -> back to idle)
//
// Blends are continuous (run weight, speaking weight) so nothing jumps.
// The director only decides; it knows nothing about three.js.

const STRIDE_HZ = 1.45; // stride cycles per second at full running speed

const damp = (current, target, lambda, dt) => current + (target - current) * (1 - Math.exp(-lambda * dt));

export function createDirector({ rng = Math.random, entrance = {}, skipEntrance = false } = {}) {
  const path = createEntrance(entrance);
  const gestures = createGestureDirector({ rng });

  let clock = 0; // seconds since the entrance began
  let phase = skipEntrance ? 'idle' : 'entering';
  let runPhase = 0;
  let speak = 0;

  function update(dt, { speaking = false, level = 0 } = {}) {
    const step = Math.min(dt, 0.05); // ignore long frames (tab switches) so nothing jumps
    clock += step;

    let z = 0;
    let runWeight = 0;

    if (phase === 'entering') {
      const s = path.sample(clock);
      z = s.z;
      runWeight = s.speed01;
      runPhase += step * Math.PI * 2 * STRIDE_HZ * s.speed01;
      if (s.done) phase = 'idle';
    }

    // Speech can start during the last moments of the entrance; it only changes
    // the arm/torso blend, never the root motion.
    if (phase !== 'entering') phase = speaking ? 'speaking' : 'idle';

    // Fast on Stop (so the speaking animation ends immediately), gentler on start.
    speak = damp(speak, speaking ? 1 : 0, speaking ? 6 : 16, step);
    if (!speaking && speak < 0.01) speak = 0;

    const gesture = gestures.update(step, { speaking, level });

    return { phase, z, runPhase, runWeight, speak, gesture, entering: phase === 'entering' };
  }

  return { update, get phase() { return phase; } };
}
