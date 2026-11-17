import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Platform, rings, lights and (desktop only) a few drifting particles.
export default function StudioStage({ quality, audio }) {
  const ring = useRef();
  const dust = useRef();

  const positions = useMemo(() => {
    if (quality !== 'high') return null;
    const count = 120;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.0 + Math.random() * 1.2;
      arr[i * 3] = Math.cos(angle) * radius;
      arr[i * 3 + 1] = Math.random() * 2.4;
      arr[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return arr;
  }, [quality]);

  useFrame((state, dt) => {
    const a = audio.current;
    if (ring.current) {
      const target = a.playing ? 1.2 + a.getLevel() * 2.5 : 0.7;
      ring.current.material.emissiveIntensity = THREE.MathUtils.damp(ring.current.material.emissiveIntensity, target, 6, dt);
    }
    if (dust.current) dust.current.rotation.y += dt * 0.05;
  });

  return (
    <>
      {/* lighting: warm key, cyan rim, cool fill */}
      <ambientLight intensity={0.35} />
      <hemisphereLight args={['#6bd7ff', '#0a0c12', 0.5]} />
      <directionalLight position={[-3, 3, 4]} intensity={1.5} color="#ffb547" />
      <directionalLight position={[3, 2.5, -3]} intensity={2.6} color="#35e0f2" />
      {/* neutral soft fill so skin tones read naturally under the colored key/rim */}
      <directionalLight position={[0.5, 2.2, 4]} intensity={0.7} color="#ffffff" />

      {/* platform */}
      <mesh position={[0, -0.04, 0]}>
        <cylinderGeometry args={[0.9, 0.94, 0.08, 64]} />
        <meshStandardMaterial color="#0d1018" metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh ref={ring} position={[0, 0.004, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.88, 0.012, 8, 96]} />
        <meshStandardMaterial color="#35e0f2" emissive="#35e0f2" emissiveIntensity={0.7} />
      </mesh>
      <mesh position={[0, -0.075, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.3, 0.006, 8, 96]} />
        <meshBasicMaterial color="#35e0f2" transparent opacity={0.25} />
      </mesh>

      {positions ? (
        <points ref={dust}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
          </bufferGeometry>
          <pointsMaterial color="#8ff0fa" size={0.022} sizeAttenuation transparent opacity={0.55} depthWrite={false} />
        </points>
      ) : null}
    </>
  );
}
