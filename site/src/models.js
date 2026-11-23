import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import crownUrl from '@assets/crown.png'

/* Procedural 3D models of Reina's packaging: three retail formats (smooth jar, honeycomb jar,
   anti-drip bottle) and three industry formats (pail, drum, IBC tote). Each unit can be filled
   (honey level 0..1) and capped (lid position 0..1), which is what the packing line animates.
   Labels are drawn on a canvas, so call prepare() first: it waits for the fonts and the crown. */

// Reina Apícola's brand colours, as used on reinaapicola.com
export const COLORS = { gold: '#f2a900', black: '#111111', char: '#2c332f', paper: '#ffffff', paper2: '#f8f8f8', mist: '#e7e7e7', soft: '#5d625f' }

let crown = null
let ready = null
export function prepare() {
  ready ??= Promise.all([
    ...["italic 300 96px Raleway", "800 46px Raleway", "600 28px 'Open Sans'", "400 28px 'Open Sans'"].map(f => document.fonts.load(f).catch(() => {})),
    new Promise(res => { const i = new Image(); i.onload = () => { crown = i; res() }; i.onerror = res; i.src = crownUrl }),
  ])
  return ready
}

/* ------------------------------------------------------------------ textures */

function canvasTex(w, h, paint, repeatX = 1) {
  const c = document.createElement('canvas'); c.width = w; c.height = h
  paint(c.getContext('2d'), w, h)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  if (repeatX !== 1) { t.wrapS = THREE.RepeatWrapping; t.repeat.set(repeatX, 1) }
  return t
}

function spaced(g, text, x, y, px) {
  // canvas letterSpacing is not everywhere yet: place the letters one by one
  const w = [...text].reduce((s, ch) => s + g.measureText(ch).width + px, -px)
  let cx = x - w / 2
  for (const ch of text) { g.fillText(ch, cx, y); cx += g.measureText(ch).width + px }
}

/* The front label: Reina's crown and wordmark, the honey's Spanish name, the net weight and its colour grade. */
export function labelTexture(v, weight) {
  return canvasTex(1024, 560, (g, w, h) => {
    g.fillStyle = COLORS.paper; g.fillRect(0, 0, w, h)
    g.fillStyle = COLORS.black; g.fillRect(0, 0, w, 26); g.fillRect(0, h - 26, w, 26)
    g.fillStyle = COLORS.gold; g.fillRect(0, 26, w, 8); g.fillRect(0, h - 34, w, 8)
    if (crown) g.drawImage(crown, w / 2 - 46, 62, 92, 71)
    g.textAlign = 'left'; g.textBaseline = 'alphabetic'
    g.fillStyle = COLORS.black; g.font = "800 46px Raleway, sans-serif"
    spaced(g, 'reina apícola', w / 2, 192, 2)
    g.textAlign = 'center'
    g.font = 'italic 300 104px Raleway, sans-serif'; g.fillStyle = COLORS.black
    g.fillText(v.es, w / 2, 318)
    g.textAlign = 'left'; g.font = "600 28px 'Open Sans', sans-serif"; g.fillStyle = COLORS.char
    spaced(g, ('MIEL DE ' + v.es).toUpperCase(), w / 2, 378, 6)
    g.fillStyle = v.color; g.fillRect(w / 2 - 170, 416, 340, 12)
    g.textAlign = 'center'; g.font = "400 28px 'Open Sans', sans-serif"; g.fillStyle = COLORS.soft
    g.fillText(`${weight}  ·  Pfund ${v.pfund} mm  ·  España`, w / 2, 482)
  })
}

function hexBump() {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h)
    g.strokeStyle = '#fff'; g.lineWidth = 7
    const r = 34, dx = r * Math.sqrt(3), dy = r * 1.5
    for (let row = -1; row < h / dy + 1; row++) for (let col = -1; col < w / dx + 1; col++) {
      const cx = col * dx + (row % 2 ? dx / 2 : 0), cy = row * dy
      g.beginPath()
      for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; g.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a)) }
      g.closePath(); g.stroke()
    }
  }, 3)
}

