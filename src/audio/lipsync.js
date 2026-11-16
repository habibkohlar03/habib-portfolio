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
export function detectLipSync(meshes) {
  const has = (key) => meshes.some((m) => key in m.morphTargetDictionary);
  const present = Object.values(RHUBARB_TO_VISEME).filter(has);
  return {
    visemes: present.length >= 5 ? present : [],
    jaw: JAW_KEYS.find(has) ?? null,
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
