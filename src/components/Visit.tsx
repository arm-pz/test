import {motion} from 'framer-motion';
import {credits, shop} from '../content';

export function Visit() {
  return (
    <>
      <section id="visit" aria-labelledby="visit-h" className="bg-night text-night-ink">
        <div className="mx-auto grid max-w-[1400px] md:grid-cols-[1fr_1.15fr]">
          <div className="gutter flex flex-col justify-end gap-8 py-20 md:py-28">
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
            </address>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <a href={shop.phoneHref} className="rounded-[2px] bg-night-ink px-6 py-3.5 font-medium text-night no-underline hover:opacity-90">
                Book a fitting
              </a>
              <a className="text-small underline underline-offset-4" href={shop.instagram} target="_blank" rel="noopener">
                Instagram @richman_calicut
              </a>
            </div>
          </div>
          <img src="media/atelier.webp" alt="A tailor checking the fit of a jacket on a client, a suit on a dress form beside them" className="h-full min-h-[320px] w-full object-cover" loading="lazy" />
        </div>
      </section>
      <footer className="gutter bg-night py-8 text-[0.8125rem] text-night-mute">
        <p className="mx-auto max-w-[1400px]">
          Photographs:{' '}
          {credits.map((c, i) => (
            <span key={c.href}>
              {c.what.toLowerCase()} by{' '}
              <a href={c.href} target="_blank" rel="noopener" className="underline underline-offset-2">
                {c.who}
              </a>{' '}
              on {c.where}
              {i < credits.length - 1 ? '; ' : '.'}
            </span>
          ))}{' '}
          To be replaced with the shop's own photographs.
        </p>
      </footer>
    </>
  );
}
