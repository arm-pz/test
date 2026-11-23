import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform, useSpring, useMotionValueEvent, useReducedMotion } from 'framer-motion'
import gsap from 'gsap'
import { facts, formatOf, img, line, posts, poster, steps, tests, varieties, varietyOf, pfundClass, teamLine, teamWarehouse, teamOffice } from './data.js'
import { lineState } from './models.js'
import { Bars, EASE_OUT, Reveal, S, pad, useApp, useT } from './ui.jsx'
import { FormatGrid, HoneyGrid, SectionTitle } from './Shell.jsx'
import Line3D from './Line3D.jsx'

/* ------------------------------------------------------------------ hero: the packing line */

const H = {
  eyebrow: { en: 'Importers · Exporters · Packers since 1941', es: 'Importadores · Exportadores · Envasadores desde 1941' },
  title1: { en: 'Packed to', es: 'Envasada a' }, title2: { en: 'your brief', es: 'tu medida' },
  title3: { en: 'in Alzira, Valencia', es: 'en Alzira, Valencia' },
}

function Hero({ ready }) {
  const wrap = useRef(null)
  const t = useT()
  const { settled } = useApp()
  const reduce = useReducedMotion()
  const n = line.length
  const { scrollYProgress } = useScroll({ target: wrap, offset: ['start start', 'end end'] })
  const smooth = useSpring(scrollYProgress, { stiffness: 70, damping: 24, mass: 0.6 })
  const pos = useTransform(reduce ? scrollYProgress : smooth, [0, 1], [0, n - 1])
  const [state, setState] = useState(() => lineState(0, n))
  useMotionValueEvent(pos, 'change', v => {
    const s = lineState(v, n)
    setState(p => (p.active === s.active && p.phase === s.phase ? p : s))
  })
  const progress = useTransform(pos, v => `${(v / (n - 1)) * 100}%`)
  const [live, setLive] = useState(false)
  const [failed, setFailed] = useState(false)
  const onLive = useCallback(() => setLive(true), [])
  const onFail = useCallback(() => setFailed(true), [])

  const item = line[state.active]
  const v = varietyOf(item.v), f = formatOf(item.f)

  return (
    <section className="hero" ref={wrap} style={{ height: `${n * 70 + 100}vh` }} aria-label={t({ en: 'Our packing line', es: 'Nuestra línea de envasado' })}>
      <div className="hero-stage">
        <div className={`ghost ${state.phase}`} aria-hidden="true" key={v.slug}>{v.es}</div>
        <motion.div className="hero-3d" initial={{ y: '35vh', opacity: 0 }} animate={ready ? { y: 0, opacity: 1 } : undefined} transition={{ duration: 1.6, ease: EASE_OUT, delay: 0.2 }}>
          <Line3D pos={pos} play={ready && settled} onLive={onLive} onFail={onFail} />
          {(!live || failed) && <img className="hero-poster" src={poster(`${item.f === v.format ? v.slug : 'format-' + item.f}`)} alt="" />}
        </motion.div>
        <div className={`hero-intro ${state.active > 0 || state.phase !== 'packed' ? 'moved' : ''}`}>
          <div>
            <p className="eyebrow">{t(H.eyebrow)}</p>
            <h1>
              <Reveal as="span" className="line" play={ready} delay={0.3}>{t(H.title1) + ' ' + t(H.title2)}</Reveal>
              <Reveal as="span" className="line light" play={ready} delay={0.45}>{t(H.title3)}</Reveal>
            </h1>
          </div>
          <motion.div className="rate" initial={{ opacity: 0 }} animate={ready ? { opacity: 1 } : undefined} transition={{ delay: 1 }}>
            <b>6,000</b>{t(S.unitsHour)}
          </motion.div>
        </div>
        <motion.div className="readout" initial={{ opacity: 0 }} animate={ready ? { opacity: 1 } : undefined} transition={{ delay: 1.2, duration: 1 }}>
          <div className="ro-name" aria-live="polite">
            <small>{pad(state.active + 1)} / {pad(n)} <span className={`phase ${state.phase}`}>{t(S.phase[state.phase])}</span></small>
            <b>{t(v.n)}</b>
            <span>{t(f.n)} · {f.sizes}</span>
          </div>
          <span className="scroll-cue">{t(S.scroll)}</span>
          <div className="ro-spec">
            <span>{t(S.lot)} <b>2611-{pad(state.active + 1)}</b></span>
            <span>{t(S.origin)} <b>{t(v.origin)}</b></span>
            <span className="pfund" style={{ '--x': `${Math.min(v.pfund, 150) / 150 * 100}%`, '--c': v.color }}>
              Pfund <b>{v.pfund} mm</b> · {t(pfundClass(v.pfund))}<i /></span>
          </div>
        </motion.div>
        <div className="hero-progress"><motion.i style={{ width: progress }} /></div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ manifesto */

const MANIFESTO = {
  en: 'Since 1941 we have bought honey across the world, proved it in our own laboratory and packed it exactly to each buyer’s brief, from a 300 g jar to a 1,400 kg tote.',
  es: 'Desde 1941 compramos miel en todo el mundo, la analizamos en nuestro propio laboratorio y la envasamos tal y como cada cliente la necesita, del tarro de 300 g al contenedor de 1.400 kg.',
}
const SIDES = { l: { en: 'Import, export\n& white label', es: 'Importación, exportación\ny marca blanca' }, r: { en: 'Packed in\nAlzira – Valencia', es: 'Envasada en\nAlzira – Valencia' } }

function Manifesto() {
  const ref = useRef(null)
  const { lang } = useApp()
  const t = useT()
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.mf-text .w', { opacity: 0.14 }, {
        opacity: 1, stagger: 0.1, ease: 'none',
        scrollTrigger: { trigger: '.mf-text', start: 'top 80%', end: 'bottom 50%', scrub: true },
      })
    }, ref)
    return () => ctx.revert()
  }, [lang])
  const br = s => s.split('\n').flatMap((x, i) => (i ? [<br key={i} />, x] : [x]))
  return (
    <section className="manifesto" ref={ref}>
      <div className="side-labels"><span>{br(t(SIDES.l))}</span><span>{br(t(SIDES.r))}</span></div>
      <Bars />
      <p className="mf-text">{t(MANIFESTO).split(' ').map((w, i) => <span className="w" key={lang + i}>{w} </span>)}</p>
      <Bars />
    </section>
  )
}

