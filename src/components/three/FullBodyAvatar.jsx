import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { RHUBARB_TO_ARKIT, RHUBARB_TO_VISEME, collectMorphMeshes, cueAt, detectLipSync, estimateMouthShape, morphNames, setMorph } from '../../audio/lipsync';
import { lowerArms } from './avatarPose';
import { createBlinkScheduler } from '../avatar/motion/blink';

/**
 * Full-body Avaturn T2 avatar.
 *
 * Body: ONLY the avatar's own embedded Avaturn clip (`avaturn_animation`, a natural standing idle,
 *       rotation tracks) plays in a loop. No procedural running, no entrance run, no scripted gestures.
 *       The avatar simply stands on the platform.
 * Face: only real morph targets of the GLB are driven.
 *   - mouth: Rhubarb-format cues read against the AUDIO ELEMENT'S currentTime (the playback clock),
 *            Oculus viseme_* targets plus a little jawOpen; cross-faded between shapes
 *   - blinking, small eye movement, light brows; mouth and expression weights return to 0 when
 *     speech stops or Stop is pressed
 */

// How strongly each Rhubarb shape drives its viseme, and how much jawOpen accompanies it.
const SHAPE = {
  A: { gain: 0.95, jaw: 0 }, // P B M: lips closed
  B: { gain: 0.7, jaw: 0.08 }, // K S T: teeth close, slightly open
  C: { gain: 0.8, jaw: 0.18 }, // EH
  D: { gain: 0.9, jaw: 0.3 }, // AA: widest
  E: { gain: 0.85, jaw: 0.16 }, // AO ER
  F: { gain: 0.9, jaw: 0.08 }, // UW OW W
  G: { gain: 0.9, jaw: 0.05 }, // F V
  H: { gain: 0.65, jaw: 0.1 }, // L
  X: { gain: 0, jaw: 0 }, // rest / pause
};
const LEAD = 0.04; // seconds: the mouth shape starts slightly before the sound (lips move first)

