import { useLayoutEffect, useRef } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import gsap from 'gsap'
import { formats, gallery, poster, varieties, varietyOf, pfundClass } from './data.js'
import { Bars, EASE_OUT, Reveal, S, useApp, useT } from './ui.jsx'
import { HoneyGrid, SectionTitle } from './Shell.jsx'
import Unit3D from './Unit3D.jsx'

const P = {
  uses: { en: 'Best for', es: 'Ideal para' }, formats: { en: 'Formats', es: 'Formatos' },
  colour: { en: 'Colour', es: 'Color' }, season: { en: 'Harvest', es: 'Cosecha' }, origin: { en: 'Origin', es: 'Origen' },
  note: { en: 'Typical reading; every lot ships with its own analysis.', es: 'Lectura típica; cada lote se envía con su propio análisis.' },
  others: { en: 'THE OTHER\nHONEYS', es: 'LAS OTRAS\nMIELES' },
  packed: { en: 'Packed in\nAlzira – Valencia', es: 'Envasada en\nAlzira – Valencia' },
}

function Gallery({ v }) {
  const { setCursor } = useApp()
  const t = useT()
  const bounds = useRef(null)
  const ref = useRef(null)
  const slides = [{ jar: true, bg: v.color }, ...gallery.slice(0, 3).map(src => ({ src })), { jar: true, bg: '#111' }, ...gallery.slice(3).map(src => ({ src }))]
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo('.slide', { clipPath: 'inset(100% 0 0 0 round 18px)' }, {
          clipPath: 'inset(0% 0 0 0 round 18px)', duration: 1.4, ease: 'power4.out', stagger: 0.1,
          scrollTrigger: { trigger: ref.current, start: 'top 80%' },
        })
      })
    }, ref)
    return () => ctx.revert()
  }, [v.slug])
  return (
    <section className="gallery" ref={ref} aria-label={t({ en: 'Photos', es: 'Fotos' })}>
      <div className="gallery-bounds" ref={bounds} onMouseEnter={() => setCursor(t(S.drag))} onMouseLeave={() => setCursor(null)}>
        <motion.div className="gallery-track" drag="x" dragConstraints={bounds} dragElastic={0.08} dragTransition={{ power: 0.25, timeConstant: 300 }}>
          {slides.map((s, i) => (
            <div className="slide" key={i} style={s.bg ? { background: s.bg } : undefined}>
              {s.jar ? <img className="slide-jar" src={poster(v.slug)} alt="" draggable="false" /> : <img src={s.src} alt="" draggable="false" loading="lazy" />}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default function Honey({ slug, ready }) {
  const { addQuote, quote, settled } = useApp()
  const t = useT()
  const v = varietyOf(slug) ?? varieties[0]
  const reduce = useReducedMotion()
  const { scrollY } = useScroll()
  const jarY = useTransform(scrollY, [0, 700], reduce ? ['0vh', '0vh'] : ['0vh', '-30vh'])
  const jarS = useTransform(scrollY, [0, 700], [1, 0.84])
  const inQuote = quote.includes(v.slug)
  const name = t(v.n)
  const words = name.toUpperCase().split(' ')
  const half = Math.ceil(words.length / 2)
  const lines = [words.slice(0, half).join(' '), words.slice(half).join(' ')].filter(Boolean)
  const br = s => s.split('\n').flatMap((x, i) => (i ? [<br key={i} />, x] : [x]))

  return (
    <>
      <section className="phero" key={v.slug} style={{ '--c': v.color }}>
        <h1 className="ptitle" aria-label={name}>
          {lines.map((l, i) => <Reveal key={l} as="span" className="line" play={ready} delay={0.15 + i * 0.12} split="chars" stagger={0.025}>{l}</Reveal>)}
        </h1>
        <div className="side-labels">
          <motion.span initial={{ opacity: 0 }} animate={ready ? { opacity: 1 } : undefined} transition={{ delay: 0.8 }}>Pfund {v.pfund} mm<br />{t(pfundClass(v.pfund))}</motion.span>
          <motion.span initial={{ opacity: 0 }} animate={ready ? { opacity: 1 } : undefined} transition={{ delay: 0.9 }}>{br(t(P.packed))}</motion.span>
        </div>
        <motion.div className="pjar" style={{ y: jarY, scale: jarS }}>
          <motion.div initial={{ y: '60vh' }} animate={ready ? { y: '0vh' } : undefined} transition={{ duration: 1.6, ease: EASE_OUT, delay: 0.3 }}>
            <Unit3D variety={v} format={v.format} poster={poster(v.slug)} play={ready && settled}
              alt={t({ en: `A jar of ${name}, shown in 3D. Drag to turn it.`, es: `Un envase de ${name} en 3D. Arrástralo para girarlo.` })} />
          </motion.div>
        </motion.div>
      </section>

      <section className="pinfo">
        <Bars />
        <motion.p className="pdesc" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1, ease: EASE_OUT }}>{t(v.desc)}</motion.p>
        <Bars />
        <div className="facts">
          <div><h4>{t(P.uses)}</h4><p>{t(v.uses)}</p><h4 className="mt">{t(P.origin)}</h4><p>{t(v.origin)} · {t(v.season)}</p></div>
          <div>
            <h4>{t(P.colour)}</h4>
            <p className="pf-read">Pfund {v.pfund} mm<br /><small>{t(pfundClass(v.pfund))}</small></p>
            <span className="pf-bar" style={{ '--x': `${Math.min(v.pfund, 150) / 150 * 100}%` }}><i /></span>
            <p className="pf-note">{t(P.note)}</p>
          </div>
          <div><h4>{t(P.formats)}</h4><div className="sizes">{formats.map(f => <span key={f.key}>{t(f.n)}</span>)}</div></div>
          <div className="buy">
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }} onClick={() => addQuote(v)} aria-pressed={inQuote} className={inQuote ? 'in' : ''}>
              {t(inQuote ? S.inQuote : S.addQuote)}
            </motion.button>
          </div>
        </div>
      </section>

      <Gallery v={v} />

      <section className="others">
        <SectionTitle>{t(P.others)}</SectionTitle>
        <HoneyGrid items={varieties.filter(x => x.slug !== v.slug).slice(0, 4)} />
      </section>
    </>
  )
}
