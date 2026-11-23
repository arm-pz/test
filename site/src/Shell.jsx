import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion'
import gsap from 'gsap'
import { contact, formats, img, poster, varieties, varietyOf } from './data.js'
import { EASE, EASE_OUT, Link, Reveal, S, useApp, useT } from './ui.jsx'

const L = {
  honeys: { en: 'Our honeys', es: 'Nuestras mieles' }, formats: { en: 'Retail & industry', es: 'Retail e industria' },
  facilities: { en: 'Facilities', es: 'Instalaciones' }, journal: { en: 'Journal', es: 'Blog' }, contact: { en: 'Contact', es: 'Contacto' },
  home: { en: 'Home', es: 'Inicio' },
}

export function Header({ open, setOpen }) {
  const { quote, openQuote, lang, setLang } = useApp()
  const t = useT()
  const { scrollY } = useScroll()
  const [hidden, setHidden] = useState(false)
  // slide away while scrolling down, come back as soon as the visitor scrolls up
  useMotionValueEvent(scrollY, 'change', y => setHidden(y > (scrollY.getPrevious() ?? 0) && y > 160))
  // a honey was just added: bring the header back so the quote count (and button) is in view
  useEffect(() => { setHidden(false) }, [quote.length])
  return (
    <motion.header className={`top ${open ? 'is-open' : ''}`} animate={{ y: hidden && !open ? '-120%' : '0%' }} transition={{ duration: 0.6, ease: EASE }}>
      <div className="top-left" role="group" aria-label="Language / Idioma">
        {['en', 'es'].map(l => (
          <button key={l} className={`chip ${lang === l ? 'on' : ''}`} aria-pressed={lang === l} onClick={() => setLang(l)}>{l.toUpperCase()}</button>
        ))}
      </div>
      <Link to="" className="brand" aria-label="Reina Apícola">
        <img src={open ? img.logoWhite : img.logo} alt="" />
      </Link>
      <div className="top-right">
        <button className="bag" onClick={openQuote} aria-label={`${t(S.quote)}: ${quote.length}`}>
          <span className="bag-t">{t(S.quote)}</span>
          <motion.b key={quote.length} initial={{ scale: 1.8 }} animate={{ scale: 1 }}>{quote.length}</motion.b>
        </button>
        <button className="menu-pill" aria-expanded={open} aria-controls="menu" onClick={() => setOpen(o => !o)}>
          {t(open ? S.close : S.menu)}<i />
        </button>
      </div>
    </motion.header>
  )
}

export function Menu({ open, close }) {
  const t = useT()
  const links = [['#honeys', L.honeys], ['#formats', L.formats], ['#facilities', L.facilities], ['#journal', L.journal], ['#contact', L.contact]]
  return (
    <AnimatePresence>
      {open && (
        <motion.div id="menu" className="menu" initial={{ clipPath: 'inset(0 0 100% 0)' }} animate={{ clipPath: 'inset(0 0 0% 0)' }}
          exit={{ clipPath: 'inset(0 0 100% 0)' }} transition={{ duration: 0.9, ease: EASE }}>
          <nav aria-label="Main">
            {links.map(([href, label], i) => (
              <div className="mask" key={href}>
                <motion.div initial={{ y: '110%' }} animate={{ y: 0 }} exit={{ y: '110%' }} transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.3 + i * 0.06 }}>
                  <Link href={href} onClick={close}><em>0{i + 1}</em>{t(label)}</Link>
                </motion.div>
              </div>
            ))}
          </nav>
          <motion.div className="menu-honeys" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 0.5 }}>
            {varieties.map(v => <Link key={v.slug} to={v.slug} onClick={close} style={{ '--c': v.color }}><i />{t(v.n)}</Link>)}
          </motion.div>
          <motion.div className="menu-foot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 0.6 }}>
            <p>Calle Ferrers, 13<br />46600 Alzira, Valencia</p>
            <p>{contact.email}<br />{contact.phone}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const Q = {
  title: { en: 'Your quote request', es: 'Tu solicitud de presupuesto' },
  empty: { en: 'Nothing here yet. Open a honey and choose “Add to quote”.', es: 'Aún no hay nada. Abre una miel y pulsa «Añadir al presupuesto».' },
  notes: { en: 'Formats, volumes and destination', es: 'Formatos, volúmenes y destino' },
  notesPh: { en: 'e.g. 20,000 × 450 g smooth jars, own label, delivery to Rotterdam', es: 'p. ej. 20.000 tarros lisos de 450 g, marca propia, entrega en Róterdam' },
  send: { en: 'Email this request', es: 'Enviar por email' },
  or: { en: 'Or write to', es: 'O escríbenos a' },
  remove: { en: 'Remove', es: 'Quitar' }, copy: { en: 'Copy', es: 'Copiar' }, copied: { en: 'Copied', es: 'Copiado' },
}

