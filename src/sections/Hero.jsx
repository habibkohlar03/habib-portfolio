import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowRight, Mail } from 'lucide-react';
import { site } from '../data/site';
import { assets } from '../data/assets';
import { useQualityTier } from '../hooks/useQualityTier';
import AvatarFallback from '../components/three/AvatarFallback';
import SceneErrorBoundary from '../components/three/SceneErrorBoundary';
import IntroControls from '../components/avatar/IntroControls';
import { useIntroAudio } from '../audio/useIntroAudio';

// three.js and the avatar are only fetched here, after first paint.
const AvatarScene = lazy(() => import('../components/three/AvatarScene'));

const CAPTIONS = {
  loading: 'Loading avatar…',
  visemes: 'Full-body avatar · lip-sync from timeline',
  amplitude: 'Full-body avatar · mouth follows the voice',
  none: 'Full-body avatar · body animation only (this model has no facial morph targets)',
  placeholder: 'Placeholder avatar',
  failed: 'Avatar unavailable · audio-only introduction',
  off: '3D avatar off (reduced motion, data saver or no WebGL) · audio-only introduction',
};

const INTRO_STATUS = { loading: 'starting', playing: 'playing', error: 'error' };

export default function Hero() {
  const quality = useQualityTier();
  const [mount3D, setMount3D] = useState(false);
  const [avatarState, setAvatarState] = useState('loading'); // loading | visemes | amplitude | none | placeholder | failed
  const onCapabilities = useCallback((caps) => {
    setAvatarState(caps.mode === 'load-failed' ? 'failed' : caps.mode);
  }, []);
  const onAvatarFailed = useCallback(() => setAvatarState('failed'), []);

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
  const avatarActive = show3D && avatarState !== 'failed';
  const intro = useIntroAudio(assets.voice);
  const caption = quality === 'static' ? CAPTIONS.off : CAPTIONS[avatarState];

  return (
    <section id="top" aria-labelledby="hero-title" className="relative isolate overflow-hidden">
      {/* ambient background */}
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950 via-ink-950 to-ink-900" />
        <div className="bg-grid absolute inset-0 opacity-60" />
        <div className="absolute -right-32 top-0 h-[36rem] w-[36rem] rounded-full bg-brand/[0.16] blur-[110px]" />
        <div className="absolute -left-48 bottom-0 h-[28rem] w-[28rem] rounded-full bg-brand/[0.08] blur-[120px]" />
      </div>

      <div className="mx-auto grid min-h-[100svh] w-full max-w-7xl items-center gap-6 px-5 pb-16 pt-24 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pt-20">
        {/* copy */}
        <div className="relative z-10">
          <p
            className="hero-in inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand-soft px-4 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-signal-deep"
            style={{ '--d': '0ms' }}
          >
            <span aria-hidden="true" className="h-2 w-2 animate-pulse rounded-full bg-brand" />
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
            className="hero-in mt-4 flex items-center gap-3 font-display text-xl font-semibold text-signal sm:text-2xl"
            style={{ '--d': '160ms' }}
          >
            <span aria-hidden="true" className="h-[3px] w-10 rounded-full bg-brand" />
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
            <IntroControls
              enabled={assets.voice.enabled}
              status={INTRO_STATUS[intro.status] ?? 'idle'}
              message={intro.status === 'error' ? 'The voice introduction could not be played.' : ''}
              onPlay={intro.play}
              onStop={intro.stop}
              transcript={assets.voice.transcript}
            />
          </div>

          <dl className="hero-in mt-10 grid max-w-md grid-cols-2 gap-4" style={{ '--d': '480ms' }}>
            <div className="rounded-2xl border border-white/10 bg-ink-950 p-4 shadow-card">
              <dt className="label-mono">Experience</dt>
              <dd className="mt-1 font-display text-2xl font-bold text-white">{site.experienceYears} years</dd>
            </div>
            <div className="rounded-2xl border border-white/10 bg-ink-950 p-4 shadow-card">
              <dt className="label-mono">Based in</dt>
              <dd className="mt-1 font-display text-2xl font-bold text-white">{site.location}</dd>
            </div>
          </dl>
        </div>

        {/* avatar stage */}
        {/* data-hero-stage lives on a plain wrapper: the CSS entrance animation on the
            inner element would otherwise override GSAP's scroll-parallax transform. */}
        <div data-hero-stage>
        <div
          className="hero-in relative h-[58svh] min-h-[380px] w-full lg:h-[82svh] lg:max-h-[760px]"
          style={{ '--d': '200ms' }}
        >
          <div className="absolute inset-0 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-ink-950 via-brand-soft/60 to-brand-light/70 shadow-lift">
            <div aria-hidden="true" className="bg-grid pointer-events-none absolute inset-0 opacity-50" />

            {avatarActive ? (
              <SceneErrorBoundary fallback={<AvatarFallback />} onError={onAvatarFailed}>
                <Suspense fallback={<AvatarFallback />}>
                  <AvatarScene
                    quality={quality}
                    audio={intro.stateRef}
                    avatar={assets.avatar}
                    hasTimeline={Boolean(assets.voice.visemeTimeline)}
                    onCapabilities={onCapabilities}
                  />
                </Suspense>
              </SceneErrorBoundary>
            ) : (
              <AvatarFallback />
            )}

            <p className="pointer-events-none absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-ink-950/90 px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-signal-deep shadow-card">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand" />
              Live 3D assistant
            </p>
            <p className="pointer-events-none absolute inset-x-5 bottom-4 font-mono text-[10px] uppercase leading-relaxed tracking-[0.12em] text-slate-400">
              {caption}
            </p>
          </div>
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
