import { useEffect, RefObject } from 'react';
import Lenis from 'lenis';

/**
 * Scoped Lenis smooth-scroller hook.
 * Strictly binds to local modal/list containers rather than global window,
 * preserving layout constraints and preventing unintended scroll behavior.
 */
export function useLenisScroll(
  containerRef: RefObject<HTMLElement | null>,
  contentRef?: RefObject<HTMLElement | null>,
  deps: unknown[] = []
) {
  useEffect(() => {
    const wrapper = containerRef.current;
    if (!wrapper) return;

    const content = contentRef?.current || (wrapper.firstElementChild as HTMLElement) || wrapper;

    const lenis = new Lenis({
      wrapper,
      content,
      eventsTarget: wrapper,
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [containerRef, contentRef, ...deps]);
}
