// Lip-sync helpers. These only act on REAL morph targets found on the loaded
// avatar. If the model has none, nothing is animated: no faked mouth movement.

// Rhubarb Lip Sync mouth shapes -> Oculus / Ready Player Me viseme names.
export const RHUBARB_TO_VISEME = {
  A: 'viseme_PP', // closed (P, B, M)
  B: 'viseme_kk', // slightly open (K, S, T)
  C: 'viseme_E', // open (EH)
  D: 'viseme_aa', // wide open (AA)
  E: 'viseme_O', // rounded (AO, ER)
  F: 'viseme_U', // puckered (UW, OW, W)
  G: 'viseme_FF', // F, V
  H: 'viseme_nn', // L
  X: 'viseme_sil', // rest
};

const JAW_KEYS = ['jawOpen', 'mouthOpen'];

// ARKit blendshape names (what Avaturn "Type 2", Apple ARKit and most
// face-capture GLBs use). Rhubarb mouth shape -> weighted ARKit shapes.
export const RHUBARB_TO_ARKIT = {
  A: { mouthClose: 0.7 },
  B: { jawOpen: 0.2, mouthSmileLeft: 0.25, mouthSmileRight: 0.25 },
  C: { jawOpen: 0.45, mouthSmileLeft: 0.2, mouthSmileRight: 0.2 },
  D: { jawOpen: 0.85 },
  E: { jawOpen: 0.4, mouthFunnel: 0.6 },
  F: { jawOpen: 0.15, mouthPucker: 0.8, mouthFunnel: 0.3 },
  G: { jawOpen: 0.12, mouthRollLower: 0.5 },
  H: { jawOpen: 0.3 },
  X: {},
};
export const ARKIT_MOUTH_KEYS = [
  ...new Set(Object.values(RHUBARB_TO_ARKIT).flatMap((shape) => Object.keys(shape))),
];
const BLINK_KEYS = ['eyeBlinkLeft', 'eyeBlinkRight', 'eyesClosed'];

export function collectMorphMeshes(root) {
  const meshes = [];
  root.traverse((obj) => {
    if (obj.isMesh && obj.morphTargetDictionary && obj.morphTargetInfluences) meshes.push(obj);
  });
  return meshes;
}

/**
 * Reports what the avatar can actually do.
 *  visemes: viseme morph targets present (need >= 5 for believable timeline sync)
 *  jaw:     a jaw/mouth-open morph target, if any
 */
/** Every morph target name present on the avatar's meshes. */
export function morphNames(meshes) {
  const names = new Set();
  for (const mesh of meshes) for (const key of Object.keys(mesh.morphTargetDictionary || {})) names.add(key);
  return names;
}

export function detectLipSync(meshes) {
  const has = (key) => meshes.some((m) => key in m.morphTargetDictionary);
  const present = Object.values(RHUBARB_TO_VISEME).filter(has);
  return {
    visemes: present.length >= 5 ? present : [],
    jaw: JAW_KEYS.find(has) ?? null,
    arkitMouth: ARKIT_MOUTH_KEYS.filter(has),
    blink: BLINK_KEYS.filter(has),
  };
}

/**
 * Approximate mouth shape from live audio, for models with real morph targets
 * but no timeline. This is NOT phoneme-accurate: it maps loudness and the
 * low/high energy balance to open / rounded / wide. Pass the three band
 * levels from useIntroAudio (each 0..1).
 */
export function estimateMouthShape({ level = 0, low = 0, mid = 0, high = 0 }) {
  const open = Math.min(1, level * 1.5);
  const total = low + mid + high + 1e-6;
  const lowShare = low / total;
  const highShare = high / total;
  return {
    open,
    round: open * Math.max(0, lowShare - 0.45) * 2, // dark, low-frequency vowels (O, U)
    wide: open * Math.max(0, highShare - 0.2) * 2, // bright sounds (E, I, S)
  };
}

export function setMorph(meshes, key, value) {
  for (const mesh of meshes) {
    const index = mesh.morphTargetDictionary[key];
    if (index !== undefined) mesh.morphTargetInfluences[index] = value;
  }
}

// Binary search for the mouth cue active at time t (seconds). Cues are sorted by start.
export function cueAt(cues, t) {
  let lo = 0;
  let hi = cues.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const cue = cues[mid];
    if (t < cue.start) hi = mid - 1;
    else if (t >= cue.end) lo = mid + 1;
    else return cue;
  }
  return null;
}
