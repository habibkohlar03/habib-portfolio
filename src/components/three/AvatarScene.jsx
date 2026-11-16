import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import StudioStage from './StudioStage';
import PlaceholderAvatar from './PlaceholderAvatar';
import GlbAvatar from './GlbAvatar';
import SceneErrorBoundary from './SceneErrorBoundary';

function CameraSetup() {
  const { camera, size } = useThree();
  useEffect(() => {
    const narrow = size.width < 640;
    camera.position.set(0, 1.05, narrow ? 6.4 : 5);
    camera.lookAt(0, 0.95, 0);
    camera.updateProjectionMatrix();
  }, [camera, size.width]);
  return null;
}

// Turns the avatar toward the cursor on desktop; a slow idle sway everywhere else.
function Rig({ quality, children }) {
  const ref = useRef();
  useFrame((state, dt) => {
    if (!ref.current) return;
    const target =
      quality === 'high' ? state.pointer.x * 0.35 : Math.sin(state.clock.elapsedTime * 0.4) * 0.15;
    ref.current.rotation.y = THREE.MathUtils.damp(ref.current.rotation.y, target, 3, dt);
  });
  return <group ref={ref}>{children}</group>;
}

export default function AvatarScene({ quality, audio, avatar, hasTimeline, onCapabilities }) {
  const wrapper = useRef(null);
  const [inView, setInView] = useState(true);
  const [dpr, setDpr] = useState(quality === 'high' ? [1, 2] : [1, 1.5]);

  // Stop rendering entirely while the hero is scrolled out of view.
  useEffect(() => {
    if (!wrapper.current || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.05 });
    observer.observe(wrapper.current);
    return () => observer.disconnect();
  }, []);

  const placeholder = <PlaceholderAvatar audio={audio} />;

  return (
    <div
      ref={wrapper}
      className="absolute inset-0"
      role="img"
      aria-label="Interactive 3D avatar of Habib Ullah (placeholder model)"
    >
      <Canvas
        dpr={dpr}
        frameloop={inView ? 'always' : 'never'}
        camera={{ fov: 30, near: 0.1, far: 50, position: [0, 1.05, 5] }}
        gl={{
          antialias: quality === 'high',
          alpha: true,
          powerPreference: quality === 'high' ? 'high-performance' : 'default',
        }}
        onCreated={() => onCapabilities && !avatar.enabled && onCapabilities({ mode: 'placeholder' })}
      >
        <PerformanceMonitor onDecline={() => setDpr(1)} />
        <CameraSetup />
        <StudioStage quality={quality} audio={audio} />
        <Rig quality={quality}>
          {avatar.enabled ? (
            <SceneErrorBoundary
              fallback={placeholder}
              onError={() => onCapabilities && onCapabilities({ mode: 'load-failed' })}
            >
              <Suspense fallback={placeholder}>
                <GlbAvatar
                  url={avatar.url}
                  height={avatar.height}
                  audio={audio}
                  hasTimeline={hasTimeline}
                  onCapabilities={onCapabilities}
                />
              </Suspense>
            </SceneErrorBoundary>
          ) : (
            placeholder
          )}
        </Rig>
      </Canvas>
    </div>
  );
}
