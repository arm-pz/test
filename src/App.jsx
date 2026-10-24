import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import Glass from './components/Glass.jsx'
import LiquidLogo from './components/LiquidLogo.jsx'
import HeroGradient from './components/HeroGradient.jsx'

const Showcase3D = lazy(() => import('./components/Showcase3D.jsx'))

const clients = ['Halcyon', 'Ostra', 'Northwind', 'Vela', 'Kōyō', 'Atlas & Co', 'Fieldnote', 'Lumen Labs']

const services = [
  {
    no: '01',
    title: 'Real-time 3D',
    body: 'WebGL product worlds built with React Three Fiber — configurators, launches and scroll stories that run at 60fps on a phone.',
  },
  {
    no: '02',
    title: 'Interface craft',
    body: 'Liquid glass, refraction and motion systems that feel native to the device, not bolted on top of it.',
  },
  {
    no: '03',
    title: 'Generative identity',
    body: 'Shader-driven gradients and living logos that never render the same frame twice.',
  },
  {
    no: '04',
    title: 'Launch engineering',
    body: 'Performance budgets, accessibility and analytics, shipped on infrastructure your team can own.',
  },
]

const work = [
  { name: 'Halcyon', tag: 'Product launch · WebGL', year: '2026', hue: 'w1' },
  { name: 'Ostra Audio', tag: '3D configurator', year: '2026', hue: 'w2' },
  { name: 'Northwind', tag: 'Brand system · Shader', year: '2025', hue: 'w3' },
  { name: 'Vela Studio', tag: 'Site · Motion', year: '2025', hue: 'w4' },
]

const steps = [
  ['Discover', 'Two-week sprint: audience, story, technical constraints and a moodboard you can feel.'],
  ['Prototype', 'Interactive proof in the browser by week three. We argue with real pixels, not decks.'],
  ['Build', 'Production React, shaders and CMS. Weekly preview links and a shared performance dashboard.'],
  ['Launch', 'QA across 40+ devices, launch-day support and a 30-day tuning window.'],
]

const plans = [
  {
    name: 'Signature Site',
    price: '$10,000',
    note: 'Fixed scope · 4–5 weeks',
    features: [
      'Up to 6 bespoke pages',
      'Shader gradient hero & liquid logo',
      'Liquid glass UI system',
      'CMS, SEO & analytics setup',
      '30 days post-launch support',
    ],
    featured: true,
  },
  {
    name: 'Immersive Launch',
    price: '$28,000',
    note: 'From · 8 weeks',
    features: [
      'Everything in Signature',
      'Custom real-time 3D scene',
      'Scroll-driven storytelling',
      'Product configurator',
      'Performance budget & audit',
    ],
  },
  {
    name: 'Partnership',
    price: 'Retainer',
    note: 'Monthly · ongoing',
    features: [
      'Dedicated creative technologist',
      'Campaign microsites',
      'Design system stewardship',
      'Priority turnaround',
    ],
  },
]

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]')
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in')
            io.unobserve(e.target)
          }
        }),
      { threshold: 0.15 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}

function Nav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
      <Glass radius={999} innerClassName="nav-pill" displacementScale={48}>
        <a href="#top" className="nav-brand">
          <span className="brand-dot" /> Meridian
        </a>
        <nav className="nav-links">
          <a href="#work">Work</a>
          <a href="#services">Services</a>
          <a href="#process">Process</a>
          <a href="#pricing">Pricing</a>
        </nav>
        <a href="#contact" className="nav-cta">
          Start a project
        </a>
      </Glass>
    </header>
  )
}

function Hero() {
  const ref = useRef(null)
  return (
    <section id="top" className="hero" ref={ref}>
      <div className="hero-bg">
        <HeroGradient variant="hero" />
      </div>
      <div className="hero-content">
        <p className="eyebrow">Immersive digital studio — est. 2019</p>
        <LiquidLogo text="Meridian" aspect={3.4} className="hero-logo" />
        <p className="hero-sub">
          We design and engineer real-time web experiences for brands that would rather be felt than
          scrolled past.
        </p>
        <div className="hero-actions">
          <Glass radius={999} innerClassName="btn-glass" mouseContainer={ref}>
            <a href="#pricing">Sites from $10k →</a>
          </Glass>
          <a href="#work" className="btn-ghost">
            See selected work
          </a>
        </div>
      </div>
      <div className="hero-foot">
        <span>Scroll</span>
        <span className="mono">48.8566° N · 2.3522° E</span>
        <span>Awwwards SOTD ×14</span>
      </div>
    </section>
  )
}

function Marquee() {
  const row = [...clients, ...clients]
  return (
    <section className="marquee" aria-label="Clients">
      <div className="marquee-track">
        {row.map((c, i) => (
          <span key={i}>{c}</span>
        ))}
      </div>
    </section>
  )
}

function Intro() {
  return (
    <section className="intro container">
      <p className="intro-text" data-reveal>
        Meridian is a team of eleven designers and creative technologists. We build websites that
        behave like <em>objects</em> — with weight, light and surface — using the same tools that
        power games and film, tuned for the browser.
      </p>
      <div className="stats" data-reveal>
        <div>
          <strong>120+</strong>
          <span>launches shipped</span>
        </div>
        <div>
          <strong>60fps</strong>
          <span>median on mid-range mobile</span>
        </div>
        <div>
          <strong>3.4×</strong>
          <span>avg. time-on-page lift</span>
        </div>
      </div>
    </section>
  )
}

