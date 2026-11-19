import { createEntrance } from './entrance';
import { createBackflip } from './backflip';
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

export function createDirector({ rng = Math.random, entrance = {}, skipEntrance = false, mode = 'run', gestureCues = null } = {}) {
  const flipMode = mode === 'backflip';
  const path = createEntrance(entrance);
  const flip = createBackflip();
  const gestures = createGestureDirector({ rng, cues: gestureCues });

  let clock = 0; // seconds since the entrance began
  let phase = skipEntrance ? 'idle' : 'entering';
  let runPhase = 0;
  let speak = 0;

  function update(dt, { speaking = false, level = 0, time = 0 } = {}) {
    const step = Math.min(dt, 0.05); // ignore long frames (tab switches) so nothing jumps
    clock += step;

    let z = 0;
    let runWeight = 0;

    let flipState = null;
    if (phase === 'entering' && flipMode) {
      flipState = flip.sample(clock);
      if (flipState.done) {
        phase = 'idle';
        flipState = null;
      }
    } else if (phase === 'entering') {
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
    // During the flip the body belongs to the flip; speech blends in afterwards.
    const talking = speaking && !flipState;
    speak = damp(speak, talking ? 1 : 0, talking ? 6 : 16, step);
    if (!talking && speak < 0.01) speak = 0;

    const gesture = flipState ? null : gestures.update(step, { speaking, level, time });

    return { phase, z, runPhase, runWeight, speak, gesture, entering: phase === 'entering', flip: flipState, flipPivot: flip.pivot };
  }

  return { update, get phase() { return phase; } };
}
