import gsap from 'gsap';

/**
 * AAA-Grade Physical Micro-Interactions matching combat choreography
 */
export const isReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export const motion = {
  // Hover lift with power2.out
  hoverLift: (elem: HTMLElement | null, scale = 1.04, y = -3) => {
    if (!elem) return;
    if (isReducedMotion()) return;
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
    if (isReducedMotion()) {
      gsap.set(elem, { scale: 1, y: 0 });
      return;
    }
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
    if (isReducedMotion()) return;
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
    if (isReducedMotion()) {
      gsap.set(elem, { scale: 1, opacity: 1, y: 0, rotation: 0 });
      return;
    }
    gsap.fromTo(
      elem,
      { scale: 0.7, opacity: 0, y: 25, rotation: -2 },
      { scale: 1, opacity: 1, y: 0, rotation: 0, duration: 0.32, delay, ease: 'back.out(1.4)' }
    );
  },

  // Bespoke modal entrance
  modalEnter: (elem: HTMLElement | null, overshoot = 1.2, duration = 0.32) => {
    if (!elem) return;
    if (isReducedMotion()) {
      gsap.set(elem, { opacity: 1, scale: 1, y: 0 });
      return;
    }
    gsap.fromTo(
      elem,
      { opacity: 0, scale: 0.88, y: 15 },
      { opacity: 1, scale: 1, y: 0, duration, ease: `back.out(${overshoot})`, overwrite: 'auto' }
    );
  },

  // Hero power / major CTA button punch
  buttonPunch: (elem: HTMLElement | null, punchScale = 1.12) => {
    if (!elem) return;
    if (isReducedMotion()) return;
    const tl = gsap.timeline();
    tl.to(elem, { scale: 0.94, duration: 0.06, ease: 'power1.in' })
      .to(elem, { scale: punchScale, duration: 0.12, ease: 'power2.out' })
      .to(elem, { scale: 1, duration: 0.38, ease: 'elastic.out(1, 0.5)' });
  },

  // HUD coin / counter scale punch
  pulseScale: (elem: HTMLElement | null, scale = 1.15, duration = 0.22) => {
    if (!elem || isReducedMotion()) return;
    gsap.fromTo(
      elem,
      { scale },
      { scale: 1, duration, ease: 'power2.out', overwrite: 'auto' }
    );
  },
};

