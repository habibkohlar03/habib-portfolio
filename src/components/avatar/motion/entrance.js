// Entrance path: the character is already running when it appears in the
// distance, keeps a constant speed, then slows smoothly to a stop at the origin
// (constant deceleration, so there is no jump or teleport).
//
//   distance  how far away it starts (scene units, along -z)
//   duration  total time of the entrance, seconds
//   decel     how long the slow-down at the end lasts, seconds
//
// The cruise speed is derived so the character arrives exactly at z = 0:
//   distance = cruise * (duration - decel / 2)

const clamp01 = (v) => Math.min(1, Math.max(0, v));

export function createEntrance({ distance = 9, duration = 2.6, decel = 0.9 } = {}) {
  const cruise = distance / (duration - decel / 2);
  const cruiseEnd = duration - decel;

  function sample(t) {
    if (t <= 0) return { z: -distance, speed: cruise, speed01: 1, done: false };
    if (t >= duration) return { z: 0, speed: 0, speed01: 0, done: true };

    if (t <= cruiseEnd) {
      return { z: -distance + cruise * t, speed: cruise, speed01: 1, done: false };
    }
    const remaining = duration - t; // seconds left in the slow-down
    const speed = (cruise * remaining) / decel;
    const distanceLeft = (cruise * remaining * remaining) / (2 * decel);
    return { z: -distanceLeft, speed, speed01: clamp01(speed / cruise), done: false };
  }

  return { sample, cruise, duration, distance };
}
