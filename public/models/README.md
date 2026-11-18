# 3D avatar

`avatar.glb` is the Avaturn export shown full-body in the hero (see `src/data/assets.js`).
It has a skeleton but no blendshapes, so the mouth and eyes cannot animate. To enable
lip-sync and blinking, replace it with an export that includes ARKit or `viseme_*`
morph targets. See the main README.
