import {motion} from 'framer-motion';
import {shop} from '../content';

export function Visit() {
  return (
    <section id="visit" aria-labelledby="visit-h" className="gutter bg-bone py-24 text-wool">
      <div className="mx-auto grid max-w-[1200px] items-end gap-10 md:grid-cols-[1.3fr_1fr]">
        <motion.h2
          id="visit-h"
          className="text-head"
          initial={{opacity: 0, y: 24}}
          whileInView={{opacity: 1, y: 0}}
          viewport={{once: true, margin: '-15% 0px'}}
          transition={{duration: 0.9, ease: [0.2, 0.7, 0.1, 1]}}
        >
          Come in for your measurements
        </motion.h2>
        <address className="text-lead not-italic leading-relaxed">
          {shop.name}, {shop.address[0]}
          <br />
          {shop.address[1]}, {shop.address[2]}
          <br />
          Mob <strong className="font-medium tabular-nums">{shop.phoneDisplay}</strong>
          <a className="mt-4 block text-small underline underline-offset-4" href={shop.instagram} target="_blank" rel="noopener">
            Instagram @richman_calicut
          </a>
        </address>
      </div>
    </section>
  );
}
