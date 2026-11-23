import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { COLORS, lineState, makeRenderer, makeStudio, makeUnit, prepare, steel, honeyMaterial } from './models.js'
import { line, varietyOf } from './data.js'

export const PITCH = 3.4

function canvasTex(w, h, paint, repeatX) {
  const c = document.createElement('canvas'); c.width = w; c.height = h
  paint(c.getContext('2d'), w, h)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.wrapS = THREE.RepeatWrapping; t.repeat.set(repeatX, 1)
  return t
}

/* The conveyor: a long black slab whose top is the belt (with the line's name printed on it) and
   whose front face runs down out of the frame, with a gold edge between the two. */
function makeConveyor(len) {
  const top = canvasTex(2048, 256, (g, w, h) => {
    g.fillStyle = '#161616'; g.fillRect(0, 0, w, h)
    g.strokeStyle = 'rgba(255,255,255,.06)'; g.lineWidth = 3
    for (let x = 0; x < w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke() }
    g.fillStyle = 'rgba(242,169,0,.55)'; g.font = "700 34px 'Open Sans', sans-serif"
    let x = 40
    for (const ch of 'REINA APÍCOLA  ·  ALZIRA  ·  LÍNEA 01  ·  6.000 U/H  ·') { g.fillText(ch, x, 206); x += g.measureText(ch).width + 10 }
  }, len / 14)
  const side = canvasTex(1024, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1d1f1e'); gr.addColorStop(1, '#0c0c0c')
    g.fillStyle = gr; g.fillRect(0, 0, w, h)
  }, 1)
  const dark = new THREE.MeshStandardMaterial({ color: 0x0e0e0e, roughness: 0.9 })
  const slab = new THREE.Mesh(new THREE.BoxGeometry(len, 9, 3.2), [dark, dark,
    new THREE.MeshStandardMaterial({ map: top, roughness: 0.75 }), dark,
    new THREE.MeshStandardMaterial({ map: side, roughness: 0.85 }), dark])
  const lip = new THREE.Mesh(new THREE.BoxGeometry(len, .07, .07), new THREE.MeshStandardMaterial({ color: COLORS.gold, metalness: .6, roughness: .3 }))
  lip.position.set(0, 4.5, 1.6)
  const g = new THREE.Group(); g.add(slab, lip); g.position.y = -4.5
  return g
}

function makeFiller() {
  const V = (r, y) => new THREE.Vector2(r, y)
  const head = new THREE.Group()
  head.add(new THREE.Mesh(new THREE.LatheGeometry([V(0, 0), V(.12, 0), V(.12, .25), V(.34, .55), V(.34, 1.4), V(.5, 1.45), V(.5, 1.7), V(0, 1.7)], 48), steel()))
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.35, .025, 10, 48), new THREE.MeshStandardMaterial({ color: COLORS.gold, metalness: .8, roughness: .3 }))
  ring.rotation.x = Math.PI / 2; ring.position.y = 1.1; head.add(ring)
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, 8, 24), steel()); pipe.position.y = 5.6; head.add(pipe)
  return head
}

/**
 * The hero's packing line. `pos` is a motion value running 0 .. line.length - 1 with the scroll.
 * Draws only when something moved, pauses off screen, and drops to 1x pixels if frames are slow.
 * Calls onFail() when WebGL is unavailable and onLive() after the first frame.
 */
