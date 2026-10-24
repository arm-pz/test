import * as THREE from 'three';
import {mergeGeometries, mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {TessellateModifier} from 'three/addons/modifiers/TessellateModifier.js';
import {clamp, lerp, range, smoothstep} from './math';

/**
 * The jacket as a tailor would draft it: flat outlines in pattern space
 * (x right, y up, one unit ≈ 30 cm on a size 38), seen from the front.
 * Each piece is built twice — curved around the body and flat on the table —
 * and the mesh morphs between the two.
 */

type Seg = [number, number] | ['q', number, number, number, number];

const OUT: Record<string, Seg[]> = {
  back: [[-0.22, 1.26], ['q', -0.6, 1.2, -0.95, 1.08], ['q', -1.0, 0.75, -0.9, 0.42], ['q', -0.78, 0.05, -0.8, -0.25], ['q', -0.86, -0.8, -0.9, -1.22], ['q', 0, -1.3, 0.9, -1.22], ['q', 0.86, -0.8, 0.8, -0.25], ['q', 0.78, 0.05, 0.9, 0.42], ['q', 1.0, 0.75, 0.95, 1.08], ['q', 0.6, 1.2, 0.22, 1.26], ['q', 0, 1.3, -0.22, 1.26]],
  // the overlapping right front (viewer's right); its edge crosses to x = −0.28
  front: [[0.16, 1.14], [0.22, 1.22], ['q', 0.6, 1.17, 0.95, 1.08], ['q', 1.0, 0.75, 0.9, 0.42], ['q', 0.78, 0.05, 0.8, -0.25], ['q', 0.86, -0.8, 0.9, -1.22], ['q', 0.35, -1.32, -0.22, -1.28], ['q', -0.28, -1.27, -0.28, -1.15], [-0.28, 0.02]],
  lapel: [[-0.28, 0.02], ['q', 0.22, 0.4, 0.6, 0.88], [0.68, 1.03], [0.44, 0.93], [0.37, 0.88], [0.25, 1.17], [0.16, 1.14]],
  sleeve: [[0.95, 1.08], ['q', 1.12, 1.05, 1.17, 0.85], ['q', 1.25, 0.0, 1.2, -0.92], [0.98, -0.97], ['q', 0.98, -0.2, 0.92, 0.42], ['q', 1.0, 0.75, 0.95, 1.08]],
  collar: [[-0.25, 1.19], ['q', -0.22, 1.34, -0.1, 1.35], [0.1, 1.35], ['q', 0.22, 1.34, 0.25, 1.19], [0.16, 1.13], [-0.16, 1.13]],
  flap: [[0.42, -0.36], [0.86, -0.4], [0.87, -0.53], [0.43, -0.49]],
  welt: [[0.46, 0.4], [0.76, 0.44], [0.76, 0.5], [0.46, 0.47]],
  shirt: [[-0.21, 1.3], [0.21, 1.3], [0.1, 0.3], [-0.1, 0.3]],
};

const mirror = (pts: Seg[]): Seg[] => pts.map((s) => (s[0] === 'q' ? ['q', -s[1], s[2], -s[3], s[4]] : [-s[0], s[1]]));

function toShape(pts: Seg[]) {
  const sh = new THREE.Shape();
  const [x0, y0] = pts[0] as [number, number];
  sh.moveTo(x0, y0);
  for (const s of pts.slice(1)) {
    if (s[0] === 'q') sh.quadraticCurveTo(s[1], s[2], s[3], s[4]);
    else sh.lineTo(s[0], s[1]);
  }
  sh.closePath();
  return sh;
}

// ---------------------------------------------------------------------------
// The body the cloth wraps around: an ellipse in plan, a little chest, and
// shoulders that fall back towards the seam.
// ---------------------------------------------------------------------------

export const BODY = {rx: 0.94, rz: 0.6};

// x of the side seam at each height, sampled from the front outline's curves.
// The body's half-width follows it, so front and back meet at the seam.
const SEAM: [number, number][] = [[-1.4, 0.9], [-1.22, 0.9], [-0.77, 0.855], [-0.25, 0.8], [0.07, 0.815], [0.42, 0.9], [0.75, 0.962], [1.08, 0.95], [1.4, 0.95]];
function seamX(y: number) {
  for (let i = 1; i < SEAM.length; i++) {
    const [y1, x1] = SEAM[i];
    if (y <= y1) {
      const [y0, x0] = SEAM[i - 1];
      return lerp(x0, x1, range(y, y0, y1)) + 0.004;
    }
  }
  return SEAM[SEAM.length - 1][1] + 0.004;
}

export function bodyZ(x: number, y: number) {
  const u = clamp(Math.abs(x) / seamX(y), 0, 0.999);
  const round = Math.sqrt(1 - u * u);
  const chest = 0.05 * Math.exp(-(((y - 0.45) / 0.45) ** 2)) * round;
  const shoulder = lerp(1, 0.42, smoothstep(range(y, 0.62, 1.32)));
  return (BODY.rz * round + chest) * shoulder;
}

/** A sleeve is a tube hanging at the side; we see its front half. */
function sleeveZ(x: number, y: number) {
  const ax = Math.abs(x);
  const centre = lerp(1.1, 1.06, range(y, -0.95, 0.9));
  const r = 0.16;
  const u = clamp((ax - centre) / r, -0.995, 0.995);
  const tube = 0.06 + r * Math.sqrt(1 - u * u);
  // the sleeve head blends into the shoulder
  return lerp(tube, bodyZ(0.95, y) + 0.01, smoothstep(range(y, 0.8, 1.1)));
}

export type Bend = 'front' | 'back' | 'sleeve' | 'collar';

function bendZ(kind: Bend, x: number, y: number) {
  switch (kind) {
    case 'front':
      return bodyZ(x, y);
    case 'back':
      return -bodyZ(x, y) + 0.004;
    case 'sleeve':
      return sleeveZ(x, y);
    case 'collar': {
      const u = clamp(Math.abs(x) / 0.3, 0, 0.995);
      return 0.17 * Math.sqrt(1 - u * u) + 0.02;
    }
  }
}

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

const THICK = 0.012;

function capGeometry(shape: THREE.Shape, z: number, flip: boolean) {
  let g: THREE.BufferGeometry = new THREE.ShapeGeometry(shape, 14);
  g.deleteAttribute('normal');
  g = new TessellateModifier(0.07, 9).modify(g);
  g = mergeVertices(g, 1e-5);
  g.translate(0, 0, z);
  if (flip) {
    const idx = g.index!;
    for (let i = 0; i < idx.count; i += 3) {
      const a = idx.getX(i + 1);
      idx.setX(i + 1, idx.getX(i + 2));
      idx.setX(i + 2, a);
    }
  }
  return g;
}

function edgeGeometry(outline: THREE.Vector2[]) {
  const n = outline.length;
  const pos: number[] = [];
  const uv: number[] = [];
  const index: number[] = [];
  for (let i = 0; i < n; i++) {
    const p = outline[i];
    pos.push(p.x, p.y, 0, p.x, p.y, THICK);
    uv.push(p.x, p.y, p.x, p.y + 0.01);
  }
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const a = i * 2, b = i * 2 + 1, c = j * 2, d = j * 2 + 1;
    index.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(index);
  return g;
}

export type BuiltPiece = {
  /** groups: 0 outer cloth, 1 lining, 2 cut edge */
  geometry: THREE.BufferGeometry;
  chalk: THREE.BufferGeometry;
  stitch: THREE.BufferGeometry;
  /** centre on the body (where the piece's group sits when assembled) */
  centre: THREE.Vector3;
  size: THREE.Vector2;
};

/** Writes bent positions as the base and flat positions as morph target 0. */
/** Unit normal (+z side) of the surface z = bendZ(x, y), by central differences. */
function surfaceNormal(kind: Bend, x: number, y: number, out: THREE.Vector3) {
  const h = 0.004;
  const gx = (bendZ(kind, x + h, y) - bendZ(kind, x - h, y)) / (2 * h);
  const gy = (bendZ(kind, x, y + h) - bendZ(kind, x, y - h)) / (2 * h);
  // clamp so the seam edge, where the surface turns away, stays well behaved
  return out.set(-clamp(gx, -3, 3), -clamp(gy, -3, 3), 1).normalize();
}

/** A point `d` off the bent surface along its normal, in pattern space. */
function onSurface(kind: Bend, x: number, y: number, d: number, n: THREE.Vector3): [number, number, number] {
  surfaceNormal(kind, x, y, n);
  return [x + n.x * d, y + n.y * d, bendZ(kind, x, y) + n.z * d];
}

function withMorph(g: THREE.BufferGeometry, kind: Bend, lift: number, outward: 1 | -1, cx: number, cy: number, cz: number) {
  const pos = g.getAttribute('position') as THREE.BufferAttribute;
  const flat = new Float32Array(pos.count * 3);
  const bent = new Float32Array(pos.count * 3);
  const n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    // No mirroring here: a mirrored mesh would turn its faces inside out.
    // The back piece faces −z instead and is turned round when laid out.
    flat.set([x - cx, y - cy, z], i * 3);
    // thickness and layering go along the normal, so steep sides keep them
    const [bx, by, bz] = onSurface(kind, x, y, z + outward * lift, n);
    bent.set([bx - cx, by - cy, bz - cz], i * 3);
  }
  const flatGeo = g.clone();
  flatGeo.setAttribute('position', new THREE.BufferAttribute(flat, 3));
  flatGeo.computeVertexNormals();
  g.setAttribute('position', new THREE.BufferAttribute(bent, 3));
  g.computeVertexNormals();
  g.morphAttributes.position = [flatGeo.getAttribute('position')];
  g.morphAttributes.normal = [flatGeo.getAttribute('normal')];
  g.morphTargetsRelative = false;
  return g;
}

