import {motion} from 'framer-motion';
import {shop} from '../content';

export function Header() {
  return (
    <motion.header
      initial={{opacity: 0, y: -12}}
      animate={{opacity: 1, y: 0}}
      transition={{duration: 0.8, ease: [0.2, 0.7, 0.1, 1], delay: 0.2}}
      className="fixed inset-x-0 top-0 z-30 flex items-center justify-between gap-4 pb-3.5"
      style={{
        paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))',
        paddingLeft: 'var(--gutter-l)',
        // clear the tape measure on the right edge
        paddingRight: 'calc(var(--gutter-r) + 34px)',
      }}
    >
      <a href="#top" className="flex flex-col leading-none no-underline" aria-label={`${shop.name}, ${shop.line}`}>
        <span className="font-display text-[1.6rem] font-medium tracking-[0.1em]">RICHMAN</span>
        <span className="mt-1.5 text-[0.75rem] tracking-[0.06em] text-mute">{shop.line}</span>
      </a>
      <nav className="flex items-center gap-6 text-small">
        <a href="#visit" className="hidden text-mute no-underline hover:text-bone sm:inline">
          Visit the shop
        </a>
        <a href={shop.phoneHref} className="text-right no-underline">
          <span className="block text-[0.75rem] text-mute">Call</span>
          <span className="block font-medium tabular-nums">{shop.phoneDisplay}</span>
        </a>
      </nav>
    </motion.header>
  );
}
