import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { makeRenderer, makeStudio, makeUnit, prepare } from './models.js'
import { S, useApp, useT } from './ui.jsx'

/**
 * One packed unit in 3D for a product page: full, capped, turning slowly on its own, following the
 * pointer a little and spun by dragging (with inertia). Shows `poster` until the first frame, and
 * keeps it if WebGL is unavailable. Waits for `play` (page settled) before setting up WebGL.
 */
export default function Unit3D({ variety, format, poster, alt, play }) {
  const host = useRef(null)
  const [live, setLive] = useState(false)
  const [failed, setFailed] = useState(false)
  const { setCursor } = useApp()
  const t = useT()

  useEffect(() => {
    if (!play) return
    let stop = () => {}, cancelled = false
    const idle = window.requestIdleCallback ?? (f => setTimeout(f, 50))
    const id = idle(async () => {
      await prepare()
      if (cancelled) return
      const el = host.current
      const canvas = document.createElement('canvas')
      let renderer
      try { renderer = makeRenderer(canvas) } catch { setFailed(true); return }
      const scene = await makeStudio(renderer)
      if (cancelled) { renderer.dispose(); return }
      canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', alt)
      el.appendChild(canvas)

      const u = makeUnit(variety, format)
      u.fill(1); u.cap(1)
      const box = new THREE.Box3().setFromObject(u.group)
      const size = box.getSize(new THREE.Vector3())
      const pivot = new THREE.Group(); u.group.position.y = -size.y / 2; pivot.add(u.group); scene.add(pivot)
      const camera = new THREE.PerspectiveCamera(22, 1, .1, 100)
      const span = Math.max(size.y, size.x * 1.05) * .62
      const dist = span / Math.tan(THREE.MathUtils.degToRad(11))
      camera.position.set(0, dist * .17, dist); camera.lookAt(0, 0, 0)

      let dirty = true
      const resize = () => {
        const { width, height } = el.getBoundingClientRect()
        if (!width || !height) return
        renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(width, height, false)
        camera.aspect = width / height; camera.updateProjectionMatrix(); dirty = true
      }
      const ro = new ResizeObserver(resize); ro.observe(el); resize()

      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
      let angle = -.35, vel = 0, drag = null, tx = 0, ty = 0, ax = 0, ay = 0, pose = ''
      const down = e => { drag = { x: e.clientX, t: performance.now() }; vel = 0; el.setPointerCapture(e.pointerId); el.classList.add('grabbing') }
      const move = e => {
        const b = el.getBoundingClientRect()
        ax = ((e.clientY - b.top) / b.height - .5) * .2
        ay = ((e.clientX - b.left) / b.width - .5) * .3
        if (!drag) return
        const now = performance.now(), dx = e.clientX - drag.x
        angle += dx * .012; vel = (dx * .012) / Math.max(now - drag.t, 1) * 1000; drag = { x: e.clientX, t: now }
      }
      const up = () => { drag = null; el.classList.remove('grabbing') }
      const leave = () => { ax = ay = 0 }
      const ev = [['pointerdown', down], ['pointermove', move], ['pointerup', up], ['pointercancel', up], ['pointerleave', leave]]
      ev.forEach(([n, f]) => el.addEventListener(n, f))

      let raf = 0, last = performance.now(), visible = true, first = true
      const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(frame) } })
      io.observe(el)
      function frame(now) {
        raf = 0
        const dt = Math.min((now - last) / 1000, .05); last = now
        if (!drag) { angle += vel * dt; vel *= Math.pow(.04, dt); if (!reduce) angle += .35 * dt }
        tx += (ax - tx) * Math.min(dt * 5, 1); ty += (ay - ty) * Math.min(dt * 5, 1)
        const bob = reduce ? 0 : Math.sin(now / 900) * .03
        const k = `${tx.toFixed(4)} ${(angle + ty).toFixed(4)} ${bob.toFixed(4)}`
        if (dirty || k !== pose) {
          pivot.rotation.set(tx, angle + ty, 0); pivot.position.y = bob
          renderer.render(scene, camera)
          dirty = false; pose = k
          if (first) { first = false; setLive(true) }
        }
        if (visible) raf = requestAnimationFrame(frame)
      }
      raf = requestAnimationFrame(frame)

      stop = () => {
        cancelAnimationFrame(raf); io.disconnect(); ro.disconnect()
        ev.forEach(([n, f]) => el.removeEventListener(n, f))
        u.dispose(); scene.environment?.dispose()
        renderer.dispose(); renderer.forceContextLoss(); canvas.remove()
      }
    }, { timeout: 1000 })
    return () => { cancelled = true; (window.cancelIdleCallback ?? clearTimeout)(id); stop(); setLive(false) }
  }, [play, variety, format, alt])

  if (failed) return <img className="unit-poster" src={poster} alt={alt} draggable="false" />
  return (
    <div className={`unit3d ${live ? 'live' : ''}`} ref={host}
      onMouseEnter={() => setCursor(t(S.dragTurn))} onMouseLeave={() => setCursor(null)}>
      {!live && poster && <img className="unit-poster" src={poster} alt={alt} draggable="false" />}
    </div>
  )
}
