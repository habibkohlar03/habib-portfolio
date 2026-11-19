import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import {
  RHUBARB_TO_ARKIT,
  RHUBARB_TO_VISEME,
  collectMorphMeshes,
  cueAt,
  detectLipSync,
  estimateMouthShape,
  morphNames,
  setMorph,
} from '../../audio/lipsync';
import { lowerArms } from './avatarPose';
import { createBlinkScheduler } from '../avatar/motion/blink';

/**
 * Full-body avatar (Avaturn T2 model).
 *
 * Body
 *   - only the GLB's own standing-idle clip moves the body. No code-driven movement
 *     (no entrance run, gestures, speaking stance or bone posing).
 *   - if a model has no clip, the arms are lowered once from the T-pose and it stands still
 * Face (only real morph targets of the GLB are driven)
 *   - mouth: Rhubarb-format timeline -> viseme_* targets (or ARKit mouth shapes), or the voice spectrum
 *   - blinking, small eye saccades, gaze toward the cursor, brows and a light smile
 */
export default function FullBodyAvatar({ config, audio, hasTimeline, onCapabilities, enableLook }) {
  const gltf = useGLTF(config.url, Boolean(config.draco));
  const root = useRef();
  const pointer = useThree((s) => s.pointer);

  const embeddedClip = config.useEmbeddedIdle !== false && gltf.animations && gltf.animations.length ? gltf.animations[0] : null;
  const clipIdle = Boolean(embeddedClip);

  const prepared = useMemo(() => {
    const scene = cloneSkinned(gltf.scene);
    scene.traverse((obj) => {
      if (obj.isSkinnedMesh) obj.frustumCulled = false; // posed bones leave the static bounds
      if (obj.isMesh && obj.material && obj.material.map) obj.material.map.anisotropy = 4;
    });
    scene.updateMatrixWorld(true);
    const pose = config.pose || {};
    if (!clipIdle && pose.lowerArms !== false) lowerArms(scene, pose.armSpreadDeg ?? 18);
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
  // eyeBlinkLeft/Right when present; `eyesClosed` only as a fallback (using both would double-close the lids)
  const blinkKeys = useMemo(() => {
    const pair = caps.blink.filter((k) => k !== 'eyesClosed');
    return pair.length ? pair : caps.blink;
  }, [caps]);

  const blinker = useMemo(() => createBlinkScheduler(), []);
  const weights = useRef({});
  const gaze = useRef({ x: 0, y: 0, tx: 0, ty: 0, next: 1.5 });
  const level = useRef({ env: 0 });

  const mode = useMemo(() => {
    const canTimeline = hasTimeline && (caps.visemes.length > 0 || caps.arkitMouth.length > 0);
    if (canTimeline) return 'visemes';
    if (caps.jaw || caps.arkitMouth.length || caps.visemes.length) return 'amplitude';
    return 'none';
  }, [caps, hasTimeline]);

  useEffect(() => {
    if (onCapabilities) onCapabilities({ mode, blink: caps.blink.length > 0, idleClip: clipIdle });
  }, [mode, caps, clipIdle, onCapabilities]);

  // ---- idle clip embedded in the GLB (drives the standing pose) ----
  const idleMixer = useRef(null);
  useEffect(() => {
    if (!clipIdle) return undefined;
    const mixer = new THREE.AnimationMixer(scene);
    const action = mixer.clipAction(embeddedClip);
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.play();
    idleMixer.current = mixer;
    return () => {
      idleMixer.current = null;
      mixer.stopAllAction();
      mixer.uncacheRoot(scene);
    };
  }, [clipIdle, embeddedClip, scene]);

  // ---- free GPU/CPU memory when the avatar is removed ----
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
    const a = audio.current;
    const speaking = Boolean(a.playing);
    const loud = speaking ? a.getLevel() : 0;
    level.current.env = THREE.MathUtils.damp(level.current.env, loud, loud > level.current.env ? 18 : 6, dt);

    const look = enableLook ? { yaw: pointer.x, pitch: pointer.y } : null;

    // The only body movement: the GLB's own idle clip.
    if (idleMixer.current) idleMixer.current.update(dt);

    // ---- face: real morph targets only ----
    if (!meshes.length) return;
    const w = weights.current;
    const target = {};
    const put = (key, value) => {
      if (available.has(key)) target[key] = Math.min(1, Math.max(target[key] || 0, value));
    };

    // mouth
    if (mode === 'visemes' && a.cues) {
      const cue = speaking ? cueAt(a.cues, a.getTime()) : null;
      const letter = cue ? cue.value : 'X';
      if (caps.visemes.length) {
        const key = RHUBARB_TO_VISEME[letter];
        if (key && key !== 'viseme_sil') put(key, 0.9);
      } else {
        for (const [key, value] of Object.entries(RHUBARB_TO_ARKIT[letter] || {})) put(key, value);
      }
    } else if (mode === 'amplitude' && speaking) {
      const shape = estimateMouthShape({ level: loud, ...a.getBands() });
      if (caps.jaw) put(caps.jaw, shape.open * 0.8);
      else put('viseme_aa', shape.open * 0.8);
      put('mouthFunnel', shape.round * 0.6);
      put('mouthSmileLeft', shape.wide * 0.4);
      put('mouthSmileRight', shape.wide * 0.4);
    }

    // expression: a friendly resting smile; brows lift on emphasis while speaking
    const env = level.current.env;
    const speakW = speaking ? 1 : 0;
    put('mouthSmileLeft', 0.1 + 0.08 * speakW);
    put('mouthSmileRight', 0.1 + 0.08 * speakW);
    put('browInnerUp', speakW * (0.1 + 0.9 * Math.min(1, env * 2.2)) * 0.35);
    put('browOuterUpLeft', speakW * Math.min(1, env * 2.2) * 0.22);
    put('browOuterUpRight', speakW * Math.min(1, env * 2.2) * 0.22);
    put('cheekSquintLeft', speakW * 0.12);
    put('cheekSquintRight', speakW * 0.12);

    // eyes: slow saccades, mostly back to the visitor; follow the cursor on the high tier
    const g = gaze.current;
    g.next -= dt;
    if (g.next <= 0) {
      const away = Math.random() < (speaking ? 0.4 : 0.3);
      g.tx = away ? (Math.random() - 0.5) * 0.7 : 0;
      g.ty = away ? (Math.random() - 0.5) * 0.35 : 0;
      g.next = away ? 0.5 + Math.random() * 0.9 : 1.6 + Math.random() * 2.6;
    }
    const gx = THREE.MathUtils.clamp(g.tx + (look && !speaking ? pointer.x * 0.5 : 0), -1, 1);
    const gy = THREE.MathUtils.clamp(g.ty + (look && !speaking ? pointer.y * 0.3 : 0), -1, 1);
    g.x = THREE.MathUtils.damp(g.x, gx, 14, dt);
    g.y = THREE.MathUtils.damp(g.y, gy, 14, dt);
    // looking toward the character's left (+x): left eye outward, right eye inward
    if (g.x > 0) { put('eyeLookOutLeft', g.x); put('eyeLookInRight', g.x); }
    else { put('eyeLookInLeft', -g.x); put('eyeLookOutRight', -g.x); }
    if (g.y > 0) { put('eyeLookUpLeft', g.y); put('eyeLookUpRight', g.y); }
    else { put('eyeLookDownLeft', -g.y); put('eyeLookDownRight', -g.y); }

    // blinking
    if (blinkKeys.length) {
      const closure = blinker.update(dt);
      for (const key of blinkKeys) put(key, closure);
    }

    // ease every weight toward its target (fast release when speech stops: neutral face)
    for (const key of new Set([...Object.keys(w), ...Object.keys(target)])) {
      const isBlink = key.startsWith('eyeBlink') || key === 'eyesClosed';
      // the blink scheduler already shapes the eyelid curve; everything else is eased
      w[key] = isBlink ? target[key] || 0 : THREE.MathUtils.damp(w[key] ?? 0, target[key] ?? 0, speaking ? 24 : 30, dt);
      setMorph(meshes, key, w[key]);
    }
  });

  const [ox = 0, oy = 0, oz = 0] = config.offset || [];

  return (
    <group ref={root}>
      <group position={[ox, prepared.y + oy, oz]} rotation={[0, config.rotationY || 0, 0]} scale={prepared.scale}>
        <primitive object={scene} />
      </group>
    </group>
  );
}
