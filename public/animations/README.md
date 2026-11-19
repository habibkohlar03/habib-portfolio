# Motion clips (optional)

Put real motion-capture clips here and list them in `src/data/assets.js` -> `avatar.animations`.

1. Go to mixamo.com (free Adobe login), pick your character or upload `avatar.glb`.
2. Download these as **FBX, "Without Skin"**: a **Running** clip with **In Place** ticked, an **Idle** clip, and (optional) one or more **Talking** / gesture clips.
3. Save them as `run.fbx`, `idle.fbx`, `talk1.fbx`... in this folder and set:

```js
animations: { run: '/animations/run.fbx', idle: '/animations/idle.fbx', talk: ['/animations/talk1.fbx'] }
```

Run and idle must both be set. If a clip fails to load, the site falls back to the built-in procedural motion (a warning appears in the browser console).
Not yet tested with a real clip: check that limbs are not twisted on your model.
