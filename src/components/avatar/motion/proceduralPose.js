// Procedural body motion: run cycle, idle stance, speaking stance and gestures.
//
// Used when no motion-capture clips are supplied (see assets.avatar.animations).
// It is plain maths with no three.js, so it can be tested and rendered offline.
//
// A pose is { BoneName: [x, y, z] }: angles in radians, applied as rotations
// about the WORLD axes on top of the bone's rest orientation, parent bones
// first (see BONE_ORDER). World axes make this independent of how a particular
// rig orients its bones. The character faces +z, its left side is +x:
//   +x rotates +y toward +z   (torso leans forward; shin bends the knee back;
//                              NEGATIVE x swings a thigh/arm forward)
//   +y turns the character toward +x
//   +z swings a hanging arm toward +x (outward for the left arm)

export const BONE_ORDER = [
  'Hips', 'Spine', 'Spine1', 'Spine2', 'Neck', 'Head',
  'LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand',
  'RightShoulder', 'RightArm', 'RightForeArm', 'RightHand',
  'LeftUpLeg', 'LeftLeg', 'LeftFoot',
  'RightUpLeg', 'RightLeg', 'RightFoot',
];

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (v) => {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
};

// ---- pose helpers -------------------------------------------------------

function set(pose, bone, x = 0, y = 0, z = 0) {
  const cur = pose[bone] || [0, 0, 0];
  pose[bone] = [cur[0] + x, cur[1] + y, cur[2] + z];
  return pose;
}

export function scalePose(pose, k) {
  const out = {};
  for (const bone of Object.keys(pose)) out[bone] = pose[bone].map((v) => v * k);
  return out;
}

export function addPose(a, b) {
  const out = {};
  for (const bone of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const pa = a[bone] || [0, 0, 0];
    const pb = b[bone] || [0, 0, 0];
    out[bone] = [pa[0] + pb[0], pa[1] + pb[1], pa[2] + pb[2]];
  }
  return out;
}

export function mixPose(a, b, w) {
  return addPose(scalePose(a, 1 - w), scalePose(b, w));
}

// ---- idle ---------------------------------------------------------------

export function idleMotion(t) {
  const p = {};
  const breathe = Math.sin(t * 1.5);
  set(p, 'Hips', 0, 0.03 * Math.sin(t * 0.3), 0.012 * Math.sin(t * 0.55));
  set(p, 'Spine', 0.012 * breathe);
  set(p, 'Spine1', 0.01 * Math.sin(t * 1.5 + 0.3));
  set(p, 'Spine2', 0.012 * Math.sin(t * 1.5 + 0.6));
  set(p, 'Neck', 0.006 * Math.sin(t * 0.7), 0.03 * Math.sin(t * 0.45));
  set(p, 'Head', 0.012 * Math.sin(t * 0.7), 0.05 * Math.sin(t * 0.5 + 1));
  // Relaxed arms: slight elbow bend, hands a little forward.
  for (const side of ['Left', 'Right']) {
    set(p, `${side}Arm`, -0.04 + 0.01 * breathe);
    set(p, `${side}ForeArm`, -0.22);
    set(p, `${side}Hand`, -0.05);
  }
  return p;
}

// ---- run cycle ----------------------------------------------------------

// phase: 0..2π over one full stride (two steps)
export function runMotion(phase) {
  const p = {};
  const sides = [
    ['Left', phase],
    ['Right', phase + Math.PI],
  ];
  for (const [side, ph] of sides) {
    const thigh = -(0.22 + 0.72 * Math.sin(ph)); // negative = forward
    const knee = Math.max(0.05, 0.62 + 0.72 * Math.cos(ph)); // knee flexion
    set(p, `${side}UpLeg`, thigh);
    set(p, `${side}Leg`, knee);
    set(p, `${side}Foot`, -0.45 * (thigh + knee) + 0.12);

    // Arms swing opposite to the same-side leg, elbows bent.
    const armPhase = ph + Math.PI;
    set(p, `${side}Arm`, -(0.1 + 0.55 * Math.sin(armPhase)));
    set(p, `${side}ForeArm`, -(1.45 + 0.15 * Math.sin(armPhase)));
  }
  // Forward lean, level gaze, small counter-rotation of hips and shoulders.
  set(p, 'Spine', 0.05, 0.14 * Math.sin(phase));
  set(p, 'Spine1', 0.05, 0.06 * Math.sin(phase));
  set(p, 'Spine2', 0.04);
  set(p, 'Neck', -0.05);
  set(p, 'Head', -0.08);
  set(p, 'Hips', 0, -0.1 * Math.sin(phase));
  return p;
}

export const runBob = (phase) => 0.03 * (0.5 - 0.5 * Math.cos(2 * phase));

// ---- gestures -----------------------------------------------------------
// Each gesture returns an ADDITIVE pose for envelope p (0 = rest, 1 = full).

