import gsap from 'gsap';

/**
 * AAA-Grade Physical Micro-Interactions matching combat choreography
 */
export const motion = {
  // Hover lift with power2.out
  hoverLift: (elem: HTMLElement | null, scale = 1.04, y = -3) => {
    if (!elem) return;
    gsap.killTweensOf(elem);
    gsap.to(elem, {
      scale,
      y,
      duration: 0.22,
      ease: 'power2.out',
      overwrite: 'auto',
    });
  },

  // Reset from hover
  hoverReset: (elem: HTMLElement | null) => {
    if (!elem) return;
    gsap.killTweensOf(elem);
    gsap.to(elem, {
      scale: 1,
      y: 0,
      duration: 0.2,
      ease: 'power2.out',
      overwrite: 'auto',
    });
  },

  // Press settle with elastic bounce
  pressSettle: (elem: HTMLElement | null, scale = 0.95) => {
    if (!elem) return;
    gsap.killTweensOf(elem);
    gsap.to(elem, {
      scale,
      duration: 0.08,
      ease: 'power1.in',
      onComplete: () => {
        gsap.to(elem, {
          scale: 1,
          duration: 0.32,
          ease: 'elastic.out(1.2, 0.4)',
        });
      },
    });
  },

  // Card draw / deal snap
  cardSnapIn: (elem: HTMLElement | null, delay = 0) => {
    if (!elem) return;
    gsap.fromTo(
      elem,
      { scale: 0.7, opacity: 0, y: 25, rotation: -2 },
      { scale: 1, opacity: 1, y: 0, rotation: 0, duration: 0.32, delay, ease: 'back.out(1.4)' }
    );
  },
};
