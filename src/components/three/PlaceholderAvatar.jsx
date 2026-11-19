import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Stylized mannequin shown until a real GLB is supplied.
 * It is NOT a likeness and has no face, so it makes NO lip-sync claim.
 * While the voice intro plays it only does a gentle head nod and arm gesture,
 * and a halo ring reacts to audio loudness.
 */
export default function PlaceholderAvatar({ audio }) {
  const root = useRef();
  const head = useRef();
  const arm = useRef();
  const torso = useRef();
  const halo = useRef();

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const a = audio.current;
    const speaking = a.playing;
    const level = speaking ? a.getLevel() : 0;

    if (torso.current) torso.current.scale.y = 1 + Math.sin(t * 1.6) * 0.008;
    if (head.current) {
      const nod = speaking ? Math.sin(t * 5) * 0.05 * (0.4 + level) : 0;
      head.current.rotation.x = THREE.MathUtils.damp(head.current.rotation.x, nod, 8, dt);
      head.current.rotation.y = Math.sin(t * 0.5) * 0.08;
    }
    if (arm.current) {
      const target = speaking ? -0.55 + Math.sin(t * 2.4) * 0.18 : 0;
      arm.current.rotation.z = THREE.MathUtils.damp(arm.current.rotation.z, target, 6, dt);
    }
    if (halo.current) {
      const target = speaking ? 0.9 + level * 3 : 0.35;
      halo.current.material.emissiveIntensity = THREE.MathUtils.damp(halo.current.material.emissiveIntensity, target, 8, dt);
    }
  });

  const body = { color: '#8a8f99', metalness: 0.3, roughness: 0.5 };

  return (
    <group ref={root}>
      {/* legs */}
      <mesh position={[-0.12, 0.46, 0]}>
        <capsuleGeometry args={[0.09, 0.7, 4, 12]} />
        <meshStandardMaterial {...body} />
      </mesh>
      <mesh position={[0.12, 0.46, 0]}>
        <capsuleGeometry args={[0.09, 0.7, 4, 12]} />
        <meshStandardMaterial {...body} />
      </mesh>

      {/* torso */}
      <mesh ref={torso} position={[0, 1.17, 0]} scale={[1.15, 1, 0.7]}>
        <capsuleGeometry args={[0.2, 0.42, 4, 16]} />
        <meshStandardMaterial {...body} />
      </mesh>

      {/* chest light */}
      <mesh position={[0, 1.2, 0.15]}>
        <circleGeometry args={[0.035, 24]} />
        <meshStandardMaterial color="#ff6a00" emissive="#ff6a00" emissiveIntensity={2} />
      </mesh>

      {/* neck + head */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.06, 0.07, 0.12, 16]} />
        <meshStandardMaterial {...body} />
      </mesh>
      <group ref={head} position={[0, 1.68, 0]}>
        <mesh>
          <sphereGeometry args={[0.15, 32, 24]} />
          <meshStandardMaterial {...body} />
        </mesh>
        {/* visor line */}
        <mesh position={[0, 0.01, 0.135]}>
          <boxGeometry args={[0.17, 0.018, 0.02]} />
          <meshStandardMaterial color="#ff9a4d" emissive="#ff9a4d" emissiveIntensity={1.6} />
        </mesh>
      </group>

      {/* left arm (static) */}
      <group position={[-0.3, 1.38, 0]} rotation={[0, 0, -0.1]}>
        <mesh position={[0, -0.28, 0]}>
          <capsuleGeometry args={[0.06, 0.46, 4, 12]} />
          <meshStandardMaterial {...body} />
        </mesh>
      </group>

      {/* right arm (gestures while speaking) */}
      <group ref={arm} position={[0.3, 1.38, 0]} rotation={[0, 0, 0.1]}>
        <mesh position={[0, -0.28, 0]}>
          <capsuleGeometry args={[0.06, 0.46, 4, 12]} />
          <meshStandardMaterial {...body} />
        </mesh>
      </group>

      {/* audio-reactive halo */}
      <mesh ref={halo} position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.62, 0.008, 8, 96]} />
        <meshStandardMaterial color="#ff6a00" emissive="#ff6a00" emissiveIntensity={0.35} />
      </mesh>
    </group>
  );
}
