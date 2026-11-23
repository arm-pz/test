import { Fragment, createContext, useContext, useEffect, useRef } from 'react'
import { motion, useInView, useMotionValue, useSpring, AnimatePresence } from 'framer-motion'

export const EASE = [0.76, 0, 0.24, 1]
export const EASE_OUT = [0.16, 1, 0.3, 1]

export const AppCtx = createContext(null)
export const useApp = () => useContext(AppCtx)

/* Language: copy is stored as { en, es }; tr() picks the current one. */
export function useT() {
  const { lang } = useApp()
  return v => (v && typeof v === 'object' && 'en' in v ? v[lang] ?? v.en : v)
}

// Interface strings
export const S = {
  menu: { en: 'Menu', es: 'Menú' }, close: { en: 'Close', es: 'Cerrar' },
  quote: { en: 'Quote', es: 'Presupuesto' },
  scroll: { en: 'Scroll to pack', es: 'Desliza para envasar' },
  discover: { en: 'Discover', es: 'Descubrir' },
  drag: { en: 'Drag', es: 'Arrastrar' }, dragTurn: { en: 'Drag to turn', es: 'Arrastra para girar' },
  addQuote: { en: 'Add to quote', es: 'Añadir al presupuesto' }, inQuote: { en: 'In your quote', es: 'En tu presupuesto' },
  added: { en: 'added to your quote', es: 'añadida a tu presupuesto' },
  lot: { en: 'Lot', es: 'Lote' }, origin: { en: 'Origin', es: 'Origen' }, colour: { en: 'Colour', es: 'Color' },
  unitsHour: { en: 'units per hour', es: 'unidades por hora' },
  phase: {
    conveying: { en: 'Conveying', es: 'Transportando' }, filling: { en: 'Filling', es: 'Llenando' },
    capping: { en: 'Capping', es: 'Cerrando' }, packed: { en: 'Packed', es: 'Envasado' },
  },
  swipe: { en: 'Swipe to see more →', es: 'Desliza para ver más →' },
  backTop: { en: 'Back to top ↑', es: 'Volver arriba ↑' },
}

// Text that rises out of a mask, word by word (or char by char).
export function Reveal({ children, as: Tag = 'span', delay = 0, play = true, className = '', split = 'words', stagger }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -8% 0px' })
  const go = play && inView
  const parts = split === 'chars' ? [...children] : children.split(' ')
  const step = stagger ?? (split === 'chars' ? 0.03 : 0.07)
  return (
    <Tag ref={ref} className={`reveal ${className}`}>
      <span className="sr">{children}</span>
      {parts.map((p, i) => (
        <Fragment key={`${children}-${i}`}>
          <span className="mask" aria-hidden="true">
            <motion.span initial={{ y: '115%' }} animate={go ? { y: '0%' } : undefined}
              transition={{ duration: 1.2, ease: EASE_OUT, delay: delay + i * step }}>
              {p === ' ' ? ' ' : p}
            </motion.span>
          </span>
          {split === 'words' && i < parts.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </Tag>
  )
}

// Reina's crown bars, used as a section divider
export function Bars() {
  return <span className="bars" aria-hidden="true"><i /><i /></span>
}

// In-app link: hash routes go through the page transition, #anchors scroll with Lenis.
export function Link({ to, href, children, cursor, onClick, ...rest }) {
  const { navigate, lenis, setCursor } = useApp()
  const target = to !== undefined ? `#${to}` : href
  return (
    <a
      href={target}
      {...rest}
      onMouseEnter={cursor ? () => setCursor(cursor) : undefined}
      onMouseLeave={cursor ? () => setCursor(null) : undefined}
      onClick={e => {
        onClick?.(e)
        if (to !== undefined) { e.preventDefault(); setCursor(null); navigate(to) }
        else if (href?.startsWith('#')) {
          e.preventDefault()
          if (href === '#') lenis.current ? lenis.current.scrollTo(0) : scrollTo({ top: 0, behavior: 'smooth' })
          else navigate('', href)
        }
      }}
    >
      {children}
    </a>
  )
}

// Small pill that trails the pointer and names what a click will do.
export function Cursor({ label }) {
  const x = useMotionValue(-200)
  const y = useMotionValue(-200)
  const sx = useSpring(x, { stiffness: 500, damping: 40 })
  const sy = useSpring(y, { stiffness: 500, damping: 40 })
  useEffect(() => {
    if (!matchMedia('(hover:hover)').matches) return
    const f = e => { x.set(e.clientX + 16); y.set(e.clientY + 10) }
    addEventListener('pointermove', f, { passive: true })
    return () => removeEventListener('pointermove', f)
  }, [x, y])
  return (
    <motion.div className="cursor" style={{ x: sx, y: sy }} aria-hidden="true">
      <AnimatePresence>
        {label && (
          <motion.span key={label} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE_OUT }}>
            <i />{label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export const pad = n => String(n).padStart(2, '0')
