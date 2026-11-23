// Dev-only: draws one packed unit on a transparent canvas for tools/posters.mjs to capture.
// poster.html?v=rosemary&f=smooth
import * as THREE from 'three'
import { makeRenderer, makeStudio, makeUnit, prepare } from './models.js'
import { varietyOf } from './data.js'

const q = new URLSearchParams(location.search)
const W = 800, H = 1000
await prepare()
const canvas = document.createElement('canvas')
document.body.appendChild(canvas)
const renderer = makeRenderer(canvas)
renderer.setPixelRatio(1); renderer.setSize(W, H)
const scene = await makeStudio(renderer)
const u = makeUnit(varietyOf(q.get('v')), q.get('f'))
u.fill(1); u.cap(1)
const size = new THREE.Box3().setFromObject(u.group).getSize(new THREE.Vector3())
const pivot = new THREE.Group(); u.group.position.y = -size.y / 2; pivot.add(u.group); scene.add(pivot)
pivot.rotation.y = -0.35
const camera = new THREE.PerspectiveCamera(22, W / H, 0.1, 100)
const dist = (Math.max(size.y, size.x * 1.05) * 0.62) / Math.tan(THREE.MathUtils.degToRad(11))
camera.position.set(0, dist * 0.17, dist); camera.lookAt(0, 0, 0)
renderer.render(scene, camera)
window.__ready = true