let shadow = null
const shadowTex = () => (shadow ??= canvasTex(256, 256, (g, w, h) => {
  const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2)
  gr.addColorStop(0, 'rgba(0,0,0,.42)'); gr.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = gr; g.fillRect(0, 0, w, h)
}))

/* ------------------------------------------------------------------ materials */

const glass = bump => new THREE.MeshPhysicalMaterial({
  color: 0xffffff, roughness: 0.03, transparent: true, opacity: 0.14, envMapIntensity: 1.6,
  clearcoat: 1, clearcoatRoughness: 0.02, ior: 1.5, depthWrite: false, side: THREE.DoubleSide,
  ...(bump ? { bumpMap: bump, bumpScale: 0.5 } : {}),
})
// Honey: deep, glossy and faintly glowing, as when light comes through a full jar.
export const honeyMaterial = c => {
  const col = new THREE.Color(c)
  return new THREE.MeshPhysicalMaterial({
    color: col, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 0.55,
    emissive: col.clone().offsetHSL(0, 0.08, 0.04), emissiveIntensity: 0.28,
  })
}
const M = {}
const mat = (k, make) => (M[k] ??= make())
const gold = () => mat('gold', () => new THREE.MeshStandardMaterial({ color: 0xc9962e, metalness: 1, roughness: 0.28 }))
const black = () => mat('black', () => new THREE.MeshPhysicalMaterial({ color: 0x1d1416, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.08 }))
export const steel = () => mat('steel', () => new THREE.MeshStandardMaterial({ color: 0xd9d4d0, metalness: 1, roughness: 0.2 }))
const white = () => mat('white', () => new THREE.MeshPhysicalMaterial({ color: 0xfbf7f2, roughness: 0.45, clearcoat: 0.3, side: THREE.DoubleSide }))
const green = () => mat('green', () => new THREE.MeshStandardMaterial({ color: 0x1f6b3a, metalness: 0.55, roughness: 0.35 }))
const tank = () => mat('tank', () => new THREE.MeshPhysicalMaterial({ color: 0xf6f2ea, roughness: 0.5, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide }))
const pallet = () => mat('pallet', () => new THREE.MeshStandardMaterial({ color: 0x3a3d42, roughness: 0.7 }))

/* ------------------------------------------------------------------ geometry */

const V = (r, y) => new THREE.Vector2(r, y)
const lathe = (pts, seg = 64) => new THREE.LatheGeometry(pts, seg)

// the honey's outline cut off at height h, closed across the top
function cutProfile(pts, h) {
  const out = []
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i]
    if (p.y <= h) { out.push(p.clone()); continue }
    const q = pts[i - 1], t = (h - q.y) / (p.y - q.y)
    out.push(V(q.x + (p.x - q.x) * t, h)); break
  }
  out.push(V(0, h))
  return out
}
function roundedSquare(w, r) {
  const s = new THREE.Shape(), h = w / 2
  s.moveTo(-h + r, -h); s.lineTo(h - r, -h); s.quadraticCurveTo(h, -h, h, -h + r)
  s.lineTo(h, h - r); s.quadraticCurveTo(h, h, h - r, h); s.lineTo(-h + r, h)
  s.quadraticCurveTo(-h, h, -h, h - r); s.lineTo(-h, -h + r); s.quadraticCurveTo(-h, -h, -h + r, -h)
  return s
}
function prism(w, r, depth, bevel = 0.04) {
  const g = new THREE.ExtrudeGeometry(roundedSquare(w, r), { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 16 })
  g.rotateX(-Math.PI / 2); g.translate(0, bevel, 0)
  return g
}
function band(r, y0, y1, arc, tex, rBottom) {
  const g = new THREE.CylinderGeometry(r, rBottom ?? r, y1 - y0, 64, 1, true, -arc / 2, arc)
  g.translate(0, (y0 + y1) / 2, 0)
  return new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }))
}
function plane(w, h, tex) {
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }))
}
// screw lid with fine vertical ribs
function lidGeometry(r, h) {
  const e = h * 0.2
  const pts = [V(0, 0), V(r * 0.97, 0), V(r, e * 0.4), V(r, h - e)]
  for (let s = 1; s <= 6; s++) { const a = (s / 6) * (Math.PI / 2); pts.push(V(r - e + e * Math.cos(a), h - e + e * Math.sin(a))) }
  pts.push(V(0, h))
  const g = lathe(pts, 180), p = g.attributes.position
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i)
    if (y < e * 0.5 || y > h - e) continue
    const k = 1 + 0.01 * Math.sign(Math.cos(Math.atan2(p.getX(i), p.getZ(i)) * 70))
    p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k)
  }
  g.computeVertexNormals()
  return g
}

