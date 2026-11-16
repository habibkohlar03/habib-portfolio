import { lazy, Suspense, useEffect, useState } from 'react';
import { ArrowDown, ArrowRight, Mail } from 'lucide-react';
import { site } from '../data/site';
import { assets } from '../data/assets';
import { useQualityTier } from '../hooks/useQualityTier';
import { useIntroAudio } from '../audio/useIntroAudio';
import IntroPlayer from '../audio/IntroPlayer';
import AvatarFallback from '../components/three/AvatarFallback';
import SceneErrorBoundary from '../components/three/SceneErrorBoundary';

// The heavy 3D bundle (three + r3f + drei) is only fetched here, after first paint.
const AvatarScene = lazy(() => import('../components/three/AvatarScene'));

const CAPS_TEXT = {
  placeholder: 'Placeholder avatar · add your GLB for likeness and lip-sync',
  loading: 'Loading avatar…',
  none: 'Avatar loaded · no facial blendshapes found, lip-sync off',
  amplitude: 'Lip-sync: audio-driven jaw movement',
  visemes: 'Lip-sync: viseme timeline',
  'load-failed': 'Avatar file could not be loaded · showing placeholder',
};

export default function Hero() {
  const quality = useQualityTier();
  const audio = useIntroAudio(assets.voice);
  const [mount3D, setMount3D] = useState(false);
  const [caps, setCaps] = useState({ mode: assets.avatar.enabled ? 'loading' : 'placeholder' });

  // Mount the 3D scene when the browser is idle so text and CTAs paint first.
  useEffect(() => {
    if (quality === 'static') return undefined;
    let handle;
    let usedIdle = false;
    if ('requestIdleCallback' in window) {
      usedIdle = true;
      handle = window.requestIdleCallback(() => setMount3D(true), { timeout: 1500 });
    } else {
      handle = window.setTimeout(() => setMount3D(true), 600);
    }
    return () => {
      if (usedIdle) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
    };
  }, [quality]);

  const show3D = quality !== 'static' && mount3D;

  return (
    <section id="top" aria-labelledby="hero-title" className="relative isolate overflow-hidden">
      {/* ambient background */}
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="bg-grid absolute inset-0" />
        <div className="absolute -right-40 top-10 h-[34rem] w-[34rem] rounded-full bg-signal/[0.09] blur-[120px]" />
        <div className="absolute -left-40 bottom-0 h-[26rem] w-[26rem] rounded-full bg-amber-glow/[0.06] blur-[120px]" />
      </div>

      <div className="mx-auto grid min-h-[100svh] w-full max-w-7xl items-center gap-6 px-5 pb-16 pt-24 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pt-20">
        {/* copy */}
        <div className="relative z-10">
          <p className="hero-in label-mono flex items-center gap-2" style={{ '--d': '0ms' }}>
            <span aria-hidden="true" className="h-2 w-2 animate-pulse rounded-full bg-signal shadow-[0_0_10px_#35e0f2]" />
            {site.availability}
          </p>

          <h1
            id="hero-title"
            className="hero-in mt-6 font-display text-5xl font-bold leading-[1.02] tracking-tight text-white sm:text-6xl xl:text-7xl"
            style={{ '--d': '80ms' }}
          >
            {site.name}
          </h1>

          <p
            className="hero-in mt-4 bg-gradient-to-r from-signal-soft via-signal to-amber-glow bg-clip-text font-display text-xl font-medium text-transparent sm:text-2xl"
            style={{ '--d': '160ms' }}
          >
            {site.title}
          </p>

          <p className="hero-in mt-6 max-w-xl text-base leading-relaxed text-slate-400 md:text-lg" style={{ '--d': '240ms' }}>
            {site.heroIntro}
          </p>

          <div className="hero-in mt-9 flex flex-wrap gap-3" style={{ '--d': '320ms' }}>
            <a href="#projects" className="btn-primary">
              View My Work
              <ArrowRight size={16} aria-hidden="true" />
            </a>
            <a href="#contact" className="btn-ghost">
              <Mail size={16} aria-hidden="true" />
              Contact Me
            </a>
          </div>

          <div className="hero-in mt-8" style={{ '--d': '400ms' }}>
            <IntroPlayer audio={audio} transcript={assets.voice.transcript} />
          </div>

          <dl className="hero-in mt-10 flex gap-8 border-t border-white/[0.07] pt-6" style={{ '--d': '480ms' }}>
            <div>
              <dt className="label-mono">Experience</dt>
              <dd className="mt-1 font-display text-2xl text-white">{site.experienceYears} years</dd>
            </div>
            <div>
              <dt className="label-mono">Based in</dt>
              <dd className="mt-1 font-display text-2xl text-white">{site.location}</dd>
            </div>
          </dl>
        </div>

        {/* avatar stage */}
        <div
          data-hero-stage
          className="hero-in relative h-[58svh] min-h-[380px] w-full lg:h-[82svh] lg:max-h-[760px]"
          style={{ '--d': '200ms' }}
        >
          <div className="hud-card absolute inset-0 overflow-hidden bg-ink-900/40">
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-24 overflow-hidden opacity-40">
              <div className="scan-line h-full w-full bg-gradient-to-b from-transparent via-signal/20 to-transparent" />
            </div>

            {show3D ? (
              <SceneErrorBoundary fallback={<AvatarFallback />} onError={() => setCaps({ mode: 'load-failed' })}>
                <Suspense fallback={<AvatarFallback />}>
                  <AvatarScene
                    quality={quality}
                    audio={audio.stateRef}
                    avatar={assets.avatar}
                    hasTimeline={Boolean(assets.voice.visemeTimeline)}
                    onCapabilities={setCaps}
                  />
                </Suspense>
              </SceneErrorBoundary>
            ) : (
              <AvatarFallback />
            )}

            <p className="pointer-events-none absolute left-4 top-4 font-mono text-[10px] uppercase tracking-[0.2em] text-signal/70">
              Control room // live
            </p>
            <p className="pointer-events-none absolute inset-x-4 bottom-4 font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-slate-500">
              {CAPS_TEXT[caps.mode] ?? ''}
            </p>
          </div>
        </div>
      </div>

      <a
        href="#about"
        aria-label="Scroll to About"
        className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 text-slate-500 transition-colors hover:text-signal lg:block"
      >
        <ArrowDown size={20} aria-hidden="true" />
      </a>
    </section>
  );
}
