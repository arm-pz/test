import {AnimatePresence, motion, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform, type MotionValue} from 'framer-motion';
import {useEffect, useRef, useState} from 'react';
import {beats, shop} from '../content';
import {useReducedMotion} from '../hooks/useReducedMotion';
import {JacketStage, apartAt} from './JacketStage';
import {Tape} from './Tape';

/**
 * One pinned stage, 540svh tall. Scroll progress p (0–1), smoothed by a
 * Framer Motion spring, drives the jacket layers, the copy and the tape.
 *
 *   0.00 – 0.05  the jacket on its hanger, whole
 *   0.05 – 0.42  button, flaps and welt come off, lapels open, fronts and
 *                sleeves lift away; the pad-stitched canvas shows underneath
 *   0.42 – 0.60  every piece held apart, outlined in chalk and named
 *   0.60 – 0.87  built back, sleeves first and button last
 *   0.88 – 1.00  the finished jacket gives way to the same cut, worn
 */

const EASE = [0.2, 0.7, 0.1, 1] as const;
// beats sit at least 2 × FADE apart in content.ts, so two never show at once
const FADE = 0.035;
const ASPECT = 1648 / 2144;

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
      <a href={shop.phoneHref} className="pointer-events-auto rounded-[2px] bg-ink px-6 py-3.5 font-medium text-stone no-underline transition-opacity hover:opacity-85">
        Book a fitting
      </a>
      <span className="text-small text-mute">
        or call <strong className="font-medium text-ink tabular-nums">{shop.phoneDisplay}</strong>
      </span>
    </motion.div>
  );
}

function Beat({i, p}: {i: number; p: MotionValue<number>}) {
  const b = beats[i];
  const input = [b.from - FADE, b.from, b.to, b.to + FADE];
  const opacity = useTransform(p, input, [0, 1, 1, 0]);
  const y = useTransform(p, input, [28, 0, 0, -28]);
  const visibility = useTransform(opacity, (o) => (o < 0.02 ? 'hidden' : 'visible'));

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
    </motion.div>
  );
}

function useNarrow() {
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 760);
  useEffect(() => {
    const on = () => setNarrow(window.innerWidth <= 760);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return narrow;
}

export function Hero() {
  const reduced = useReducedMotion();
  const narrow = useNarrow();
  const section = useRef<HTMLElement>(null);
  const [apart, setApart] = useState(false);

  const {scrollYProgress} = useScroll({target: section, offset: ['start start', 'end end']});
  const smooth = useSpring(scrollYProgress, {stiffness: 80, damping: 24, mass: 0.55, restDelta: 0.0002});
  const still = useMotionValue(0);
  const p = reduced ? still : smooth;

  const cue = useTransform(scrollYProgress, [0, 0.04], [1, 0]);
  const worn = useTransform(p, [0.88, 0.95], [0, 1]);
  const wornScale = useTransform(p, [0.88, 1], [1.04, 1]);
  const jacketOut = useTransform(p, [0.88, 0.95], [1, 0]);
  // phones have no room to the sides, so the jacket shrinks while it is apart
  const spread = useTransform(p, (v) => (narrow ? 1 - 0.3 * apartAt(v) : 1));
  useMotionValueEvent(smooth, 'change', (v) => setApart(apartAt(v) > 0.9));

  if (reduced) {
    // A plain, complete page: every line of copy beside the photographs.
    return (
      <section id="top" aria-label="Made to measure at Richman" className="relative overflow-hidden" style={{paddingTop: 'calc(110px + env(safe-area-inset-top, 0px))'}}>
        <div className="stage-light absolute inset-0" aria-hidden="true" />
        <div className="gutter relative grid gap-10 pb-20 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="grid content-start gap-14">
            {beats.map((b, i) => (
              <div key={i}>
                {i === 0 ? <Headline text={b.title} animate={false} /> : <h2 className="text-head">{b.title}</h2>}
                <p className="mt-4 max-w-[34ch] text-lead">{b.body}</p>
                {'cta' in b && b.cta && <Book animate={false} />}
              </div>
            ))}
          </div>
          <div className="grid content-start gap-10">
            <div className="relative mx-auto w-full max-w-[560px]" style={{aspectRatio: ASPECT}}>
              <JacketStage progress={p} narrow={narrow} still />
            </div>
            <img src="media/worn.webp" alt="A man in a slim black suit fastening the jacket button" className="mx-auto w-full max-w-[560px]" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={section} id="top" aria-label="Made to measure at Richman" className="relative" style={{height: '540svh'}}>
      <div className="sticky top-0 h-svh overflow-hidden">
        <div className="stage-light absolute inset-0" aria-hidden="true" />

        {/* the jacket box: right of centre on wide screens, below the copy on phones */}
        <div
          className="absolute"
          style={
            narrow
              ? {left: 'calc(50% - 12px)', bottom: 'calc(3svh + env(safe-area-inset-bottom, 0px))', height: '50svh', aspectRatio: ASPECT, translate: '-50% 0'}
              : {left: '61.5%', top: '50%', height: '82svh', aspectRatio: ASPECT, translate: '-50% -46%'}
          }
        >
          <motion.div className="absolute inset-0" initial={{opacity: 0, y: 24}} animate={{opacity: 1, y: 0}} transition={{duration: 1.4, ease: EASE}}>
            <motion.div className="absolute inset-0 origin-bottom" style={{opacity: jacketOut, scale: spread}}>
              <JacketStage progress={p} narrow={narrow} />
            </motion.div>
          </motion.div>
          <motion.img
            src="media/worn.webp"
            alt="A man in a slim black suit fastening the jacket button"
            className="absolute inset-0 size-full object-cover object-[50%_30%]"
            style={{opacity: worn, scale: wornScale}}
          />
        </div>

        <div className="pointer-events-none absolute z-10 grid w-[min(31rem,40vw)] max-md:w-auto" style={{left: 'var(--gutter-l)', top: 0, bottom: 0, right: narrow ? 'calc(var(--gutter-r) + 24px)' : undefined}}>
          <div className="grid max-md:mt-[calc(92px+env(safe-area-inset-top,0px))] md:my-auto">
            {beats.map((_, i) => (
              <Beat key={i} i={i} p={p} />
            ))}
          </div>
        </div>

        <AnimatePresence>
          {apart && (
            <motion.p
              key="note"
              className="absolute z-10 text-small text-mute max-md:hidden"
              style={{right: 'calc(34px + var(--gutter-r))', bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))'}}
              initial={{opacity: 0, y: 8}}
              animate={{opacity: 1, y: 0}}
              exit={{opacity: 0, y: 8}}
              transition={{duration: 0.5, ease: EASE}}
            >
              One jacket, cut along its seams
            </motion.p>
          )}
        </AnimatePresence>

        <motion.p className="absolute z-10 text-small text-mute max-md:hidden" style={{left: 'var(--gutter-l)', bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))', opacity: cue}}>
          Scroll to take the jacket apart
        </motion.p>

        <Tape progress={p} />
      </div>
    </section>
  );
}