export default function FullBodyAvatar({ config, audio, hasTimeline, onCapabilities, enableLook }) {
  const gltf = useGLTF(config.url, Boolean(config.draco));
  const root = useRef();
  const pointer = useThree((s) => s.pointer);

  const embeddedClip = config.useEmbeddedIdle !== false && gltf.animations && gltf.animations.length ? gltf.animations[0] : null;
  const clipIdle = Boolean(embeddedClip);

  const prepared = useMemo(() => {
    const scene = cloneSkinned(gltf.scene);
    scene.traverse((obj) => {
      if (obj.isSkinnedMesh) obj.frustumCulled = false;
      if (obj.isMesh && obj.material && obj.material.map) obj.material.map.anisotropy = 4;
    });
    scene.updateMatrixWorld(true);
    const pose = config.pose || {};
    if (!clipIdle && pose.lowerArms !== false) lowerArms(scene, pose.armSpreadDeg ?? 18); // only for a model without a clip
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.max.y - box.min.y;
    const valid = Number.isFinite(size) && size > 0.1;
    const scale = valid ? config.height / size : 1;
    return { scene, scale, y: valid ? -box.min.y * scale : 0 };
  }, [gltf.scene, config.height, config.pose, clipIdle]);

  const { scene } = prepared;
  const meshes = useMemo(() => collectMorphMeshes(scene), [scene]);
  const caps = useMemo(() => detectLipSync(meshes), [meshes]);
  const available = useMemo(() => morphNames(meshes), [meshes]);
  const blinkKeys = useMemo(() => {
    const pair = caps.blink.filter((k) => k !== 'eyesClosed');
    return pair.length ? pair : caps.blink;
  }, [caps]);

  const blinker = useMemo(() => createBlinkScheduler(), []);
  const weights = useRef({});
  const gaze = useRef({ x: 0, y: 0, tx: 0, ty: 0, next: 1.5 });

  const mode = useMemo(() => {
    if (hasTimeline && (caps.visemes.length > 0 || caps.arkitMouth.length > 0)) return 'visemes';
    if (caps.jaw || caps.arkitMouth.length || caps.visemes.length) return 'amplitude';
    return 'none';
  }, [caps, hasTimeline]);

  useEffect(() => {
    if (onCapabilities) onCapabilities({ mode, blink: caps.blink.length > 0, idleClip: clipIdle });
  }, [mode, caps, clipIdle, onCapabilities]);

  // The avatar's own Avaturn clip, looping.
  const mixer = useRef(null);
  useEffect(() => {
    if (!clipIdle) return undefined;
    const m = new THREE.AnimationMixer(scene);
    const action = m.clipAction(embeddedClip);
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.play();
    mixer.current = m;
    return () => {
      mixer.current = null;
      m.stopAllAction();
      m.uncacheRoot(scene);
    };
  }, [clipIdle, embeddedClip, scene]);

  // Free GPU/CPU memory when the avatar is removed.
  useEffect(
    () => () => {
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        const mats = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : [];
        for (const m of mats) {
          for (const v of Object.values(m)) if (v && v.isTexture) v.dispose();
          m.dispose();
        }
      });
      useGLTF.clear(config.url);
    },
    [scene, config.url],
  );

  useFrame((state, dt) => {
    const step = Math.min(dt, 0.05);
    if (mixer.current) mixer.current.update(step);

    if (!meshes.length) return;
    const a = audio.current;
    const speaking = Boolean(a.playing);
    const loud = speaking ? a.getLevel() : 0;
    const w = weights.current;
    const target = {};
    const put = (key, value) => {
      if (available.has(key)) target[key] = Math.min(1, Math.max(target[key] || 0, value));
    };

    // ---- mouth: driven by the audio playback clock ----
    if (mode === 'visemes' && a.cues && speaking) {
      const cue = cueAt(a.cues, a.getTime() + LEAD);
      const letter = cue && SHAPE[cue.value] ? cue.value : 'X';
      const shape = SHAPE[letter];
      if (letter !== 'X') {
        if (caps.visemes.length) {
          const key = RHUBARB_TO_VISEME[letter];
          if (key) put(key, shape.gain);
          if (shape.jaw) put('jawOpen', shape.jaw);
        } else {
          for (const [key, value] of Object.entries(RHUBARB_TO_ARKIT[letter] || {})) put(key, value);
        }
      }
    } else if (mode === 'amplitude' && speaking) {
      const s = estimateMouthShape({ level: loud, ...a.getBands() });
      if (caps.jaw) put(caps.jaw, s.open * 0.8);
    }

    // ---- face: friendly resting smile, light brows while speaking ----
    put('mouthSmileLeft', 0.08);
    put('mouthSmileRight', 0.08);
    if (speaking) {
      const e = Math.min(1, loud * 2.2);
      put('browInnerUp', 0.08 + 0.2 * e);
    }

    // ---- eyes: slow, small saccades; follow the cursor on the high tier when not speaking ----
    const g = gaze.current;
    g.next -= step;
    if (g.next <= 0) {
      const away = Math.random() < 0.25;
      g.tx = away ? (Math.random() - 0.5) * 0.4 : 0;
      g.ty = away ? (Math.random() - 0.5) * 0.2 : 0;
      g.next = away ? 0.6 + Math.random() * 0.8 : 1.8 + Math.random() * 2.6;
    }
    const look = enableLook && !speaking;
    const gx = THREE.MathUtils.clamp(g.tx + (look ? pointer.x * 0.4 : 0), -1, 1);
    const gy = THREE.MathUtils.clamp(g.ty + (look ? pointer.y * 0.25 : 0), -1, 1);
    g.x = THREE.MathUtils.damp(g.x, gx, 12, step);
    g.y = THREE.MathUtils.damp(g.y, gy, 12, step);
    if (g.x > 0) { put('eyeLookOutLeft', g.x); put('eyeLookInRight', g.x); }
    else { put('eyeLookInLeft', -g.x); put('eyeLookOutRight', -g.x); }
    if (g.y > 0) { put('eyeLookUpLeft', g.y); put('eyeLookUpRight', g.y); }
    else { put('eyeLookDownLeft', -g.y); put('eyeLookDownRight', -g.y); }

    // ---- blinking (eyelids only: never touches mouth targets) ----
    if (blinkKeys.length) {
      const closure = blinker.update(step);
      for (const key of blinkKeys) put(key, closure);
    }

    // ---- ease: quick attack, quick release; everything returns to 0 when not speaking ----
    for (const key of new Set([...Object.keys(w), ...Object.keys(target)])) {
      const isBlink = key.startsWith('eyeBlink') || key === 'eyesClosed';
      const goal = target[key] ?? 0;
      const rate = goal > (w[key] ?? 0) ? 34 : 26;
      w[key] = isBlink ? goal : THREE.MathUtils.damp(w[key] ?? 0, goal, rate, step);
      if (w[key] < 0.002 && goal === 0) w[key] = 0;
      setMorph(meshes, key, w[key]);
    }
  });

  const [ox = 0, oy = 0, oz = 0] = config.offset || [];
  return (
    <group ref={root} position={[0, 0, 0]}>
      <group position={[ox, prepared.y + oy, oz]} rotation={[0, config.rotationY || 0, 0]} scale={prepared.scale}>
        <primitive object={scene} />
      </group>
    </group>
  );
}
