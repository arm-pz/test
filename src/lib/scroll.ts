import Lenis from 'lenis';

/** Lenis smooths the wheel; Framer Motion's useScroll reads native scroll, so
 *  both see the same position. Off entirely under reduced motion. */
export function startSmoothScroll(): () => void {
  const lenis = new Lenis({lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.9});
  let raf = 0;
  const loop = (time: number) => {
    lenis.raf(time);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return () => {
    cancelAnimationFrame(raf);
    lenis.destroy();
  };
}
