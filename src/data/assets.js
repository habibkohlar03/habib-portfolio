// External asset slots. The site works without any of these.
//
// To go live with each asset: put the file in /public, then flip `enabled`
// to true. Detection is explicit on purpose: static hosts often answer a
// missing file with index.html (HTTP 200), so "does the file exist?" checks
// are unreliable.

export const assets = {
  avatar: {
    enabled: false, // set true after adding /public/models/avatar.glb
    url: '/models/avatar.glb',
    // Target standing height in scene units. The model is auto-scaled to this.
    height: 1.75,
  },

  voice: {
    enabled: false, // set true after adding /public/audio/intro.mp3
    url: '/audio/intro.mp3',
    // Optional Rhubarb Lip Sync JSON ({ "mouthCues": [...] }) for accurate
    // visemes. Leave null to use audio-amplitude jaw movement instead.
    visemeTimeline: null, // e.g. '/audio/intro.visemes.json'
    // Optional plain-text transcript, shown to visitors for accessibility.
    transcript: '',
  },
};