/* Outer profiles (radius, height), bottom to top */
const COMB = [V(0, 0), V(.6, 0), V(.7, .06), V(.76, .3), V(.78, .9), V(.74, 1.3), V(.62, 1.52), V(.52, 1.6), V(.52, 1.74)]
const DRIP = [V(0, 0), V(.56, 0), V(.64, .08), V(.66, .7), V(.6, .95), V(.47, 1.2), V(.44, 1.36), V(.3, 1.6), V(.2, 1.7), V(.2, 1.78)]
const PAIL = [V(0, 0), V(.82, 0), V(.86, .04), V(1.02, 1.5), V(1.07, 1.52), V(1.07, 1.6)]
const inner = (pts, k, lift) => pts.map(p => V(Math.max(0, p.x * k), p.y + lift)).filter(p => p.y < pts[pts.length - 1].y)

/* IBC tote: a steel cage of tubes round a translucent tank on a pallet. One merged mesh for the cage. */
function cageGeometry(w, d, y0, y1) {
  const parts = [], r = 0.022
  const tube = (len) => new THREE.CylinderGeometry(r, r, len, 8)
  const xs = [-w / 2, -w / 4, 0, w / 4, w / 2], zs = [-d / 2, -d / 6, d / 6, d / 2]
  for (const x of xs) for (const z of [-d / 2, d / 2]) { const g = tube(y1 - y0); g.translate(x, (y0 + y1) / 2, z); parts.push(g) }
  for (const z of zs) for (const x of [-w / 2, w / 2]) { const g = tube(y1 - y0); g.translate(x, (y0 + y1) / 2, z); parts.push(g) }
  for (let k = 0; k <= 4; k++) {
    const y = y0 + (y1 - y0) * k / 4
    for (const z of [-d / 2, d / 2]) { const g = tube(w); g.rotateZ(Math.PI / 2); g.translate(0, y, z); parts.push(g) }
    for (const x of [-w / 2, w / 2]) { const g = tube(d); g.rotateX(Math.PI / 2); g.translate(x, y, 0); parts.push(g) }
  }
  for (const x of xs) { const g = tube(d); g.rotateX(Math.PI / 2); g.translate(x, y1, 0); parts.push(g) }
  return mergeGeometries(parts)
}

/* ------------------------------------------------------------------ units */

/**
 * Build one packed unit: `v` is a honey variety, `f` a format key. Returns a handle with
 * group (THREE.Group, standing on y = 0), topY (highest point before the lid), fill(f) and cap(c).
 */
