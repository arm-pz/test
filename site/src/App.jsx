import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence, useAnimate } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { AppCtx, Cursor, EASE, S } from './ui.jsx'
import { Header, Menu, Footer, QuoteDrawer } from './Shell.jsx'
import Home from './Home.jsx'
import Honey from './Honey.jsx'
import { varieties } from './data.js'
import crown from '@assets/crown.png'

gsap.registerPlugin(ScrollTrigger)

// Routes are plain #slug hashes ('' = home) so they also work inside the artifact viewer.
const parse = () => { const h = location.hash.slice(1); return varieties.some(v => v.slug === h) ? h : '' }
const store = {
  get: k => { try { return localStorage.getItem(k) } catch { return null } },
  set: (k, v) => { try { localStorage.setItem(k, v) } catch { /* private mode */ } },
}

// Black screen, Reina's crown, and its two bars filling up in gold.
function Loader({ onDone }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    let v = 0
    const id = setInterval(() => {
      v = Math.min(100, v + Math.ceil(Math.random() * 9))
      setN(v)
      if (v === 100) { clearInterval(id); setTimeout(onDone, 350) }
    }, 70)
    return () => clearInterval(id)
  }, [onDone])
  return (
    <motion.div className="loader" exit={{ clipPath: 'inset(0 0 100% 0)' }} transition={{ duration: 1.1, ease: EASE }} aria-hidden="true">
      <img src={crown} alt="" className="loader-crown" />
      <span className="loader-bars"><i style={{ transform: `scaleX(${Math.min(1, n / 50)})` }} /><i style={{ transform: `scaleX(${Math.max(0, (n - 50) / 50)})` }} /></span>
      <span className="loader-n">{n}</span>
    </motion.div>
  )
}

export default function App() {
  const [route, setRoute] = useState(parse)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [quoteOpen, setQuoteOpen] = useState(false)
  const [cursor, setCursor] = useState(null)
  const [quote, setQuote] = useState([])
  const [toast, setToast] = useState(null)
  const [lang, setLangState] = useState(() => store.get('reina-lang') === 'es' ? 'es' : (store.get('reina-lang') ? 'en' : (navigator.language?.startsWith('es') ? 'es' : 'en')))
  const lenis = useRef(null)
  const [cover, animateCover] = useAnimate()
  const busy = useRef(false)
  const pendingAnchor = useRef(null)
  const [introGone, setIntroGone] = useState(false)
  const [moving, setMoving] = useState(false)
  const [covered, setCovered] = useState(false)

  const setLang = useCallback(l => { setLangState(l); store.set('reina-lang', l) }, [])
  useEffect(() => { document.documentElement.lang = lang }, [lang])

  // Lenis smooth scroll driven by GSAP's ticker so ScrollTrigger and framer's useScroll stay in sync
  useEffect(() => {
    history.scrollRestoration = 'manual'
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const l = new Lenis({ lerp: 0.085 })
    lenis.current = l
    l.on('scroll', ScrollTrigger.update)
    const tick = t => l.raf(t * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    return () => { gsap.ticker.remove(tick); l.destroy(); lenis.current = null }
  }, [])

  useEffect(() => {
    const lock = loading || open || quoteOpen
    document.documentElement.classList.toggle('lock', lock)
    lock ? lenis.current?.stop() : lenis.current?.start()
  }, [loading, open, quoteOpen])

  const scrollToAnchor = useCallback(a => {
    const el = document.querySelector(a)
    if (!el) return
    lenis.current ? lenis.current.scrollTo(el, { duration: 1.6 }) : el.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Page transition: a black curtain rises, the page swaps underneath, the curtain leaves upward.
  const swap = useCallback(async next => {
    if (busy.current) return
    busy.current = true
    setMoving(true)
    setOpen(false)
    await animateCover(cover.current, { clipPath: ['inset(100% 0 0 0)', 'inset(0% 0 0 0)'] }, { duration: 0.8, ease: EASE })
    setCovered(true)
    lenis.current?.scrollTo(0, { immediate: true, force: true })
    scrollTo(0, 0)
    setRoute(next)
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
    ScrollTrigger.refresh()
    if (pendingAnchor.current) {
      const el = document.querySelector(pendingAnchor.current); pendingAnchor.current = null
      if (el) { const y = el.getBoundingClientRect().top + scrollY; lenis.current?.scrollTo(y, { immediate: true, force: true }); scrollTo(0, y) }
    }
    setCovered(false)
    await animateCover(cover.current, { clipPath: ['inset(0 0 0% 0)', 'inset(0 0 100% 0)'] }, { duration: 0.9, ease: EASE })
    busy.current = false
    setMoving(false)
    // the visitor may have pressed Back/Forward while the curtain was moving: catch up with the URL
    const latest = parse()
    if (latest !== next) swap(latest)
  }, [animateCover, cover])

  useEffect(() => {
    const f = () => { const r = parse(); if (r !== route) swap(r) }
    addEventListener('hashchange', f)
    return () => removeEventListener('hashchange', f)
  }, [route, swap])

  // navigate('slug') opens a honey; navigate('', '#section') goes to a home section
  const navigate = useCallback((to, anchor) => {
    if (anchor) {
      setOpen(false)
      if (route === '') { scrollToAnchor(anchor); return }
      pendingAnchor.current = anchor
      if (location.hash) history.pushState(null, '', location.pathname + location.search)
      swap('')
      return
    }
    if (to === route) { lenis.current?.scrollTo(0); return }
    if (to === '') { history.pushState(null, '', location.pathname + location.search); swap(''); return }
    location.hash = to
  }, [route, swap, scrollToAnchor])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  const done = useCallback(() => { setLoading(false); requestAnimationFrame(() => ScrollTrigger.refresh()) }, [])
  const addQuote = useCallback(v => {
    setQuote(q => q.includes(v.slug) ? q : [...q, v.slug])
    setToast(`${v.n[lang]} ${S.added[lang]}`)
  }, [lang])
  const removeQuote = useCallback(slug => setQuote(q => q.filter(s => s !== slug)), [])

  const ctx = useMemo(() => ({
    navigate, lenis, setCursor, lang, setLang, quote, addQuote, removeQuote,
    openQuote: () => setQuoteOpen(true), settled: introGone && !moving,
  }), [navigate, lang, setLang, quote, addQuote, removeQuote, introGone, moving])

  return (
    <AppCtx.Provider value={ctx}>
      <AnimatePresence onExitComplete={() => setIntroGone(true)}>{loading && <Loader key="loader" onDone={done} />}</AnimatePresence>
      <Header open={open} setOpen={setOpen} />
      <Menu open={open} close={() => setOpen(false)} />
      <QuoteDrawer open={quoteOpen} close={() => setQuoteOpen(false)} />
      <main key={route}>
        {route ? <Honey slug={route} ready={!loading && !covered} /> : <Home ready={!loading && !covered} />}
      </main>
      <Footer />
      <div className="curtain" ref={cover} aria-hidden="true" />
      <Cursor label={cursor} />
      <AnimatePresence>
        {toast && <motion.div className="toast" role="status" initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}>{toast}</motion.div>}
      </AnimatePresence>
    </AppCtx.Provider>
  )
}