/* ------------------------------------------------------------------ band: the real line */

function Band() {
  const ref = useRef(null)
  const photo = useRef(null)
  const t = useT()
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const x1 = useTransform(scrollYProgress, [0, 1], reduce ? ['0%', '0%'] : ['10%', '-30%'])
  const x2 = useTransform(scrollYProgress, [0, 1], reduce ? ['0%', '0%'] : ['-30%', '5%'])
  const jarY = useTransform(scrollYProgress, [0, 1], reduce ? ['0%', '0%'] : ['40%', '-60%'])
  const jarR = useTransform(scrollYProgress, [0, 1], [-12, 8])
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(photo.current, { clipPath: 'inset(18% 22% 18% 22% round 32px)' }, {
          clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none',
          scrollTrigger: { trigger: ref.current, start: 'top 85%', end: 'top 10%', scrub: true },
        })
        gsap.fromTo(photo.current.querySelector('img'), { yPercent: -12, scale: 1.25 }, {
          yPercent: 12, scale: 1.05, ease: 'none',
          scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'bottom top', scrub: true },
        })
      })
    }, ref)
    return () => ctx.revert()
  }, [])
  return (
    <section className="band" ref={ref}>
      <div className="band-photo" ref={photo}><img src={img.lineFilled} alt={t({ en: 'Filled jars of honey moving along Reina’s packing line', es: 'Tarros de miel llenos avanzando por la línea de envasado de Reina' })} loading="lazy" /></div>
      <div className="band-words" aria-hidden="true">
        <motion.span style={{ x: x1 }}>{t({ en: 'From the hive', es: 'De la colmena' })}</motion.span>
        <motion.span style={{ x: x2 }}><em>{t({ en: 'to your pallet', es: 'a tu palé' })}</em></motion.span>
      </div>
      <motion.img className="band-jar" src={poster('orange-blossom')} alt="" style={{ y: jarY, rotate: jarR }} loading="lazy" />
    </section>
  )
}

/* ------------------------------------------------------------------ process */

function Step({ s, i }) {
  const ref = useRef(null)
  const t = useT()
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [80 + i * 30, -80 - i * 30])
  const imgY = useTransform(scrollYProgress, [0, 1], reduce ? ['0%', '0%'] : ['-15%', '15%'])
  return (
    <motion.article className="step" ref={ref} style={{ y }}>
      <div className="step-pic"><motion.img src={s.img} alt="" style={{ y: imgY }} loading="lazy" /></div>
      <span className="n">0{i + 1}</span>
      <h3>{t(s.t)}</h3>
      <p>{t(s.p)}</p>
    </motion.article>
  )
}

function Process() {
  const t = useT()
  return (
    <section className="process" id="process">
      <SectionTitle sub={t({ en: 'Hive to pallet', es: 'De la colmena al palé' })}>{t({ en: 'ONE PARTNER,\nFOUR STEPS', es: 'UN SOLO SOCIO,\nCUATRO PASOS' })}</SectionTitle>
      <div className="steps">{steps.map((s, i) => <Step key={i} s={s} i={i} />)}</div>
    </section>
  )
}

/* ------------------------------------------------------------------ facilities */