export const GESTURES = {
  // Both hands open at chest height: "welcome / let me explain".
  openBoth: (p) => {
    const g = {};
    for (const [side, out] of [['Left', 1], ['Right', -1]]) {
      set(g, `${side}Arm`, -0.4 * p, 0, 0.4 * p * out);
      set(g, `${side}ForeArm`, -0.85 * p, -0.35 * p * out, 0);
      set(g, `${side}Hand`, -0.15 * p);
    }
    return g;
  },
  // Right hand raised, making a point.
  rightExplain: (p) => {
    const g = {};
    set(g, 'RightArm', -0.5 * p, 0, -0.22 * p);
    set(g, 'RightForeArm', -1.05 * p, -0.25 * p, 0);
    set(g, 'RightHand', -0.2 * p);
    set(g, 'LeftForeArm', -0.2 * p);
    set(g, 'Spine2', 0, -0.06 * p);
    return g;
  },
  // Mirror of rightExplain.
  leftExplain: (p) => {
    const g = {};
    set(g, 'LeftArm', -0.5 * p, 0, 0.22 * p);
    set(g, 'LeftForeArm', -1.05 * p, 0.25 * p, 0);
    set(g, 'LeftHand', -0.2 * p);
    set(g, 'RightForeArm', -0.2 * p);
    set(g, 'Spine2', 0, 0.06 * p);
    return g;
  },
  // Hand toward the chest: "I", "me", "my work".
  selfPoint: (p) => {
    const g = {};
    set(g, 'RightArm', -0.15 * p, 0, 0.2 * p);
    set(g, 'RightForeArm', -1.4 * p, 0.85 * p, 0);
    set(g, 'RightHand', -0.1 * p);
    set(g, 'Head', 0.04 * p);
    return g;
  },
  // Small emphasis with both forearms.
  beat: (p, t = 0) => {
    const g = {};
    const bounce = 0.12 * Math.sin(t * 9) * p;
    for (const side of ['Left', 'Right']) {
      set(g, `${side}Arm`, -0.2 * p);
      set(g, `${side}ForeArm`, -0.6 * p + bounce);
    }
    return g;
  },
};

export const GESTURE_NAMES = Object.keys(GESTURES);

// ---- complete pose ------------------------------------------------------
//
//   t          seconds
//   runPhase   stride phase (radians)
//   runWeight  0 = standing, 1 = running (blends smoothly between the two)
//   speak      0..1 speaking weight (0 = idle, 1 = fully in conversation stance)
//   level      0..1 voice loudness
//   gesture    { name, p } or null
//   look       { yaw, pitch } head turn toward the visitor's cursor (radians)

export function buildPose({ t = 0, runPhase = 0, runWeight = 0, speak = 0, level = 0, gesture = null, look = null }) {
  const standing = idleMotion(t);

  // Conversation stance: forearms come up a little, shoulders open, head lively.
  const talk = {};
  for (const side of ['Left', 'Right']) {
    set(talk, `${side}Arm`, -0.1);
    set(talk, `${side}ForeArm`, -0.3);
  }
  set(talk, 'Head', Math.sin(t * 4.2) * 0.035 * (0.4 + level), Math.sin(t * 1.7) * 0.05);
  set(talk, 'Neck', Math.sin(t * 4.2 + 0.4) * 0.015 * (0.4 + level));
  set(talk, 'Spine2', 0.01 * level);

  let pose = addPose(standing, scalePose(talk, smooth(speak)));
  if (gesture && gesture.p > 0 && GESTURES[gesture.name]) {
    pose = addPose(pose, GESTURES[gesture.name](gesture.p, t));
  }
  if (runWeight > 0) pose = mixPose(pose, runMotion(runPhase), smooth(runWeight));

  if (look) {
    const w = 1 - smooth(runWeight);
    pose = addPose(pose, {
      Head: [look.pitch * 0.6 * w, look.yaw * 0.6 * w, 0],
      Neck: [look.pitch * 0.4 * w, look.yaw * 0.4 * w, 0],
    });
  }

  return { deltas: pose, bob: runWeight > 0 ? runBob(runPhase) * smooth(runWeight) : 0 };
}

// ---- quaternions (so the three.js adapter and offline tests share one definition) ----

const qmul = (a, b) => [
  a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
  a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
  a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
  a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
];
const axisQ = (axis, angle) => {
  const s = Math.sin(angle / 2);
  const c = Math.cos(angle / 2);
  return axis === 0 ? [s, 0, 0, c] : axis === 1 ? [0, s, 0, c] : [0, 0, s, c];
};

// World-space delta quaternion [x, y, z, w] for an [x, y, z] triple: X first, then Y, then Z.
export function deltaQuaternion([x, y, z]) {
  return qmul(axisQ(2, z), qmul(axisQ(1, y), axisQ(0, x)));
}
