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
    height: 1.75,
    // Extra rotation around the vertical axis, in radians (0 = facing the camera).
    rotationY: 0,
    // Nudge the model on the platform: [x, y, z] in scene units.
    offset: [0, 0, 0],

    // The Avaturn export is a T-pose with no animation clips. When the arms are
    // more than a few degrees wider than `armSpreadDeg` from hanging straight
    // down, they are lowered to that angle. Set `lowerArms: false` to keep the
    // pose exactly as exported (e.g. once you export an A-pose or add clips).
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

  // Talking Avatar SDK (free, open source): built-in male avatar, lip-sync from audio.
  // modelUrl is the self-hosted lip-sync model, copied from the package into
  // public/sdk/ by `npm install` (see scripts/copy-viseme-model.mjs). Set it to
  // null to let the SDK load the model from jsDelivr instead.
  sdk: {
    modelUrl: '/sdk/viseme-model.bin',
  },

  voice: {
    enabled: true, // /public/audio/intro.mp3 (played by the Talking Avatar SDK)
    url: '/audio/intro.mp3',
    // Not used by the Talking Avatar SDK (it analyses the audio itself). Kept for
    // the legacy GLB avatar path.
    visemeTimeline: null,
    // Optional plain-text transcript, shown to visitors for accessibility.
    transcript: '',
  },
};