// The quote list: honeys added from their pages, plus a note, sent as an email to Reina.
export function QuoteDrawer({ open, close }) {
  const { quote, removeQuote, lang } = useApp()
  const t = useT()
  const [notes, setNotes] = useState('')
  const [copied, setCopied] = useState(false)
  const items = quote.map(varietyOf)
  const body = `${t(Q.title)}\n\n${items.map(v => `- ${t(v.n)}`).join('\n')}\n\n${notes}`
  const mail = `mailto:${contact.email}?subject=${encodeURIComponent(lang === 'es' ? 'Solicitud de presupuesto' : 'Quote request')}&body=${encodeURIComponent(body)}`
  const copy = async () => {
    try { await navigator.clipboard.writeText(contact.email); setCopied(true); setTimeout(() => setCopied(false), 1600) } catch { /* select by hand */ }
  }
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} />
          <motion.aside className="quote" role="dialog" aria-modal="true" aria-label={t(Q.title)}
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.7, ease: EASE }}
            onKeyDown={e => e.key === 'Escape' && close()}>
            <div className="quote-head"><h2>{t(Q.title)}</h2><button className="x" onClick={close} aria-label={t(S.close)}>×</button></div>
            {items.length === 0 ? <p className="quote-empty">{t(Q.empty)}</p> : (
              <ul className="quote-list">
                {items.map(v => (
                  <li key={v.slug} style={{ '--c': v.color }}>
                    <img src={poster(v.slug)} alt="" />
                    <span><b>{t(v.n)}</b><small>Pfund {v.pfund} mm · {t(v.origin)}</small></span>
                    <button onClick={() => removeQuote(v.slug)}>{t(Q.remove)}</button>
                  </li>
                ))}
              </ul>
            )}
            <label className="quote-notes" htmlFor="quote-notes">{t(Q.notes)}
              <textarea id="quote-notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder={t(Q.notesPh)} rows={4} />
            </label>
            <a className="btn" href={mail}>{t(Q.send)}</a>
            <p className="quote-alt">{t(Q.or)} <span className="sel">{contact.email}</span> <button onClick={copy}>{t(copied ? Q.copied : Q.copy)}</button></p>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

// Honey cards; hovering lifts the jar and fills the card with the honey's colour from the bottom.
export function HoneyGrid({ items }) {
  const t = useT()
  return (
    <>
      <div className="pgrid">
        {items.map((v, i) => (
          <motion.div key={v.slug} initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-5%' }}
            transition={{ duration: 1, ease: EASE_OUT, delay: (i % 4) * 0.08 }}>
            <Link to={v.slug} className="pcard" cursor={t(S.discover)} style={{ '--c': v.color }}>
              <span className="fillup" aria-hidden="true" />
              <img src={poster(v.slug)} alt="" loading="lazy" />
              <span className="pcard-meta"><b>{t(v.n)}</b><small>Pfund {v.pfund} mm · {t(v.origin)}</small></span>
            </Link>
          </motion.div>
        ))}
      </div>
      {items.length > 2 && <p className="swipe-hint" aria-hidden="true">{t(S.swipe)}</p>}
    </>
  )
}

