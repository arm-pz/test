import {AnimatePresence, motion, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform, type MotionValue} from 'framer-motion';
import {lazy, Suspense, useRef, useState} from 'react';
import {beats, shop, type ClothId} from '../content';
import {useReducedMotion} from '../hooks/useReducedMotion';
import {Swatches} from './Swatches';
import {Tape} from './Tape';

const Scene = lazy(() => import('../three/Scene').then((m) => ({default: m.Scene})));

/**
 * The hero is one pinned stage, 560svh tall. Scroll progress p (0–1) drives
 * the 3D jacket and the copy; Framer Motion owns the copy and the tape,
 * react-three-fiber reads the same spring-smoothed value each frame.
 *
 *   0.00 – 0.06  at rest: the finished jacket on the form
 *   0.06 – 0.44  stitches unpick, pieces lift off and lie flat with chalk lines
 *   0.44 – 0.60  laid out on the cutting table, labelled
 *   0.60 – 0.92  sewn back, back panel first and buttons last
 *   0.92 – 1.00  finished again; choose a cloth
 */

const EASE = [0.2, 0.7, 0.1, 1] as const;
// beats sit at least 2 × FADE apart in content.ts, so two never show at once
const FADE = 0.035;

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

function Headline({text, animate}: {text: string; animate: boolean}) {
  const words = text.split(' ');
  return (
    <h1 className="text-hero" aria-label={text}>
      {words.map((w, i) => (
        <span key={i} aria-hidden="true" className="inline-block overflow-hidden pb-[0.08em] align-top">
          <motion.span
            className="inline-block"
            initial={animate ? {y: '108%'} : false}
            animate={{y: 0}}
            transition={{duration: 1.05, ease: EASE, delay: 0.25 + i * 0.09}}
          >
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </h1>
  );
}

function Book({delay = 0, animate = true}: {delay?: number; animate?: boolean}) {
  return (
    <motion.div
      className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 max-md:mt-5"
      initial={animate ? {opacity: 0, y: 12} : false}
      animate={{opacity: 1, y: 0}}
      transition={{duration: 0.8, ease: EASE, delay}}
    >
      <a href={shop.phoneHref} className="pointer-events-auto rounded-[2px] bg-brass px-6 py-3.5 font-medium text-brass-ink no-underline transition-[filter] hover:brightness-110">
        Book a fitting
      </a>
      <span className="text-small text-mute">
        or call <strong className="font-medium text-bone tabular-nums">{shop.phoneDisplay}</strong>
      </span>
    </motion.div>
  );
}

function Beat({i, p, cloth, setCloth}: {i: number; p: MotionValue<number>; cloth: ClothId; setCloth: (c: ClothId) => void}) {
  const b = beats[i];
  const input = [b.from - FADE, b.from, b.to, b.to + FADE];
  const opacity = useTransform(p, input, [0, 1, 1, 0]);
  const y = useTransform(p, input, [28, 0, 0, -28]);
  const visibility = useTransform(opacity, (o) => (o < 0.02 ? 'hidden' : 'visible'));
  const last = i === beats.length - 1;

  return (
    <motion.div className="[grid-area:1/1] self-center max-md:self-start" style={{opacity, y, visibility}}>
      {i === 0 ? <Headline text={b.title} animate /> : <h2 className="text-head">{b.title}</h2>}
      <motion.p
        className="mt-5 max-w-[32ch] text-lead max-md:mt-3"
        initial={i === 0 ? {opacity: 0, y: 10} : false}
        animate={{opacity: 1, y: 0}}
        transition={{duration: 0.9, ease: EASE, delay: 0.7}}
      >
        {b.body}
      </motion.p>
      {'cta' in b && b.cta && <Book delay={i === 0 ? 0.9 : 0} animate={i === 0} />}
      {last && (
        <div className="pointer-events-auto">
          <Swatches value={cloth} onChange={setCloth} />
        </div>
      )}
    </motion.div>
  );
}

export function Hero() {
  const reduced = useReducedMotion();
  const [gl] = useState(hasWebGL);
  const section = useRef<HTMLElement>(null);
  const labels = useRef<HTMLDivElement>(null);
  const [cloth, setCloth] = useState<ClothId>('chalk');
  const [apart, setApart] = useState(false);

  const {scrollYProgress} = useScroll({target: section, offset: ['start start', 'end end']});
  const smooth = useSpring(scrollYProgress, {stiffness: 70, damping: 22, mass: 0.6, restDelta: 0.0002});
  const still = useMotionValue(0);
  const p = reduced ? still : smooth;

  const cue = useTransform(scrollYProgress, [0, 0.04], [1, 0]);
  useMotionValueEvent(smooth, 'change', (v) => setApart(v > 0.3 && v < 0.75));

  if (reduced || !gl) {
    // A plain, complete page: the finished jacket beside every line of copy.
    return (
      <section id="top" aria-label="Made to measure at Richman" className="relative overflow-hidden" style={{paddingTop: 'calc(110px + env(safe-area-inset-top, 0px))'}}>
        <div className="stage-light absolute inset-0" aria-hidden="true" />
        <div className="gutter relative grid gap-10 pb-20 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="grid content-start gap-14">
            {beats.map((b, i) => (
              <div key={i}>
                {i === 0 ? <Headline text={b.title} animate={false} /> : <h2 className="text-head">{b.title}</h2>}
                <p className="mt-4 max-w-[34ch] text-lead">{b.body}</p>
                {'cta' in b && b.cta && <Book animate={false} />}
                {i === beats.length - 1 && <Swatches value={cloth} onChange={setCloth} />}
              </div>
            ))}
          </div>
          {gl && (
            <div className="relative h-[80svh] md:sticky md:top-0">
              <Suspense fallback={null}>
                <Scene progress={p} cloth={cloth} labels={labels} still />
              </Suspense>
              <div ref={labels} className="pointer-events-none absolute inset-0" aria-hidden="true" />
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section ref={section} id="top" aria-label="Made to measure at Richman" className="relative" style={{height: '560svh'}}>
      <div className="sticky top-0 h-svh overflow-hidden">
        <div className="stage-light absolute inset-0" aria-hidden="true" />
        <motion.div className="absolute inset-0" initial={{opacity: 0, scale: 1.04}} animate={{opacity: 1, scale: 1}} transition={{duration: 1.6, ease: EASE}}>
          <Suspense fallback={null}>
            <Scene progress={p} cloth={cloth} labels={labels} />
          </Suspense>
        </motion.div>
        <div ref={labels} className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden="true" />

        <div
          className="pointer-events-none absolute z-10 grid w-[min(31rem,40vw)] max-md:w-auto"
          style={{
            left: 'var(--gutter-l)',
            top: 0,
            bottom: 0,
          }}
        >
          <div className="grid max-md:pr-8 md:my-auto max-md:mt-[calc(92px+env(safe-area-inset-top,0px))]" style={{maxWidth: '100%'}}>
            {beats.map((_, i) => (
              <Beat key={i} i={i} p={p} cloth={cloth} setCloth={setCloth} />
            ))}
          </div>
        </div>

        <AnimatePresence>
          {apart && (
            <motion.p
              key="table"
              className="absolute z-10 text-small text-mute max-md:hidden"
              style={{right: 'calc(34px + var(--gutter-r))', bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))'}}
              initial={{opacity: 0, y: 8}}
              animate={{opacity: 1, y: 0}}
              exit={{opacity: 0, y: 8}}
              transition={{duration: 0.5, ease: EASE}}
            >
              Pattern pieces for a size 38 double-breasted jacket
            </motion.p>
          )}
        </AnimatePresence>

        <motion.p
          className="absolute z-10 text-small text-mute max-md:hidden"
          style={{left: 'var(--gutter-l)', bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))', opacity: cue}}
        >
          Scroll to unpick the jacket
        </motion.p>

        <Tape progress={p} />
      </div>
    </section>
  );
}