export function makeUnit(v, f) {
  const g = new THREE.Group()
  const fmt = FORMAT_SHAPES[f]
  const lab = labelTexture(v, fmt.weight)
  const hm = honeyMaterial(v.color)
  const u = { v, f, group: g, honey: null, profile: null, maxFill: 1, topY: 1.8, lid: null, lidRest: 0, pourX: 0, noFill: false, _h: -1, honeyMat: hm, fillLevel: 0, capLevel: 0 }
  const lidMat = v.lid === 'black' ? black() : gold()

  if (f === 'smooth') {
    const W = 1.36, H = 1.5
    g.add(new THREE.Mesh(prism(W, .3, H), glass()))
    const honey = new THREE.Mesh(prism(W * .9, .26, 1, 0), hm)
    honey.position.y = .07; g.add(honey); u.honey = honey; u.maxFill = H - .2
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, .12, 64), glass()); neck.position.y = H + .14; g.add(neck)
    const l = plane(1.12, .62, lab); l.position.set(0, .68, W / 2 + .045); g.add(l)
    u.lid = new THREE.Mesh(lidGeometry(.66, .28), lidMat); u.lidRest = H + .16; u.topY = H + .2
  } else if (f === 'comb') {
    g.add(new THREE.Mesh(lathe(COMB), glass(hexBump())))
    u.profile = inner(COMB, .9, .05); u.maxFill = 1.42
    g.add(band(.79, .42, .86, Math.PI * .8, lab))
    u.lid = new THREE.Mesh(lidGeometry(.6, .26), lidMat); u.lidRest = 1.66; u.topY = 1.74
  } else if (f === 'drip') {
    g.add(new THREE.Mesh(lathe(DRIP), glass()))
    u.profile = inner(DRIP, .88, .05); u.maxFill = 1.3
    g.add(band(.67, .16, .66, Math.PI * .85, lab))
    u.lid = new THREE.Mesh(lathe([V(0, 0), V(.27, 0), V(.27, .16), V(.2, .34), V(.07, .44), V(0, .45)], 48), gold())
    u.lidRest = 1.72; u.topY = 1.78
  } else if (f === 'pail') {
    g.add(new THREE.Mesh(lathe(PAIL), white()))
    u.profile = inner(PAIL, .97, .04); u.maxFill = 1.35
    g.add(band(.995, .55, 1.15, Math.PI * .7, lab, .93))
    const handle = new THREE.Mesh(new THREE.TorusGeometry(1.08, .025, 8, 64, Math.PI), steel())
    handle.rotation.set(.5, Math.PI / 2, 0); handle.position.y = 1.45; g.add(handle)
    u.lid = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, .12, 64), white()); u.lidRest = 1.62; u.topY = 1.6
  } else if (f === 'drum') {
    const H = 2.5, R = .92
    const body = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H, 64), green()); body.position.y = H / 2; g.add(body)
    for (const y of [.05, H * .33, H * .66, H - .05]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(R + .01, .035, 10, 64), green()); ring.rotation.x = Math.PI / 2; ring.position.y = y; g.add(ring)
    }
    g.add(band(R + .02, H * .38, H * .62, Math.PI * .55, lab))
    u.lid = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, .1, 32), steel()); u.lid.position.x = .45
    u.lidRest = H + .05; u.topY = H; u.noFill = true; u.pourX = .45
  } else if (f === 'ibc') {
    const W = 2.1, D = 1.7, B = .28, H = 1.85
    const base = new THREE.Mesh(new THREE.BoxGeometry(W + .1, B, D + .1), pallet()); base.position.y = B / 2; g.add(base)
    const body = new THREE.Mesh(new THREE.BoxGeometry(W - .08, H, D - .08, 1, 1, 1), tank()); body.position.y = B + H / 2; g.add(body)
    const honey = new THREE.Mesh(new THREE.BoxGeometry(W - .16, 1, D - .16), hm); honey.position.y = B + .04
    honey.geometry.translate(0, .5, 0); g.add(honey); u.honey = honey; u.maxFill = H - .12; u.box = true
    g.add(new THREE.Mesh(cageGeometry(W, D, B, B + H + .04), steel()))
    const valve = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .2, 24), steel()); valve.rotation.x = Math.PI / 2; valve.position.set(0, B + .14, D / 2 + .08); g.add(valve)
    const l = plane(.95, .52, lab); l.position.set(-.45, B + 1.05, D / 2 + .03); g.add(l)
    u.lid = new THREE.Mesh(new THREE.CylinderGeometry(.24, .24, .12, 40), white()); u.lidRest = B + H + .1; u.topY = B + H + .04
  }
  g.add(u.lid)
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(f === 'ibc' ? 3.6 : 2.8, f === 'ibc' ? 3.6 : 2.8), new THREE.MeshBasicMaterial({ map: shadowTex(), transparent: true, depthWrite: false }))
  sh.rotation.x = -Math.PI / 2; sh.position.y = .012; g.add(sh)

  u.fill = level => setFill(u, level)
  u.cap = level => setCap(u, level)
  u.surface = () => (u.noFill ? u.topY : (u.box ? .32 : .07) + u.fillLevel * u.maxFill)
  u.dispose = () => g.traverse(o => {
    o.geometry?.dispose()
    if (o.material && !Object.values(M).includes(o.material)) { o.material.map?.dispose(); o.material.bumpMap?.dispose(); o.material.dispose() }
  })
  return u
}

