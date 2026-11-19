# Avatar animation

The avatar plays the Avaturn clip embedded in `public/models/avatar.glb` (`avaturn_animation`, 8 s, a natural standing idle).
It is the same clip that is in your original T2 export. No separate animation file is needed, and nothing runs, walks or
gestures procedurally. To use a different Avaturn animation, re-export the avatar from Avaturn with that animation and
replace `public/models/avatar.glb` (run `node tools/optimize-glb.mjs original.glb avatar.glb`).
