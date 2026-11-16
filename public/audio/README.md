# Voice introduction slot

Drop your recording here as `intro.mp3`, then set `assets.voice.enabled = true`
in `src/data/assets.js`. Optional: `intro.visemes.json` (Rhubarb Lip Sync
output) for accurate lip-sync. Keep files on this same origin (not a
cross-origin CDN) so the audio analyser can read them.