const F = { retail: { en: 'Retail', es: 'Retail' }, industry: { en: 'Industry', es: 'Industria' }, avail: { en: 'Available in', es: 'Disponible en' } }
export function FormatGrid() {
  const t = useT()
  return (
    <div className="fgrid">
      {formats.map((f, i) => (
        <motion.article key={f.key} className={`fcard ${f.kind}`} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-5%' }} transition={{ duration: 1, ease: EASE_OUT, delay: (i % 3) * 0.08 }}>
          <span className="fkind">{t(F[f.kind])}</span>
          <img src={poster(`format-${f.key}`)} alt="" loading="lazy" />
          <h3>{t(f.n)}</h3>
          <p><span>{t(F.avail)}</span><b>{f.sizes}</b></p>
        </motion.article>
      ))}
    </div>
  )
}

const FT = {
  tag: { en: 'Importers, exporters and packers of high-quality honey since 1941.', es: 'Importadores, exportadores y envasadores de miel de alta calidad desde 1941.' },
  visit: { en: 'Visit', es: 'Visítanos' }, write: { en: 'Say hello', es: 'Escríbenos' },
  writeP: { en: 'Tell us the honey, the format and the volume, and we will come back with a proposal.', es: 'Cuéntanos la miel, el formato y el volumen, y te enviaremos una propuesta.' },
  legal: { en: 'Legal notice · Privacy · Cookies', es: 'Aviso legal · Privacidad · Cookies' },
}
export function Footer() {
  const ref = useRef(null)
  const t = useT()
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo('.giant .l', { yPercent: 105 }, {
          yPercent: 0, stagger: 0.05, ease: 'none',
          scrollTrigger: { trigger: ref.current, start: 'top 90%', end: 'top 20%', scrub: 1 },
        })
        gsap.fromTo('.giant .giant-bars i', { scaleX: 0 }, {
          scaleX: 1, stagger: 0.15, ease: 'none',
          scrollTrigger: { trigger: ref.current, start: 'top 60%', end: 'top 10%', scrub: 1 },
        })
      })
    }, ref)
    return () => ctx.revert()
  }, [])
  return (
    <footer className="foot" ref={ref} id="contact">
      <div className="giant">
        <span className="sr">Reina Apícola</span>
        <div className="giant-bars" aria-hidden="true"><i /><i /></div>
        <div className="giant-line" aria-hidden="true">{'reina'.split('').map((c, i) => <span className="mask" key={i}><span className="l">{c}</span></span>)}</div>
      </div>
      <div className="foot-cols">
        <div className="foot-brand">
          <img src={img.logoWhite} alt="" />
          <p>{t(FT.tag)}</p>
        </div>
        <nav aria-label="Footer">
          {varieties.map(v => <Link key={v.slug} to={v.slug}>{t(v.n)}</Link>)}
        </nav>
        <div>
          <h4>{t(FT.visit)}</h4>
          <p>Calle Ferrers, 13<br />46600 Alzira<br />Valencia, {t({ en: 'Spain', es: 'España' })}</p>
        </div>
        <div>
          <h4>{t(FT.write)}</h4>
          <p>{t(FT.writeP)}</p>
          <a className="gold" href={`mailto:${contact.email}`}>{contact.email}</a>
          <a href="tel:+34962455171">{contact.phone}</a>
        </div>
      </div>
      <div className="legal"><span>© 2026 Reina Apícola Levantina S.L. · {t(FT.legal)}</span><Link href="#">{t(S.backTop)}</Link></div>
    </footer>
  )
}

export function SectionTitle({ children, sub, tone }) {
  return (
    <div className={`stitle ${tone ?? ''}`}>
      {sub && <p className="eyebrow">{sub}</p>}
      <h2>{children.split('\n').map((l, i) => <Reveal key={l + i} as="span" className="line" delay={i * 0.12}>{l}</Reveal>)}</h2>
    </div>
  )
}
