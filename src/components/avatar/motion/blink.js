// Random natural blinking. update(dt) returns an eyelid closure 0..1.
// Used only when the avatar has real blink morph targets (eyeBlinkLeft/Right).
export function createBlinkScheduler({ rng = Math.random } = {}) {
  let wait = 1.5 + rng() * 2; // seconds until the next blink
  let age = -1; // -1 = not blinking
  let doubleLeft = 0;

  const CLOSE = 0.07;
  const HOLD = 0.04; // fully shut, so a coarse frame step still reaches 1
  const OPEN = 0.12;

  function update(dt) {
    if (age < 0) {
      wait -= dt;
      if (wait > 0) return 0;
      age = 0;
      doubleLeft = rng() < 0.12 ? 1 : 0; // occasional double blink
    }
    age += dt;
    let value;
    if (age < CLOSE) value = age / CLOSE;
    else if (age < CLOSE + HOLD) value = 1;
    else if (age < CLOSE + HOLD + OPEN) value = 1 - (age - CLOSE - HOLD) / OPEN;
    else {
      value = 0;
      age = -1;
      if (doubleLeft) {
        doubleLeft = 0;
        wait = 0.12;
      } else {
        wait = 2.2 + rng() * 3.3;
      }
    }
    return value;
  }

  return { update };
}