function lineGeometry(points: THREE.Vector2[], kind: Bend, lift: number, outward: 1 | -1, cx: number, cy: number, cz: number) {
  const pts = [...points, points[0]];
  const flat: number[] = [];
  const bent: number[] = [];
  const dist: number[] = [];
  const n = new THREE.Vector3();
  let d = 0;
  pts.forEach((p, i) => {
    if (i > 0) d += p.distanceTo(pts[i - 1]);
    dist.push(d);
    const surf = outward === 1 ? THICK + 0.004 : -0.004;
    flat.push(p.x - cx, p.y - cy, surf);
    const [bx, by, bz] = onSurface(kind, p.x, p.y, surf + outward * lift, n);
    bent.push(bx - cx, by - cy, bz - cz);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(bent, 3));
  g.setAttribute('lineDistance', new THREE.Float32BufferAttribute(dist, 1));
  g.morphAttributes.position = [new THREE.Float32BufferAttribute(flat, 3)];
  g.morphTargetsRelative = false;
  return g;
}

/** Inset an outline toward its centroid; close enough for a pick-stitch line. */
function inset(points: THREE.Vector2[], by: number) {
  const c = points.reduce((a, p) => a.add(p), new THREE.Vector2()).divideScalar(points.length);
  return points.map((p) => p.clone().add(c.clone().sub(p).normalize().multiplyScalar(by)));
}

export function buildPiece(pts: Seg[], kind: Bend, lift: number, outward: 1 | -1): BuiltPiece {
  const shape = toShape(pts);
  const outline = shape.getSpacedPoints(180).slice(0, -1);
  const box = new THREE.Box2().setFromPoints(outline);
  const c2 = box.getCenter(new THREE.Vector2());
  const cz = bendZ(kind, c2.x, c2.y) + outward * lift;

  const top = capGeometry(shape, THICK, false);
  const bottom = capGeometry(shape, 0, true);
  const edge = edgeGeometry(outline);
  // outer cloth faces +z for front-facing pieces and −z for the back
  const parts = outward === 1 ? [top, bottom, edge] : [bottom, top, edge];
  const merged = mergeGeometries(parts, true)!;
  const geometry = withMorph(merged, kind, lift, outward, c2.x, c2.y, cz);

  return {
    geometry,
    chalk: lineGeometry(outline, kind, lift, outward, c2.x, c2.y, cz),
    stitch: lineGeometry(inset(outline, 0.045), kind, lift, outward, c2.x, c2.y, cz),
    centre: new THREE.Vector3(c2.x, c2.y, cz),
    size: box.getSize(new THREE.Vector2()),
  };
}

// ---------------------------------------------------------------------------
// The pieces and where each goes when the jacket comes apart.
//   e  = laid-out centre on wide screens,  ep = on phones
//   via = a waypoint the piece passes through (relative to the start), so
//         pieces arc off the body instead of sliding in straight lines
//   rot = rotation once laid out; delay = order of unpicking (0 first)
// ---------------------------------------------------------------------------

export type PieceDef = {
  id: string;
  label?: string;
  note?: string;
  pts: Seg[];
  kind: Bend;
  lift: number;
  outward: 1 | -1;
  e: [number, number, number];
  ep: [number, number, number];
  via: [number, number, number];
  rot: [number, number, number];
  delay: number;
};

export const PIECES: PieceDef[] = [
  {id: 'back', label: 'Back', note: 'cut on the fold', pts: OUT.back, kind: 'back', lift: 0.0, outward: -1, e: [0, 0.15, 0.95], ep: [0, 0.05, 0.9], via: [0, 2.6, 0.4], rot: [0, Math.PI, 0], delay: 0.34},
  {id: 'sleeveL', label: 'Sleeve', pts: mirror(OUT.sleeve), kind: 'sleeve', lift: 0, outward: 1, e: [-2.78, 0.1, 0.3], ep: [-1.3, 0.35, 0.2], via: [-0.9, -0.2, 0.9], rot: [0, 0, 0.3], delay: 0.24},
  {id: 'sleeveR', label: 'Sleeve', pts: OUT.sleeve, kind: 'sleeve', lift: 0, outward: 1, e: [2.78, 0.1, 0.3], ep: [1.3, 0.35, 0.2], via: [0.9, -0.2, 0.9], rot: [0, 0, -0.3], delay: 0.24},
  {id: 'collar', label: 'Collar', pts: OUT.collar, kind: 'collar', lift: 0, outward: 1, e: [0, 2.5, 0.6], ep: [0, 2.15, 0.6], via: [0, 0.7, 0.9], rot: [0, 0, 0], delay: 0.18},
  {id: 'frontUnder', label: 'Left front', pts: mirror(OUT.front), kind: 'front', lift: 0.0, outward: 1, e: [-1.72, -0.2, 0.55], ep: [-0.98, -0.4, 0.6], via: [-0.7, 0.1, 1.2], rot: [0, 0, 0.08], delay: 0.3},
  {id: 'lapelUnder', label: 'Peak lapel', pts: mirror(OUT.lapel), kind: 'front', lift: 0.018, outward: 1, e: [-0.98, 1.9, 0.75], ep: [-0.7, 1.55, 0.75], via: [-0.5, 0.4, 1.0], rot: [0, 0, 0.42], delay: 0.12},
  {id: 'frontTop', label: 'Right front', pts: OUT.front, kind: 'front', lift: 0.04, outward: 1, e: [1.72, -0.2, 0.6], ep: [0.98, -0.4, 0.65], via: [0.7, 0.1, 1.3], rot: [0, 0, -0.08], delay: 0.28},
  {id: 'lapelTop', label: 'Peak lapel', pts: OUT.lapel, kind: 'front', lift: 0.058, outward: 1, e: [0.98, 1.9, 0.8], ep: [0.7, 1.55, 0.8], via: [0.5, 0.4, 1.1], rot: [0, 0, -0.42], delay: 0.1},
  {id: 'flapL', label: 'Pocket flap', pts: mirror(OUT.flap), kind: 'front', lift: 0.064, outward: 1, e: [-0.82, -2.0, 0.9], ep: [-0.55, -1.95, 0.9], via: [-0.3, -0.3, 0.8], rot: [0, 0, 0.18], delay: 0.05},
  {id: 'flapR', label: 'Pocket flap', pts: OUT.flap, kind: 'front', lift: 0.064, outward: 1, e: [0.82, -2.0, 0.9], ep: [0.55, -1.95, 0.9], via: [0.3, -0.3, 0.8], rot: [0, 0, -0.18], delay: 0.05},
  {id: 'welt', label: 'Breast welt', pts: OUT.welt, kind: 'front', lift: 0.06, outward: 1, e: [1.72, 1.55, 0.8], ep: [1.05, 1.15, 0.85], via: [0.3, 0.3, 0.7], rot: [0, 0, -0.1], delay: 0.07},
];

export const SHIRT = OUT.shirt;

/** Six buttons, two columns of three. */
export const BUTTONS: {at: [number, number]; e: [number, number]; ep: [number, number]}[] = [-0.08, -0.38, -0.68].flatMap((y, row) =>
  [-1, 1].map((side) => ({
    at: [side * 0.17, y] as [number, number],
    e: [-0.75 + (row * 2 + (side + 1) / 2) * 0.3, -2.55] as [number, number],
    ep: [-0.6 + (row * 2 + (side + 1) / 2) * 0.24, -2.4] as [number, number],
  })),
);

/** Latest delay in PIECES; pieces start between 0 and this. */
export const MAX_DELAY = 0.34;

/** 0 → 1 as the jacket comes apart, holding while laid out, back to 0. */
export function apartAt(p: number) {
  if (p < 0.44) return range(p, 0.06, 0.44);
  if (p < 0.6) return 1;
  return 1 - range(p, 0.6, 0.92);
}

/** Per-piece progress from the global amount, staggered by `delay`. */
export function localT(t: number, delay: number) {
  return clamp((t - delay) / (1 - MAX_DELAY));
}
