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

    // The T2 export carries its own standing-idle clip, which drives the resting pose (arms
    // down, weight shift). Set useEmbeddedIdle: false to ignore it. Only for a model WITHOUT a
    // clip: the arms are lowered from a T-pose to `armSpreadDeg` instead.
    useEmbeddedIdle: true,
    pose: { lowerArms: true, armSpreadDeg: 18 },

    // What the character does when the page opens:
    //   'backflip'  stands, crouches, does a full back flip and lands with open arms
    //   'run'       runs in from the distance and slows to a stop
    entrance: 'backflip',

    // Set true only if you re-export the GLB with Draco compression.
    draco: false,
    // Optional real motion-capture clips (Mixamo FBX or GLB, same-named bones: Hips, Spine, LeftArm...).
    // Set BOTH run and idle to switch the body from procedural motion to these clips.
    // Download run as "In Place". talk can list several clips; they are cycled while speaking.
    // Example: { run: '/animations/run.fbx', idle: '/animations/idle.fbx', talk: ['/animations/talk1.fbx'] }
    animations: { run: null, idle: null, talk: [] },
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
    // Gestures timed to the recording, so the hands match what is being said.
    //   t = second in intro.mp3 where the gesture starts, d = how long it lasts, name = one of
    //   wave | selfPoint | rightExplain | leftExplain | openBoth | beat | invite
    // The times follow the sentence breaks (pauses) found in the recording. The WORDS in each
    // sentence are assumed from the About text, so change the names if the recording differs.
    // Set to [] to go back to random gestures.
    gestureCues: [
      { t: 0.2, name: 'wave', d: 2.4 }, //          greeting
      { t: 3.6, name: 'selfPoint', d: 2.4 }, //      "I am Habib Ullah ..."
      { t: 6.9, name: 'rightExplain', d: 2.3 }, //   role and experience
      { t: 11.0, name: 'openBoth', d: 2.6 }, //      what I build for businesses
      { t: 15.0, name: 'beat', d: 2.4 }, //          types of websites
      { t: 20.5, name: 'leftExplain', d: 2.4 }, //   focus: professional, responsive
      { t: 24.0, name: 'rightExplain', d: 2.3 }, //  user-friendly and reliable
      { t: 29.2, name: 'beat', d: 2.4 }, //          development approach
      { t: 33.5, name: 'openBoth', d: 2.6 }, //      AI-assisted tools
      { t: 39.0, name: 'selfPoint', d: 2.2 }, //     I review and customise by hand
      { t: 42.6, name: 'leftExplain', d: 2.3 },
      { t: 47.3, name: 'openBoth', d: 2.2 }, //      closing
      { t: 51.1, name: 'invite', d: 1.6 }, //        "get in touch"
    ],

    // Optional plain-text transcript, shown to visitors for accessibility.
    transcript: '',
  },
};
