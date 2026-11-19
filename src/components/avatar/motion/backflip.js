// Entrance: the character stands, crouches, jumps and does a full BACKFLIP, lands in a
// small crouch, then stands up with open arms ("ta-da"). Plain maths, no three.js.
//
// sample(t) returns
//   angle  rotation about the character's X axis in radians (negative = backwards)
//   y      height of the hips above the ground (scene units), includes the crouch drop
//   pose   additive bone deltas (same format as proceduralPose.js)
//   done   true once the move has finished
//
// The timings below are in seconds from the moment the avatar appears.

const T = {
  start: 0.35, // short pause so the visitor first sees the character standing
  crouchFull: 0.85, // deepest crouch before the jump
  takeoff: 1.03, // feet leave the ground
  air: 0.95, // time in the air
  duration: 2.85,
};
T.land = T.takeoff + T.air; // feet touch the ground

const JUMP_HEIGHT = 0.5; // scene units (character is 1.75 tall)
const CROUCH_DROP = 0.185; // hips drop for the crouch used below (thigh -0.7, knee +1.3)

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (v) => {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
};

// Smooth interpolation through [time, value] keyframes.
function keys(t, frames) {
  if (t <= frames[0][0]) return frames[0][1];
  for (let i = 1; i < frames.length; i += 1) {
    if (t <= frames[i][0]) {
      const [t0, v0] = frames[i - 1];
      const [t1, v1] = frames[i];
      return v0 + (v1 - v0) * smooth((t - t0) / (t1 - t0));
    }
  }
  return frames[frames.length - 1][1];
}

function add(pose, bone, x = 0, y = 0, z = 0) {
  const cur = pose[bone] || [0, 0, 0];
  pose[bone] = [cur[0] + x, cur[1] + y, cur[2] + z];
}

export function createBackflip({ duration = T.duration } = {}) {
  function sample(t) {
    if (t >= duration) return { angle: 0, y: 0, pose: {}, done: true };

    // ---- weights ---------------------------------------------------------
    const inAir = t > T.takeoff && t < T.land;
    const s = clamp01((t - T.takeoff) / T.air); // 0..1 through the jump

    // crouch before the jump (down, hold, release) and after landing (absorb, rise)
    let crouch = 0;
    if (t < T.takeoff) {
      crouch = t < T.crouchFull ? smooth((t - T.start) / (T.crouchFull - T.start)) : 1 - smooth((t - T.crouchFull) / (T.takeoff - T.crouchFull));
    } else if (t >= T.land) {
      const down = smooth((t - T.land) / 0.18);
      const up = smooth((t - (T.land + 0.18)) / 0.5);
      crouch = down * (1 - up);
    }

    // tucked in the air: in over the first quarter, out over the last quarter
    const tuck = inAir ? smooth(s / 0.25) * (1 - smooth((s - 0.72) / 0.22)) : 0;

    // ---- root motion -----------------------------------------------------
    const jumpY = 4 * JUMP_HEIGHT * s * (1 - s);
    const y = jumpY - CROUCH_DROP * crouch;
    // slightly eased rotation: a full turn exactly between take-off and landing
    const turn = s * 0.7 + 0.3 * smooth(s);
    const angle = -Math.PI * 2 * turn;

    // ---- body pose -------------------------------------------------------
    const pose = {};
    const thigh = -(0.7 * crouch + 1.55 * tuck); // negative = knee comes forward
    const knee = 1.3 * crouch + 1.9 * tuck;
    // keep the feet flat while crouching; let them relax when tucked
    const foot = -(-0.7 + 1.3) * crouch;
    for (const side of ['Left', 'Right']) {
      add(pose, `${side}UpLeg`, thigh);
      add(pose, `${side}Leg`, knee);
      add(pose, `${side}Foot`, foot);
    }

    // torso: lean in for the crouch, a small lean back at take-off, curl when tucked
    const leanBack = keys(t, [[T.takeoff - 0.08, 0], [T.takeoff + 0.12, 1], [T.takeoff + 0.3, 0]]);
    add(pose, 'Spine', 0.45 * crouch + 0.5 * tuck - 0.3 * leanBack);
    add(pose, 'Spine1', 0.2 * crouch + 0.4 * tuck);
    add(pose, 'Spine2', 0.2 * tuck);
    add(pose, 'Neck', 0.25 * tuck - 0.1 * crouch);
    add(pose, 'Head', 0.2 * tuck - 0.12 * crouch);

    // arms: swing back, whip up for the jump, hug the knees, spread for balance, relax
    const armX = keys(t, [
      [0, 0], [T.start, 0], [T.crouchFull, 0.75], [T.takeoff, -1.6], [T.takeoff + 0.2, -2.7],
      [T.takeoff + 0.4, -1.15], [T.land - 0.28, -1.15], [T.land - 0.1, -0.5], [T.land + 0.15, -0.35], [duration, 0],
    ]);
    const armOut = keys(t, [
      [0, 0], [T.crouchFull, 0.1], [T.takeoff + 0.2, 0.15], [T.takeoff + 0.4, -0.1],
      [T.land - 0.28, -0.1], [T.land - 0.1, 0.7], [T.land + 0.2, 0.55], [duration, 0],
    ]);
    const foreX = keys(t, [
      [0, 0], [T.crouchFull, -0.2], [T.takeoff + 0.2, -0.3], [T.takeoff + 0.4, -1.0],
      [T.land - 0.28, -1.0], [T.land - 0.1, -0.3], [duration, 0],
    ]);
    add(pose, 'LeftArm', armX, 0, armOut);
    add(pose, 'RightArm', armX, 0, -armOut);
    add(pose, 'LeftForeArm', foreX);
    add(pose, 'RightForeArm', foreX);

    return { angle: inAir ? angle : 0, y, pose, done: false };
  }

  return { sample, duration, pivot: 0.53 }; // pivot: fraction of the height (about the hips)
}