function Services() {
  const ref = useRef(null)
  return (
    <section id="services" className="services" ref={ref}>
      <div className="services-bg">
        <HeroGradient variant="services" />
      </div>
      <div className="container">
        <header className="section-head" data-reveal>
          <p className="eyebrow">Services</p>
          <h2>
            Four disciplines, <em>one surface.</em>
          </h2>
        </header>
        <div className="service-grid">
          {services.map((s) => (
            <div key={s.no} data-reveal>
              <Glass radius={28} innerClassName="service-card" mouseContainer={ref} elasticity={0.05}>
                <span className="mono">{s.no}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </Glass>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Showcase() {
  const [show, setShow] = useState(false)
  const [visible, setVisible] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => {
        setVisible(e.isIntersecting)
        if (e.isIntersecting) setShow(true)
      },
      { rootMargin: '200px' },
    )
    io.observe(ref.current)
    return () => io.disconnect()
  }, [])
  return (
    <section className="showcase" ref={ref}>
      <div className="showcase-stage">
        {show && (
          <Suspense fallback={null}>
            <Showcase3D active={visible} />
          </Suspense>
        )}
      </div>
      <div className="showcase-caption container">
        <p className="eyebrow">Live · React Three Fiber</p>
        <p>
          Glass that refracts the page behind it, rendered in your browser right now. Move your cursor.
        </p>
      </div>
    </section>
  )
}

function Work() {
  return (
    <section id="work" className="work container">
      <header className="section-head" data-reveal>
        <p className="eyebrow">Selected work</p>
        <h2>
          Recent <em>launches</em>
        </h2>
      </header>
      <div className="work-grid">
        {work.map((w) => (
          <a key={w.name} href="#contact" className="work-card" data-reveal>
            <div className={`work-thumb ${w.hue}`}>
              <span className="work-orb" />
            </div>
            <div className="work-meta">
              <h3>{w.name}</h3>
              <span>{w.tag}</span>
              <span className="mono">{w.year}</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}

function Process() {
  return (
    <section id="process" className="process container">
      <header className="section-head" data-reveal>
        <p className="eyebrow">Process</p>
        <h2>
          Five weeks from <em>brief</em> to live.
        </h2>
      </header>
      <ol className="steps">
        {steps.map(([t, b], i) => (
          <li key={t} data-reveal>
            <span className="mono">0{i + 1}</span>
            <h3>{t}</h3>
            <p>{b}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

function Pricing() {
  const ref = useRef(null)
  return (
    <section id="pricing" className="pricing" ref={ref}>
      <div className="pricing-bg" />
      <div className="container">
        <header className="section-head" data-reveal>
          <p className="eyebrow">Engagements</p>
          <h2>
            Clear scope. <em>No surprises.</em>
          </h2>
        </header>
        <div className="plan-grid">
          {plans.map((p) => (
            <div key={p.name} data-reveal className={p.featured ? 'plan-wrap featured' : 'plan-wrap'}>
              <Glass radius={32} innerClassName="plan" mouseContainer={ref} elasticity={0.04}>
                {p.featured && <span className="badge">Most chosen</span>}
                <h3>{p.name}</h3>
                <div className="price">{p.price}</div>
                <span className="mono note">{p.note}</span>
                <ul>
                  {p.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <a href="#contact" className={p.featured ? 'btn-solid' : 'btn-line'}>
                  Book a call
                </a>
              </Glass>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Quote() {
  return (
    <section className="quote container" data-reveal>
      <blockquote>
        “Meridian turned a product page into the thing people screenshot and send to each other. Our
        launch traffic converted at twice the rate of anything we’ve shipped.”
      </blockquote>
      <cite>
        <strong>Lena Okafor</strong> — VP Brand, Halcyon
      </cite>
    </section>
  )
}

function Contact() {
  const ref = useRef(null)
  const [sent, setSent] = useState(false)
  return (
    <section id="contact" className="contact" ref={ref}>
      <div className="contact-bg">
        <HeroGradient variant="hero" />
      </div>
      <div className="container contact-inner">
        <h2 data-reveal>
          Let’s build something <em>people remember.</em>
        </h2>
        <Glass radius={32} innerClassName="contact-card" mouseContainer={ref} elasticity={0.03}>
          {sent ? (
            <p className="sent">Thanks — we’ll reply within one business day.</p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                setSent(true)
              }}
            >
              <label>
                Name
                <input required placeholder="Ada Lovelace" />
              </label>
              <label>
                Email
                <input required type="email" placeholder="ada@company.com" />
              </label>
              <label className="full">
                Budget
                <select defaultValue="10">
                  <option value="10">$10k – $25k</option>
                  <option value="25">$25k – $50k</option>
                  <option value="50">$50k+</option>
                </select>
              </label>
              <label className="full">
                Project
                <textarea rows={3} placeholder="Tell us about the launch…" />
              </label>
              <button type="submit" className="btn-solid full">
                Send enquiry
              </button>
            </form>
          )}
        </Glass>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="footer container">
      <span>© 2026 Meridian Studio</span>
      <span className="mono">hello@meridian.studio</span>
      <nav>
        <a href="#top">Instagram</a>
        <a href="#top">Read.cv</a>
        <a href="#top">GitHub</a>
      </nav>
    </footer>
  )
}

export default function App() {
  useReveal()
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <Intro />
        <Services />
        <Showcase />
        <Work />
        <Process />
        <Pricing />
        <Quote />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
