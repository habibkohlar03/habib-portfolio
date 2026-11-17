import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useAnimations, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { RHUBARB_TO_VISEME, collectMorphMeshes, cueAt, detectLipSync, setMorph } from '../../audio/lipsync';
import { findBone, lowerArms } from './avatarPose';

/**
 * Loads the visitor-facing avatar from a GLB file.
 *
 * - Auto-scales to `config.height` and stands the model on the platform.
 * - Lowers a T-pose into a relaxed standing pose (see avatarPose.js).
 * - Plays an idle clip if the file contains one. Otherwise it adds subtle
 *   breathing, head sway and, while the voice plays, a light head nod. All of
 *   it is composed ON TOP of each bone's rest rotation.
 * - Lip-sync is driven ONLY by real morph targets in the file:
 *     visemes + timeline  -> accurate viseme animation
 *     jawOpen / mouthOpen -> audio-loudness-driven jaw
 *     neither             -> no mouth animation (reported via onCapabilities)
 *   The current Avaturn export has no morph targets, so it falls in the last
 *   group: the body moves, the mouth does not.
 */
export default function GlbAvatar({ config, audio, hasTimeline, onCapabilities }) {
  const gltf = useGLTF(config.url, Boolean(config.draco));
  const group = useRef();
  const weights = useRef({});
  const speakAmount = useRef(0);

  // Own copy of the scene (safe if the component mounts twice) with the pose applied.
  const prepared = useMemo(() => {
    const scene = cloneSkinned(gltf.scene);
    scene.traverse((obj) => {
      // Posed/animated bones can leave the static bounding sphere; never cull the avatar.
      if (obj.isSkinnedMesh) obj.frustumCulled = false;
    });
    scene.updateMatrixWorld(true);

    const pose = config.pose || {};
    const lowered = pose.lowerArms === false ? 0 : lowerArms(scene, pose.armSpreadDeg ?? 18);

    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.max.y - box.min.y;
    const valid = Number.isFinite(size) && size > 0.1;
    const scale = valid ? config.height / size : 1;
    const y = valid ? -box.min.y * scale : 0;
    return { scene, scale, y, lowered };
  }, [gltf.scene, config.height, config.pose]);

  const { scene } = prepared;
  const { actions, names } = useAnimations(gltf.animations, group);
  const meshes = useMemo(() => collectMorphMeshes(scene), [scene]);
  const caps = useMemo(() => detectLipSync(meshes), [meshes]);

  // Bones we nudge procedurally, with their rest rotations remembered.
  const bones = useMemo(() => {
    const entries = {};
    for (const key of ['Head', 'Neck', 'Spine2']) {
      const bone = findBone(scene, key);
      if (bone) entries[key] = { bone, rest: bone.quaternion.clone() };
    }
    return entries;
  }, [scene]);

  // Tell the page what this avatar can really do.
  useEffect(() => {
    if (!onCapabilities) return;
    if (caps.visemes.length && hasTimeline) onCapabilities({ mode: 'visemes' });
    else if (caps.jaw || caps.visemes.includes('viseme_aa')) onCapabilities({ mode: 'amplitude' });
    else onCapabilities({ mode: 'none' });
  }, [caps, hasTimeline, onCapabilities]);

  // Idle clip, if the file ships one.
  useEffect(() => {
    const name = names.find((n) => /idle/i.test(n)) ?? names[0];
    const action = name ? actions[name] : null;
    if (!action) return undefined;
    action.reset().fadeIn(0.4).play();
    return () => {
      action.fadeOut(0.2);
    };
  }, [actions, names]);

  const tmpQ = useMemo(() => new THREE.Quaternion(), []);
  const tmpE = useMemo(() => new THREE.Euler(), []);
  const nudge = (entry, pitch, yaw) => {
    if (!entry) return;
    tmpE.set(pitch, yaw, 0);
    entry.bone.quaternion.copy(entry.rest).multiply(tmpQ.setFromEuler(tmpE));
  };

  useFrame((state, dt) => {
    const a = audio.current;
    const t = state.clock.elapsedTime;
    const speaking = a.playing;
    const level = speaking ? a.getLevel() : 0;
    const w = weights.current;

    // Procedural body motion, only when the file has no animation clips of its own.
    if (names.length === 0) {
      speakAmount.current = THREE.MathUtils.damp(speakAmount.current, speaking ? 1 : 0, 4, dt);
      const s = speakAmount.current;
      nudge(bones.Spine2, Math.sin(t * 1.5) * 0.012 + level * 0.01, 0);
      nudge(bones.Neck, Math.sin(t * 0.8) * 0.01, Math.sin(t * 0.45) * 0.03);
      nudge(
        bones.Head,
        Math.sin(t * 0.7) * 0.015 + s * Math.sin(t * 4.2) * 0.035 * (0.5 + level),
        Math.sin(t * 0.5) * 0.05 + s * Math.sin(t * 1.7) * 0.05,
      );
    }

    if (!meshes.length) return;

    if (caps.visemes.length && a.cues) {
      // Accurate mode: follow the Rhubarb timeline.
      const cue = speaking ? cueAt(a.cues, a.getTime()) : null;
      const active = cue ? RHUBARB_TO_VISEME[cue.value] : 'viseme_sil';
      for (const key of caps.visemes) {
        const target = key === active && key !== 'viseme_sil' ? 0.85 : 0;
        w[key] = THREE.MathUtils.damp(w[key] ?? 0, target, 22, dt);
        setMorph(meshes, key, w[key]);
      }
    } else {
      // Fallback: open the jaw with audio loudness.
      const key = caps.jaw ?? (caps.visemes.includes('viseme_aa') ? 'viseme_aa' : null);
      if (!key) return;
      const target = Math.min(1, level * 1.6) * 0.8;
      w[key] = THREE.MathUtils.damp(w[key] ?? 0, target, 18, dt);
      setMorph(meshes, key, w[key]);
    }
  });

  const [ox = 0, oy = 0, oz = 0] = config.offset || [];

  return (
    <group
      ref={group}
      position={[ox, prepared.y + oy, oz]}
      rotation={[0, config.rotationY || 0, 0]}
      scale={prepared.scale}
    >
      <primitive object={scene} />
    </group>
  );
}