function setFill(u, f) {
  u.fillLevel = f
  if (u.noFill) return
  if (u.f === 'smooth' || u.box) { u.honey.scale.y = Math.max(.001, f * u.maxFill); u.honey.visible = f > .002; return }
  const h = .05 + f * (u.maxFill - .05)
  if (Math.abs(u._h - h) < .002) return
  u._h = h
  if (u.honey) { u.group.remove(u.honey); u.honey.geometry.dispose(); u.honey = null }
  if (f > .002) { u.honey = new THREE.Mesh(lathe(cutProfile(u.profile, h), 48), u.honeyMat); u.group.add(u.honey) }
}
function setCap(u, c) {
  u.capLevel = c
  u.lid.position.y = u.lidRest + (1 - c) * 2.6
  u.lid.visible = c > .001
  u.lid.rotation.y = (1 - c) * 3
}

// net weight printed on each format's label
const FORMAT_SHAPES = {
  smooth: { weight: '450 g' }, comb: { weight: '1 kg' }, drip: { weight: '500 g' },
  pail: { weight: '20 kg' }, drum: { weight: '290 kg' }, ibc: { weight: '1.300 kg' },
}

/* A light studio: room reflections plus a warm key and rim. */
export async function makeStudio(renderer) {
  const { RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js')
  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  pmrem.dispose()
  const key = new THREE.DirectionalLight(0xfff6ea, 1.6); key.position.set(-4, 8, 6)
  const rim = new THREE.DirectionalLight(0xffc27a, 1.1); rim.position.set(5, 3, -6)
  scene.add(key, rim, new THREE.AmbientLight(0xffffff, 0.25))
  return scene
}

export function makeRenderer(canvas) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
  r.outputColorSpace = THREE.SRGBColorSpace
  r.toneMapping = THREE.NeutralToneMapping
  r.toneMappingExposure = 1
  r.setClearColor(0x000000, 0)
  return r
}

/* ------------------------------------------------------------------ the line's timing */

const clamp01 = x => Math.min(1, Math.max(0, x))
export const ease = x => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)

/**
 * Where the line is at position t (0 .. n-1). Between two whole numbers k and k+1 the belt
 * first carries unit k+1 under the filler, then honey pours, then the lid comes down.
 * At t = k unit k sits under the filler, full and capped.
 */
export function lineState(t, n) {
  const last = n - 1
  if (t >= last) return { k: last - 1, u: 1, belt: last, move: 1, pour: 1, cap: 1, active: last, phase: 'packed' }
  const k = Math.max(0, Math.floor(t)), u = t - k
  const move = ease(clamp01(u / .3)), pour = ease(clamp01((u - .32) / .4)), cap = ease(clamp01((u - .74) / .16))
  const phase = u === 0 ? 'packed' : u < .3 ? 'conveying' : u < .72 ? 'filling' : u < .9 ? 'capping' : 'packed'
  return { k, u, belt: k + move, move, pour, cap, active: u < .15 ? k : k + 1, phase }
}