const FAC = [
  { img: img.capper, e: { en: 'Packaging line', es: 'Línea de envasado' }, h: { en: 'Automated from the first jar to the last pallet', es: 'Automatizada del primer tarro al último palé' }, p: { en: 'Filling, capping, labelling and palletising run on one line, so every unit is consistent in weight, seal and presentation.', es: 'Llenado, cerrado, etiquetado y paletizado en una sola línea, para que cada unidad sea igual en peso, cierre y presentación.' } },
  { img: img.warehouse, e: { en: 'Infrastructure', es: 'Infraestructura' }, h: { en: 'Room for a whole season’s harvest', es: 'Espacio para toda una cosecha' }, p: { en: 'More than 1,000 tonnes stored in drums and totes, managed by lot so freshness and traceability are kept from intake to dispatch.', es: 'Más de 1.000 toneladas en bidones y contenedores, gestionadas por lote para mantener la frescura y la trazabilidad de la entrada a la expedición.' } },
  { img: img.lab, e: { en: 'Own laboratory', es: 'Laboratorio propio' }, h: { en: 'Every lot proven before it is packed', es: 'Cada lote, analizado antes de envasarse' }, p: { en: 'Our team checks each honey for safety, authenticity and floral origin before it is approved.', es: 'Nuestro equipo comprueba la seguridad, la autenticidad y el origen floral de cada miel antes de aprobarla.' }, tests: true },
]

function Facilities() {
  const t = useT()
  const reduce = useReducedMotion()
  return (
    <section className="facilities" id="facilities">
      <div className="stats">
        {facts.map((f, i) => (
          <motion.div key={f.n} className="stat" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1, ease: EASE_OUT, delay: i * 0.07 }}>
            <b>{f.n}</b><span>{t(f.l)}</span>
          </motion.div>
        ))}
      </div>
      <SectionTitle sub={t({ en: 'Facilities', es: 'Instalaciones' })}>{t({ en: 'INSIDE\nALZIRA', es: 'DENTRO DE\nALZIRA' })}</SectionTitle>
      {FAC.map((b, i) => (
        <article className={`fac ${i % 2 ? 'flip' : ''}`} key={i}>
          <motion.div className="fac-pic" initial={reduce ? false : { clipPath: 'inset(12% 12% 12% 12% round 24px)' }} whileInView={{ clipPath: 'inset(0% 0% 0% 0% round 24px)' }}
            viewport={{ once: true, margin: '-10%' }} transition={{ duration: 1.4, ease: EASE_OUT }}>
            <img src={b.img} alt="" loading="lazy" />
          </motion.div>
          <div className="fac-text">
            <p className="eyebrow">{t(b.e)}</p>
            <h3>{t(b.h)}</h3>
            <p>{t(b.p)}</p>
            {b.tests && <ul className="tests">{tests.map(x => <li key={x.en}>{t(x)}</li>)}</ul>}
          </div>
        </article>
      ))}
      <div className="team" aria-label={t({ en: 'The Reina team', es: 'El equipo de Reina' })}>
        {[teamLine, teamWarehouse, teamOffice].map((src, i) => <img key={i} src={src} alt="" loading="lazy" />)}
        <p>{t({ en: 'The people who run the line, the warehouse and the office in Alzira.', es: 'Las personas que llevan la línea, el almacén y la oficina en Alzira.' })}</p>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ journal */

function Journal() {
  const t = useT()
  const { lang } = useApp()
  const fmt = d => new Date(d).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  return (
    <section className="journal" id="journal">
      <SectionTitle sub={t({ en: 'Journal', es: 'Blog' })}>{t({ en: 'MARKET\nNOTES', es: 'NOTAS DE\nMERCADO' })}</SectionTitle>
      <div className="posts">
        {posts.map(p => (
          <a className="post" key={p.date} href="https://reinaapicola.com/blogs" target="_blank" rel="noreferrer">
            <time dateTime={p.date}>{fmt(p.date)}</time>
            <span><b>{t(p.t)}</b><small>{t(p.p)}</small></span>
            <span className="arrow">→</span>
          </a>
        ))}
      </div>
    </section>
  )
}

export default function Home({ ready }) {
  const t = useT()
  return (
    <>
      <Hero ready={ready} />
      <Manifesto />
      <Band />
      <Process />
      <section className="others" id="honeys">
        <SectionTitle sub={t({ en: 'Honey catalogue', es: 'Catálogo de mieles' })}>{t({ en: 'OUR\nHONEYS', es: 'NUESTRAS\nMIELES' })}</SectionTitle>
        <HoneyGrid items={varieties} />
      </section>
      <section className="formats" id="formats">
        <SectionTitle sub={t({ en: 'Packaging', es: 'Envases' })} tone="dark">{t({ en: 'RETAIL &\nINDUSTRY', es: 'RETAIL E\nINDUSTRIA' })}</SectionTitle>
        <FormatGrid />
      </section>
      <Facilities />
      <Journal />
    </>
  )
}
