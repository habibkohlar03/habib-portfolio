import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Scroll choreography with GSAP.
 *  - Any element with [data-reveal] fades/slides in once, as it enters view
 *    (optional data-reveal-delay in seconds).
 *  - On tablet/desktop the hero stage drifts slightly while scrolling away.
 *  - Skipped entirely when the visitor prefers reduced motion.
 *  - Phones get a shorter, lighter reveal.
 */
export function useScrollAnimations(reducedMotion) {
  useEffect(() => {
    if (reducedMotion) return undefined;

    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();

    const reveal = (distance, duration) => {
      gsap.utils.toArray('[data-reveal]').forEach((el) => {
        const delay = Number(el.dataset.revealDelay || 0);
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: distance },
          {
            autoAlpha: 1,
            y: 0,
            duration,
            delay,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          },
        );
      });
    };

    mm.add('(min-width: 768px)', () => {
      reveal(28, 0.8);
      gsap.to('[data-hero-stage]', {
        yPercent: 6,
        ease: 'none',
        scrollTrigger: { trigger: '#top', start: 'top top', end: 'bottom top', scrub: true },
      });
    });

    mm.add('(max-width: 767px)', () => {
      reveal(10, 0.5);
    });

    // Layout shifts once web fonts load; recalculate trigger positions.
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('load', refresh);

    return () => {
      window.removeEventListener('load', refresh);
      mm.revert();
    };
  }, [reducedMotion]);
}
