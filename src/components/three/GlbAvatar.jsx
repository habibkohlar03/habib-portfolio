import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useAnimations, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { RHUBARB_TO_VISEME, collectMorphMeshes, cueAt, detectLipSync, setMorph } from '../../audio/lipsync';

/**
 * Loads the visitor-facing avatar from a GLB file.
 *
 * - Auto-scales to `height` and stands the model on the platform.
 * - Plays an idle animation clip if the file contains one.
 * - Lip-sync is driven ONLY by real morph targets in the file:
 *     visemes + timeline  -> accurate viseme animation
 *     jawOpen / mouthOpen -> audio-loudness-driven jaw
 *     neither             -> no mouth animation (reported via onCapabilities)
 */
export default function GlbAvatar({ url, height = 1.75, audio, hasTimeline, onCapabilities }) {
  const gltf = useGLTF(url);
  const scene = useMemo(() => cloneSkinned(gltf.scene), [gltf.scene]);
  const group = useRef();
  const weights = useRef({});

  const { actions, names } = useAnimations(gltf.animations, group);
  const meshes = useMemo(() => collectMorphMeshes(scene), [scene]);
  const caps = useMemo(() => detectLipSync(meshes), [meshes]);
  const headBone = useMemo(() => scene.getObjectByName('Head') ?? null, [scene]);

  const fit = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.max.y - box.min.y || 1;
    const scale = height / size;
    return { scale, y: -box.min.y * scale };
  }, [scene, height]);

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

  useFrame((state, dt) => {
    const a = audio.current;
    const t = state.clock.elapsedTime;
    const speaking = a.playing;
    const w = weights.current;

    // Subtle head motion only when the file has no animation clips of its own.
    if (headBone && names.length === 0) {
      headBone.rotation.y = Math.sin(t * 0.5) * 0.06;
      headBone.rotation.x = speaking ? Math.sin(t * 4.2) * 0.03 : 0;
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
      const level = speaking ? a.getLevel() : 0;
      const target = Math.min(1, level * 1.6) * 0.8;
      w[key] = THREE.MathUtils.damp(w[key] ?? 0, target, 18, dt);
      setMorph(meshes, key, w[key]);
    }
  });

  return (
    <group ref={group} position={[0, fit.y, 0]} scale={fit.scale}>
      <primitive object={scene} />
    </group>
  );
}
