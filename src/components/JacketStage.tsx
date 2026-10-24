import {motion, useMotionValue, useTransform, type MotionValue} from 'framer-motion';
import {useEffect, useRef} from 'react';
import jacket from '../jacket.json';
import {clamp, easeInOutCubic} from '../lib/math';

/**
 * A real jacket photograph, cut along its seams into layers (see
 * scripts/cut_jacket.py). The layers sit in one 3D space; scroll moves each
 * one off the jacket at its own depth and angle, then back.
 *
 * Under the cloth sits a second photograph: hand pad-stitched canvas, masked
 * to the jacket's silhouette, so lifting the wool shows what holds it up.
 */

const SRC = 'media/jacket/';
const BOX_W = jacket.width;
const BOX_H = jacket.height;

type Move = {
  /** offset when apart, in % of the jacket's width / height */
  dx: number;
  dy: number;
  /** depth toward the viewer, px at 1000px jacket height */
  z: number;
  rx?: number;
  ry?: number;
  rz?: number;
  /** transform origin within the piece */
  origin?: string;
  /** order of unpicking: 0 first */
  delay: number;
  label?: string;
};

// Small pieces come off first; the big panels last. Lapels open like pages
// turning on their outer edge; sleeves swing from the shoulder.
const MOVES: Record<string, Move> = {
  button: {dx: 0, dy: 16, z: 380, rz: 360, delay: 0, label: 'Button'},
  flapUL: {dx: -22, dy: 10, z: 300, rz: -10, rx: 14, delay: 0.04, label: 'Ticket pocket flap'},
  flapLL: {dx: -20, dy: 17, z: 330, rz: -6, rx: 12, delay: 0.06, label: 'Pocket flap'},
  flapR: {dx: 22, dy: 17, z: 320, rz: 8, rx: 12, delay: 0.07, label: 'Pocket flap'},
  welt: {dx: 22, dy: -10, z: 300, rz: 6, delay: 0.08, label: 'Breast welt'},
  lapelL: {dx: -10, dy: -5, z: 240, ry: 34, rz: -6, origin: '0% 40%', delay: 0.13, label: 'Lapel'},
  lapelR: {dx: 10, dy: -5, z: 250, ry: -34, rz: 6, origin: '100% 40%', delay: 0.14, label: 'Lapel'},
  frontL: {dx: -15, dy: 1, z: 130, ry: 14, rz: -1.5, delay: 0.22, label: 'Left front'},
  frontR: {dx: 15, dy: 1, z: 150, ry: -14, rz: 1.5, delay: 0.23, label: 'Right front'},
  sleeveL: {dx: -30, dy: 2, z: 60, rz: 9, ry: -6, origin: '80% 4%', delay: 0.28, label: 'Sleeve'},
  sleeveR: {dx: 30, dy: 2, z: 70, rz: -9, ry: 6, origin: '20% 4%', delay: 0.28, label: 'Sleeve'},
};
const MAX_DELAY = 0.28;

/** 0 → 1 as the jacket comes apart, holding while laid out, back to 0. */
export function apartAt(p: number) {
  if (p < 0.42) return clamp((p - 0.05) / 0.37);
  if (p < 0.6) return 1;
  return 1 - clamp((p - 0.6) / 0.27);
}

type PieceProps = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  path: string;
  apart: MotionValue<number>;
  box: React.RefObject<{w: number; h: number}>;
  narrow: boolean;
};

