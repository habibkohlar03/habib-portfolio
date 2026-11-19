// External asset slots. The site works without any of these.
//
// To go live with each asset: put the file in /public, then flip `enabled`
// to true. Detection is explicit on purpose: static hosts often answer a
// missing file with index.html (HTTP 200), so "does the file exist?" checks
// are unreliable.

export const assets = {
  avatar: {
    enabled: true, // Avaturn model, /public/models/avatar.glb
    url: '/models/avatar.glb',

    // Target standing height in scene units. The model is auto-scaled to this.
    height: 1.75, // full body, head to feet
    // Extra rotation around the vertical axis, in radians (0 = facing the camera).
    rotationY: 0,
    // Nudge the model on the platform: [x, y, z] in scene units.
    offset: [0, 0, 0],

    // The avatar's own animation (the idle clip inside the GLB) is the only body movement.
    // No code-driven motion. For a model WITHOUT a clip, the arms are lowered from a T-pose
    // to `armSpreadDeg` and it stands still.
    useEmbeddedIdle: true,
    pose: { lowerArms: true, armSpreadDeg: 18 },

    // Set true only if you re-export the GLB with Draco compression.
    draco: false,
  },

  // Camera framing for the hero stage (scene units). The camera backs away
  // until both the full height and the platform width fit the stage, whatever
  // its shape (phone, tablet, desktop).
  stage: {
    viewHeight: 2.45, // vertical space that must be visible
    viewWidth: 2.1, // horizontal space that must be visible
    minDistance: 3.6,
    cameraY: 1.15,
    targetY: 0.85,
  },

  voice: {
    enabled: true, // /public/audio/intro.mp3
    url: '/audio/intro.mp3',
    // Mouth-shape timeline for intro.mp3 (JSON with `mouthCues`, Rhubarb format), prefetched at
    // page load. Generated from the recording by tools/make-viseme-timeline.py (acoustic
    // analysis). Replace the file with Rhubarb Lip Sync output for phoneme-level accuracy.
    visemeTimeline: '/audio/intro.visemes.json',
    // Optional plain-text transcript, shown to visitors for accessibility.
    transcript: '',
  },
};
