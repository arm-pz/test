import * as THREE from 'three';
import type {ClothId} from '../content';

/**
 * Cloth is drawn, not photographed: a 512px tile per cloth, plus one shared
 * twill normal map. Texture UVs are the pattern's own coordinates (one unit is
 * roughly a third of a metre on the size 38), so every piece samples the same
 * cloth and stripes line up across seams when the jacket is assembled.
 */

const S = 512;
/** Tiles per pattern unit. 2.3 puts chalk stripes ~11 mm apart on the jacket. */
export const CLOTH_REPEAT = 2.3;

type Spec = {
  base: string;
  /** light and dark fibre flecks */
  fleck: [string, string];
  weave: 'twill' | 'herringbone' | 'plain';
  stripe?: {color: string; count: number};
};

const SPECS: Record<ClothId, Spec> = {
  chalk: {base: '#222c41', fleck: ['rgba(255,255,255,0.05)', 'rgba(0,0,0,0.12)'], weave: 'twill', stripe: {color: 'rgba(236,230,218,0.6)', count: 4}},
  brown: {base: '#4f3a2c', fleck: ['rgba(255,236,210,0.06)', 'rgba(0,0,0,0.14)'], weave: 'herringbone'},
  black: {base: '#17181c', fleck: ['rgba(255,255,255,0.045)', 'rgba(0,0,0,0.2)'], weave: 'twill'},
  rust: {base: '#7c3826', fleck: ['rgba(255,220,190,0.07)', 'rgba(0,0,0,0.14)'], weave: 'plain'},
  teal: {base: '#1c636b', fleck: ['rgba(220,255,250,0.06)', 'rgba(0,0,0,0.14)'], weave: 'twill'},
};

function seeded(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
}

function drawWeave(g: CanvasRenderingContext2D, weave: Spec['weave'], light: string, dark: string) {
  g.lineWidth = 1;
  if (weave === 'plain') {
    for (let y = 0; y < S; y += 2) {
      g.strokeStyle = y % 4 ? light : dark;
      g.beginPath();
      g.moveTo(0, y + 0.5);
      g.lineTo(S, y + 0.5);
      g.stroke();
    }
    return;
  }
  if (weave === 'twill') {
    for (let y = -S; y < S; y += 3) {
      g.strokeStyle = (y / 3) % 2 ? light : dark;
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(S, y + S);
      g.stroke();
    }
    return;
  }
  // herringbone: columns of twill that switch direction every 32px
  const W = 32;
  for (let c = 0; c < S / W; c++) {
    const dir = c % 2 ? 1 : -1;
    g.save();
    g.beginPath();
    g.rect(c * W, 0, W, S);
    g.clip();
    for (let y = -W * 2; y < S + W * 2; y += 3) {
      g.strokeStyle = (y / 3) % 2 ? light : dark;
      g.beginPath();
      g.moveTo(c * W, y);
      g.lineTo(c * W + W, y + dir * W);
      g.stroke();
    }
    g.restore();
  }
}

function clothCanvas(id: ClothId): HTMLCanvasElement {
  const spec = SPECS[id];
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d')!;
  g.fillStyle = spec.base;
  g.fillRect(0, 0, S, S);
  drawWeave(g, spec.weave, 'rgba(255,255,255,0.045)', 'rgba(0,0,0,0.1)');

  const rand = seeded(7);
  for (let i = 0; i < 16000; i++) {
    g.fillStyle = rand() < 0.5 ? spec.fleck[0] : spec.fleck[1];
    g.fillRect(rand() * S, rand() * S, 1 + rand() * 2.5, 1);
  }

  if (spec.stripe) {
    // chalk stripe: soft, slightly wandering, like a woven-in yarn
    g.shadowColor = spec.stripe.color;
    g.shadowBlur = 4;
    g.strokeStyle = spec.stripe.color;
    g.lineWidth = 2.2;
    for (let k = 0; k < spec.stripe.count; k++) {
      const x = (k + 0.5) * (S / spec.stripe.count);
      g.beginPath();
      for (let y = 0; y <= S; y += 6) g.lineTo(x + Math.sin(y * 0.08 + k * 2) * 0.7, y);
      g.stroke();
    }
    g.shadowBlur = 0;
  }
  return c;
}

function toTexture(c: HTMLCanvasElement, srgb: boolean, anisotropy: number) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(CLOTH_REPEAT, CLOTH_REPEAT);
  t.anisotropy = anisotropy;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const cache = new Map<string, THREE.Texture>();

export function clothTexture(id: ClothId, anisotropy = 8): THREE.Texture {
  const key = `map:${id}`;
  if (!cache.has(key)) cache.set(key, toTexture(clothCanvas(id), true, anisotropy));
  return cache.get(key)!;
}

/** Twill ridges as a tangent-space normal map; shared by every cloth. */
export function twillNormal(anisotropy = 8): THREE.Texture {
  const key = 'normal';
  if (cache.has(key)) return cache.get(key)!;
  const h = new Float32Array(S * S);
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      // diagonal ridges every 6px, plus a little yarn noise
      h[y * S + x] = Math.sin(((x + y) / 6) * Math.PI * 2) * 0.5 + Math.sin(x * 1.7 + y * 0.3) * 0.08;
    }
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d')!;
  const img = g.createImageData(S, S);
  const at = (x: number, y: number) => h[((y + S) % S) * S + ((x + S) % S)];
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * 0.9;
      const dy = (at(x, y + 1) - at(x, y - 1)) * 0.9;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * S + x) * 4;
      img.data[i] = ((-dx / len) * 0.5 + 0.5) * 255;
      img.data[i + 1] = ((dy / len) * 0.5 + 0.5) * 255;
      img.data[i + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  g.putImageData(img, 0, 0);
  const t = toTexture(c, false, anisotropy);
  t.repeat.set(CLOTH_REPEAT * 2, CLOTH_REPEAT * 2);
  cache.set(key, t);
  return t;
}

/** Cutting-table paper: a 1-inch grid with heavier lines every 6 inches. */
export function cuttingGrid(): THREE.Texture {
  const key = 'grid';
  if (cache.has(key)) return cache.get(key)!;
  const c = document.createElement('canvas');
  c.width = c.height = 1024;
  const g = c.getContext('2d')!;
  g.clearRect(0, 0, 1024, 1024);
  const step = 1024 / 24;
  for (let i = 0; i <= 24; i++) {
    const heavy = i % 6 === 0;
    g.strokeStyle = heavy ? 'rgba(236,230,218,0.5)' : 'rgba(236,230,218,0.2)';
    g.lineWidth = heavy ? 2 : 1;
    g.beginPath();
    g.moveTo(i * step, 0);
    g.lineTo(i * step, 1024);
    g.moveTo(0, i * step);
    g.lineTo(1024, i * step);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 3);
  t.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, t);
  return t;
}