export default function Line3D({ pos, play, onLive, onFail }) {
  const host = useRef(null)

  useEffect(() => {
    if (!play) return
    let stop = () => {}, cancelled = false
    ;(async () => {
      await prepare()
      if (cancelled) return
      const canvas = document.createElement('canvas')
      let renderer
      try { renderer = makeRenderer(canvas) } catch { onFail?.(); return }
      const scene = await makeStudio(renderer)
      if (cancelled) { renderer.dispose(); return }
      host.current.appendChild(canvas)
      const n = line.length

      const belt = new THREE.Group(); scene.add(belt)
      const conveyor = makeConveyor((n + 8) * PITCH); conveyor.position.x = (n + 8) * PITCH / 2 - 4 * PITCH; belt.add(conveyor)
      const units = line.map((it, i) => {
        const u = makeUnit(varietyOf(it.v), it.f)
        u.group.position.x = i * PITCH
        belt.add(u.group)
        return u
      })
      const head = makeFiller(); scene.add(head)
      const streamMat = honeyMaterial('#c46c10')
      const stream = new THREE.Mesh(new THREE.CylinderGeometry(.045, .07, 1, 20, 1, true), streamMat); scene.add(stream)

      const camera = new THREE.PerspectiveCamera(26, 1, .1, 100)
      const look = new THREE.Vector3(), base = new THREE.Vector3()
      let dpr = Math.min(devicePixelRatio, 1.75), W = 0, H = 0
      const resize = () => {
        const { width, height } = host.current.getBoundingClientRect()
        if (!width || !height) return
        W = width; H = height
        renderer.setPixelRatio(dpr); renderer.setSize(width, height, false)
        camera.aspect = width / height
        const narrow = camera.aspect < .9
        camera.fov = narrow ? 34 : 26
        // on tall phone screens aim higher, so the line sits lower under the headline
        base.set(0, narrow ? 3.3 : 3.1, narrow ? 13.2 : 12.5)
        look.set(0, narrow ? 1.75 : 1.15, 0)
        camera.updateProjectionMatrix()
        dirty = true
      }
      let dirty = true
      const ro = new ResizeObserver(resize); ro.observe(host.current); resize()

      let mx = 0, smx = 0
      const onMove = e => { mx = e.clientX / innerWidth - .5 }
      addEventListener('pointermove', onMove, { passive: true })

      let visible = true, raf = 0, last = performance.now(), slow = 0, first = true, key = ''
      const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(frame) })
      io.observe(host.current)
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches

      function frame(now) {
        raf = 0
        const dt = Math.min((now - last) / 1000, .05); last = now
        smx += (mx - smx) * Math.min(dt * 3, 1)
        const t = pos.get(), s = lineState(t, n), time = now / 1000
        const idle = reduce ? 0 : 1
        const k2 = `${t.toFixed(4)} ${smx.toFixed(3)} ${W}x${H}`
        // the units sway a little even when the page is still, so draw at a calm ~30 fps then
        if (dirty || k2 !== key || (idle && now - (frame.at || 0) > 33)) {
          belt.position.x = -s.belt * PITCH
          units.forEach((u, i) => {
            const done = i <= s.k || t >= n - 1
            const cur = i === s.k + 1 && t < n - 1
            u.fill(done ? 1 : cur ? s.pour : 0)
            u.cap(done ? 1 : cur ? s.cap : 0)
            const d = u.group.position.x + belt.position.x
            u.group.rotation.y = -d * .06 + idle * Math.sin(time * .6 + i) * .04 + smx * .3
            u.group.visible = Math.abs(d) < 14
          })
          // the filler comes down over the unit being filled, pours, and goes back up
          const a = units[Math.min(n - 1, s.k + 1)]
          const down = t < n - 1 ? Math.sin(Math.min(1, Math.max(0, (s.u - .28) / .52)) * Math.PI) : 0
          const tipIdle = Math.max(3.55, a.topY + .9)
          head.position.set(a.pourX, tipIdle - down * (tipIdle - (a.topY + .35)), 0)
          const flow = t < n - 1 && s.u > .32 && s.u < .74 ? Math.sin(((s.u - .32) / .42) * Math.PI) : 0
          stream.visible = flow > .02 && s.move > .999
          if (stream.visible) {
            const surf = a.surface(), len = Math.max(.05, head.position.y - surf)
            stream.scale.set(.4 + flow * .8, len, .4 + flow * .8)
            stream.position.set(head.position.x + Math.sin(time * 9) * .006, surf + len / 2, 0)
            streamMat.color.set(a.v.color); streamMat.emissive.set(a.v.color)
          }
          camera.position.set(base.x + smx * 1.2, base.y, base.z)
          camera.lookAt(look)
          const t0 = performance.now()
          renderer.render(scene, camera)
          const cost = performance.now() - t0
          frame.at = now; key = k2; dirty = false
          if (first) { first = false; onLive?.() }
          // weak device: fewer pixels rather than a stuttering page
          slow = cost > 22 ? slow + 1 : Math.max(0, slow - 1)
          if (slow > 8 && dpr > 1) { dpr = 1; slow = 0; resize() }
        }
        if (visible) raf = requestAnimationFrame(frame)
      }
      raf = requestAnimationFrame(frame)

      stop = () => {
        cancelAnimationFrame(raf); io.disconnect(); ro.disconnect()
        removeEventListener('pointermove', onMove)
        units.forEach(u => u.dispose())
        scene.traverse(o => { o.geometry?.dispose(); [o.material].flat().forEach(m => { m?.map?.dispose(); m?.dispose?.() }) })
        scene.environment?.dispose()
        renderer.dispose(); renderer.forceContextLoss()
        canvas.remove()
      }
    })()
    return () => { cancelled = true; stop() }
  }, [play, pos, onLive, onFail])

  return <div className="line3d" ref={host} aria-hidden="true" />
}
