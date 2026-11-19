# 3D avatar

`avatar.glb` is the Avaturn **T2** model, optimized for the web (14 MB original -> 3.3 MB; about 2.3 MB gzipped).

It contains a 54-joint skeleton (including eye bones), the face rig (all 15 `viseme_*` targets, ARKit shapes such as
`jawOpen`, `eyeBlinkLeft/Right`, `eyeLook*`, `brow*`, `mouthSmile*`), and one standing-idle clip (`avaturn_animation`).

How it was made: `node tools/optimize-glb.mjs original.glb avatar.glb` (needs the `sharp` package). It stores the face
morph data as sparse deltas, drops 16 ARKit shapes the site never drives, downsizes textures and removes the hips
translation / morph-weight tracks from the idle clip. Face colour and normal maps keep full resolution.

The previous model is kept in `backup/models/avatar-v1-original.glb` (outside `public`, so it is not deployed).
