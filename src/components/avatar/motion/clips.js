import * as THREE from 'three';

// Loads one animation clip (Mixamo FBX or glTF/GLB) and retargets it onto a rig whose
// bones are named Hips, Spine, LeftArm ... (the Avaturn / Mixamo naming without prefix).
//   - strips the "mixamorig" prefix from track names
//   - keeps rotation tracks only (position tracks carry the source rig's size and
//     root motion, which would shift or scale the character; the page moves the root itself)
// Use Mixamo's "In Place" option for run clips, so the page controls the travel.
// three.js loaders are imported on demand so they never load unless clips are configured.
const stripPrefix = (name) => name.replace(/^mixamorig[:_]?/, '');

export async function loadClip(url) {
  let animations;
  if (/\.fbx(\?|$)/i.test(url)) {
    const { FBXLoader } = await import('three/examples/jsm/loaders/FBXLoader.js');
    animations = (await new FBXLoader().loadAsync(url)).animations;
  } else {
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
    animations = (await new GLTFLoader().loadAsync(url)).animations;
  }
  const clip = animations && animations[0];
  if (!clip) throw new Error(`No animation found in ${url}`);
  const tracks = clip.tracks
    .filter((t) => t.name.endsWith('.quaternion'))
    .map((t) => {
      const copy = t.clone();
      copy.name = stripPrefix(t.name);
      return copy;
    });
  return new THREE.AnimationClip(clip.name, clip.duration, tracks);
}