function Piece({id, x, y, w, h, path, apart, box, narrow}: PieceProps) {
  const m = MOVES[id];
  const lt = useTransform(apart, (a) => (m ? easeInOutCubic(clamp((a - m.delay) / (1 - MAX_DELAY))) : 0));
  const k = narrow ? 0.62 : 1;
  const tx = useTransform(lt, (v) => (m ? (v * m.dx * k * box.current.w) / 100 : 0));
  const ty = useTransform(lt, (v) => (m ? (v * m.dy * box.current.h) / 100 : 0));
  // arc: pieces come forward fastest mid-flight, then settle back a little
  const tz = useTransform(lt, (v) => (m ? (v * m.z + Math.sin(v * Math.PI) * 80) * (box.current.h / 1000) : 0));
  const rx = useTransform(lt, (v) => v * (m?.rx ?? 0));
  const ry = useTransform(lt, (v) => v * (m?.ry ?? 0));
  const rz = useTransform(lt, (v) => v * (m?.rz ?? 0));
  const shadow = useTransform(lt, (v) => v * 0.32);
  const shadowY = useTransform(lt, (v) => `${v * 3}%`);
  const chalk = useTransform(lt, [0.75, 1], [0, 1]);
  const label = useTransform(lt, [0.86, 1], [0, 1]);

  const src = `${SRC}${id}.webp`;
  return (
    <motion.div
      className="absolute [transform-style:preserve-3d]"
      style={{
        left: `${(x / BOX_W) * 100}%`,
        top: `${(y / BOX_H) * 100}%`,
        width: `${(w / BOX_W) * 100}%`,
        height: `${(h / BOX_H) * 100}%`,
        x: tx,
        y: ty,
        z: tz,
        rotateX: rx,
        rotateY: ry,
        rotateZ: rz,
        transformOrigin: m?.origin ?? '50% 50%',
      }}
    >
      {m && (
        <motion.img
          src={src}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="absolute inset-0 size-full [filter:brightness(0)_blur(14px)]"
          style={{opacity: shadow, y: shadowY}}
        />
      )}
      <img src={src} alt="" aria-hidden="true" draggable={false} className="absolute inset-0 size-full" />
      {m && (
        <motion.svg className="pointer-events-none absolute inset-0 size-full overflow-visible" viewBox={`0 0 ${w} ${h}`} style={{opacity: chalk}} aria-hidden="true">
          <path d={path} fill="none" stroke="#f1ece2" strokeWidth={1.6} strokeDasharray="7 6" vectorEffect="non-scaling-stroke" />
        </motion.svg>
      )}
      {m?.label && !(narrow && /flap|welt|Button/i.test(m.label)) && (
        <motion.span className="piece-label absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{opacity: label}}>
          {m.label}
        </motion.span>
      )}
    </motion.div>
  );
}

type Props = {
  progress: MotionValue<number>;
  narrow: boolean;
  still?: boolean;
};

export function JacketStage({progress, narrow, still = false}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const box = useRef({w: 600, h: 780});
  const apart = useTransform(progress, apartAt);

  useEffect(() => {
    const el = ref.current!;
    const ro = new ResizeObserver(() => {
      box.current = {w: el.clientWidth, h: el.clientHeight};
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // The whole jacket turns a little through the scroll and follows the
  // pointer, so the layers' different depths read as parallax.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  useEffect(() => {
    if (still) return;
    const onMove = (e: PointerEvent) => {
      px.set((e.clientX / window.innerWidth) * 2 - 1);
      py.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, {passive: true});
    return () => window.removeEventListener('pointermove', onMove);
  }, [px, py, still]);
  const turnY = useTransform([progress, px] as MotionValue<number>[], ([p, x]: number[]) => (still ? 0 : Math.sin(p * Math.PI * 2) * 16 + x * 5));
  const turnX = useTransform([progress, py] as MotionValue<number>[], ([p, y]: number[]) => (still ? 0 : Math.sin(p * Math.PI) * 6 - y * 3));

  // At rest the uncut photograph sits on top, so the cut lines never show.
  const whole = useTransform(apart, (a) => (a < 0.004 ? 1 : 0));
  const inside = useTransform(apart, (a) => (a > 0 ? 1 : 0));

  return (
    <div className="relative size-full [perspective:2200px]">
      <motion.div
        ref={ref}
        className="absolute inset-0 [transform-style:preserve-3d]"
        style={{rotateY: turnY, rotateX: turnX}}
      >
        <motion.img
          src={`${SRC}inside.webp`}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="absolute inset-0 size-full"
          style={{opacity: inside, z: -30}}
        />
        {jacket.pieces.map((pc) => (
          <Piece key={pc.id} {...pc} apart={apart} box={box} narrow={narrow} />
        ))}
        <motion.img
          src={`${SRC}whole.webp`}
          alt="A black single-breasted jacket with notch lapels on a hanger"
          draggable={false}
          className="absolute inset-0 size-full"
          style={{opacity: whole}}
        />
      </motion.div>
    </div>
  );
}
