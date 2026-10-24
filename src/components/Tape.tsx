import {motion, useTransform, type MotionValue} from 'framer-motion';

const CM = 12; // px per centimetre on the tape
const LENGTH = 150;

/** A tailor's tape down the right edge; it runs out 100 cm over the hero. */
export function Tape({progress}: {progress: MotionValue<number>}) {
  const y = useTransform(progress, (p) => `calc(50svh - ${(p * 100 * CM).toFixed(1)}px)`);
  const reading = useTransform(progress, (p) => `${Math.round(p * 100)} cm`);
  const ticks = Array.from({length: LENGTH + 1}, (_, c) => c);

  return (
    <div aria-hidden="true" className="absolute inset-y-0 right-0 z-20 w-[34px] overflow-hidden bg-tape text-tape-ink max-md:w-6" style={{marginRight: 'env(safe-area-inset-right, 0px)'}}>
      <motion.div className="absolute inset-x-0 top-0" style={{y, height: LENGTH * CM}}>
        {ticks.map((c) => (
          <div key={c}>
            <i className="absolute right-0 h-px bg-tape-ink" style={{top: c * CM, width: c % 10 === 0 ? 14 : c % 5 === 0 ? 9 : 5}} />
            {c % 10 === 0 && c > 0 && (
              <b className="absolute left-1 -translate-y-1/2 text-[11px] font-medium tabular-nums max-md:left-0.5 max-md:text-[9px]" style={{top: c * CM}}>
                {c}
              </b>
            )}
          </div>
        ))}
      </motion.div>
      <div className="absolute inset-x-0 top-1/2 h-0.5 bg-wool" />
      <motion.span className="sr-only">{reading}</motion.span>
    </div>
  );
}
