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
  setMorph,
} from '../../audio/lipsync';
import { findBone, lowerArms } from './avatarPose';
import { BONE_ORDER, buildPose, deltaQuaternion } from '../avatar/motion/proceduralPose';
import { createDirector } from '../avatar/motion/director';
import { createBlinkScheduler } from '../avatar/motion/blink';
import { loadClip } from '../avatar/motion/clips';

/**
 * Full-body animated assistant.
 *
 *  - entrance: runs in from the background and slows to a stop facing the visitor
 *  - idle: breathing, weight shift, head sway
 *  - speaking (while the intro audio plays): conversation stance, varied gestures,
 *    head movement. Stop / end of audio returns to idle within a fraction of a second.
 *
 * Body motion is procedural (see ../avatar/motion), applied on top of each bone's rest
 * rotation. Facial animation uses ONLY real morph targets in the GLB:
 *   Rhubarb timeline + visemes/ARKit  -> timeline lip-sync
 *   jaw / ARKit / visemes, no timeline -> approximate, audio-driven mouth
 *   no morph targets                  -> the mouth is not animated (reported via onCapabilities)
 * Blinking likewise needs eyeBlink morph targets; nothing is faked.
 */
export default function FullBodyAvatar({ config, audio, hasTimeline, onCapabilities, enableLook }) {
  const gltf = useGLTF(config.url, Boolean(config.draco));
  const root = useRef(); // positions the character (entrance travel + bob)
  const pointer = useThree((s) => s.pointer);

  const prepared = useMemo(() => {
    const scene = cloneSkinned(gltf.scene);
    scene.traverse((obj) => {
      if (obj.isSkinnedMesh) obj.frustumCulled = false; // posed bones leave the static bounds
    });
    scene.updateMatrixWorld(true);
    const pose = config.pose || {};
    if (pose.lowerArms !== false) lowerArms(scene, pose.armSpreadDeg ?? 18);
    scene.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(scene);
    const size = box.max.y - box.min.y;
    const valid = Number.isFinite(size) && size > 0.1;
    const scale = valid ? config.height / size : 1;
    return { scene, scale, y: valid ? -box.min.y * scale : 0 };
  }, [gltf.scene, config.height, config.pose]);

  const { scene } = prepared;
  const meshes = useMemo(() => collectMorphMeshes(scene), [scene]);
  const caps = useMemo(() => detectLipSync(meshes), [meshes]);

  // Rest rotations are captured AFTER the arms were lowered.
  const bones = useMemo(() => {
    const list = [];
    for (const name of BONE_ORDER) {
      const bone = findBone(scene, name);
      if (bone) list.push({ name, bone, rest: bone.quaternion.clone() });
    }
    return list;
  }, [scene]);

  const director = useMemo(() => createDirector(), []);
  const blinker = useMemo(() => createBlinkScheduler(), []);
  const weights = useRef({});

  // Optional real motion clips (assets.avatar.animations). When run + idle are both set and
  // load successfully they drive the body; otherwise the procedural motion is used.
  const clips = useRef(null);
  const anim = config.animations || {};
  const wantClips = Boolean(anim.run && anim.idle);
  const talkKey = (anim.talk || []).join('|');
  useEffect(() => {
    if (!wantClips) return undefined;
    let dead = false;
    const mixer = new THREE.AnimationMixer(scene);
    Promise.all([loadClip(anim.run), loadClip(anim.idle), ...(anim.talk || []).map(loadClip)])
      .then(([run, idle, ...talk]) => {
        if (dead) return;
        const make = (clip) => {
          const action = mixer.clipAction(clip);
          action.setEffectiveWeight(0);
          action.play();
          return action;
        };
        clips.current = { mixer, run: make(run), idle: make(idle), talk: talk.map(make), tw: talk.map(() => 0), idx: 0, last: 0 };
        if (onCapabilities) onCapabilities({ mode, blink: caps.blink.length > 0, bones: bones.length, clips: true });
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.warn('[avatar] motion clips unavailable, using procedural motion:', err);
      });
    return () => {
      dead = true;
      clips.current = null;
      mixer.stopAllAction();
      mixer.uncacheRoot(scene);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantClips, anim.run, anim.idle, talkKey, scene]);

  const mode = useMemo(() => {
    const canTimeline = hasTimeline && (caps.visemes.length > 0 || caps.arkitMouth.length > 0);
    if (canTimeline) return 'visemes';
    if (caps.jaw || caps.arkitMouth.length || caps.visemes.length) return 'amplitude';
    return 'none';
  }, [caps, hasTimeline]);

  useEffect(() => {
    if (onCapabilities) onCapabilities({ mode, blink: caps.blink.length > 0, bones: bones.length });
  }, [mode, caps, bones.length, onCapabilities]);

  const tmp = useMemo(
    () => ({
      parentQ: new THREE.Quaternion(),
      parentInv: new THREE.Quaternion(),
      rootInv: new THREE.Quaternion(),
      delta: new THREE.Quaternion(),
      out: new THREE.Quaternion(),
    }),
    [],
  );

  useFrame((state, dt) => {
    const a = audio.current;
    const speaking = Boolean(a.playing);
    const level = speaking ? a.getLevel() : 0;

    const step = director.update(dt, { speaking, level });
    const look = enableLook && !step.entering ? { yaw: pointer.x * 0.5, pitch: -pointer.y * 0.2 } : null;
    const { deltas, bob } = buildPose({
      t: state.clock.elapsedTime,
      runPhase: step.runPhase,
      runWeight: step.runWeight,
      speak: step.speak,
      level,
      gesture: step.gesture,
      look,
    });

    if (root.current) {
      root.current.position.set(0, bob * prepared.scale, step.z);
    }

    const c = clips.current;
    if (c) {
      // Motion-capture clips drive the body; the director supplies weights and root travel.
      const run = step.runWeight;
      const talkAvail = c.talk.length > 0;
      const talkW = talkAvail ? (1 - run) * step.speak : 0;
      c.run.setEffectiveWeight(run);
      c.run.timeScale = 0.7 + 0.3 * run;
      c.idle.setEffectiveWeight((1 - run) * (1 - (talkAvail ? step.speak : 0)));
      if (talkAvail) {
        const cur = c.talk[c.idx];
        // when the current talk clip loops, move on to the next one (varied movement)
        if (cur.time < c.last && c.talk.length > 1) c.idx = (c.idx + 1) % c.talk.length;
        c.last = c.talk[c.idx].time;
        c.talk.forEach((action, i) => {
          c.tw[i] = THREE.MathUtils.damp(c.tw[i], i === c.idx ? 1 : 0, 6, dt);
          action.setEffectiveWeight(talkW * c.tw[i]);
        });
      }
      c.mixer.update(dt);
    } else {
    // local' = parent^-1 * delta * parent * rest, with `parent` measured relative to the
    // avatar container so the delta is expressed in the character's own frame.
    scene.updateMatrixWorld(true);
    scene.getWorldQuaternion(tmp.rootInv).invert();
    for (const { name, bone, rest } of bones) {
      const d = deltas[name];
      bone.quaternion.copy(rest);
      if (!d) continue;
      bone.parent.getWorldQuaternion(tmp.parentQ).premultiply(tmp.rootInv);
      tmp.parentInv.copy(tmp.parentQ).invert();
      const [x, y, z, w] = deltaQuaternion(d);
      tmp.delta.set(x, y, z, w);
      tmp.out.copy(tmp.parentInv).multiply(tmp.delta).multiply(tmp.parentQ).multiply(rest);
      bone.quaternion.copy(tmp.out);
    }
    }

    // ---- face: real morph targets only ----
    if (!meshes.length) return;
    const w = weights.current;
    const target = {};

    if (mode === 'visemes' && a.cues) {
      const cue = speaking ? cueAt(a.cues, a.getTime()) : null;
      const letter = cue ? cue.value : 'X';
      if (caps.arkitMouth.length) Object.assign(target, RHUBARB_TO_ARKIT[letter] || {});
      else {
        const key = RHUBARB_TO_VISEME[letter];
        if (key && key !== 'viseme_sil') target[key] = 0.85;
      }
    } else if (mode === 'amplitude' && speaking) {
      const shape = estimateMouthShape({ level, ...a.getBands() });
      if (caps.jaw) target[caps.jaw] = shape.open * 0.8;
      else if (caps.visemes.includes('viseme_aa')) target.viseme_aa = shape.open * 0.8;
      if (caps.arkitMouth.includes('mouthFunnel')) target.mouthFunnel = shape.round * 0.6;
      if (caps.arkitMouth.includes('mouthSmileLeft')) {
        target.mouthSmileLeft = shape.wide * 0.4;
        target.mouthSmileRight = shape.wide * 0.4;
      }
    }

    const keys = new Set([...Object.keys(w), ...Object.keys(target)]);
    for (const key of keys) {
      w[key] = THREE.MathUtils.damp(w[key] ?? 0, target[key] ?? 0, speaking ? 22 : 30, dt);
      setMorph(meshes, key, w[key]);
    }

    if (caps.blink.length) {
      const closure = blinker.update(dt);
      for (const key of caps.blink) setMorph(meshes, key, closure);
    }
  });

  const [ox = 0, oy = 0, oz = 0] = config.offset || [];

  return (
    <group ref={root} position={[0, 0, -9]}>
      <group position={[ox, prepared.y + oy, oz]} rotation={[0, config.rotationY || 0, 0]} scale={prepared.scale}>
        <primitive object={scene} />
      </group>
    </group>
  );
}
