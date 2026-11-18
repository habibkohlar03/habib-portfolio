import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import { assets } from '../../data/assets';
import StudioStage from './StudioStage';
import PlaceholderAvatar from './PlaceholderAvatar';
import FullBodyAvatar from './FullBodyAvatar';
import SceneErrorBoundary from './SceneErrorBoundary';

// Backs the camera away until the avatar's full height AND the platform width
// both fit, whatever shape the stage is (phone, tablet or desktop).
function CameraSetup() {
  const { camera, size } = useThree();
  useEffect(() => {
    const { viewHeight, viewWidth, minDistance, cameraY, targetY } = assets.stage;
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const aspect = size.width / Math.max(size.height, 1);
    const distance = Math.max(viewHeight / 2 / tan, viewWidth / 2 / (tan * aspect), minDistance);
    camera.position.set(0, cameraY, distance);
    camera.lookAt(0, targetY, 0);
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  return null;
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
      aria-label={
        avatar.enabled
          ? 'Interactive 3D avatar of Habib Ullah'
          : 'Interactive 3D avatar of Habib Ullah (placeholder model)'
      }
    >
      <Canvas
        dpr={dpr}
        frameloop={inView ? 'always' : 'never'}
        camera={{ fov: 30, near: 0.1, far: 50, position: [0, assets.stage.cameraY, 5] }}
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
        {avatar.enabled ? (
          <SceneErrorBoundary
            fallback={placeholder}
            onError={() => onCapabilities && onCapabilities({ mode: 'load-failed' })}
          >
            {/* While the GLB downloads, show only the platform (the caption says "Loading avatar…"). */}
            <Suspense fallback={null}>
              <FullBodyAvatar
                config={avatar}
                audio={audio}
                hasTimeline={hasTimeline}
                onCapabilities={onCapabilities}
                enableLook={quality === 'high'}
              />
            </Suspense>
          </SceneErrorBoundary>
        ) : (
          placeholder
        )}
      </Canvas>
    </div>
  );
}
