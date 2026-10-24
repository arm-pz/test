import {motion, useTransform, type MotionValue} from 'framer-motion';
import {useEffect, useRef} from 'react';
import suit from '../suit.json';
import {clamp, easeInOutCubic, lerp} from '../lib/math';

/**
 * From cloth to suit, in one 1000 × 1000 SVG space.
 *
 * Two real photographs share the space: a length of windowpane suiting
 * (cloth.webp) and the finished three-piece (suit.webp, cut out). Each
 * pattern piece is the suit's own outline. On the cloth it sits where a
 * cutter would lay it, on the grain, at `layScale`; it carries the cloth
 * under it as its texture, flies to its place on the suit at full size, and
 * hands over to the suit photograph as it lands.
 *
 *   0.07 – 0.26  chalk outlines drawn round each piece
 *   0.27 – 0.36  cut: the pieces lift off; the remnant cloth falls away
 *   0.40 – 0.81  each pair flies to its place over a faint ghost of the suit
 *   0.80 – 0.88  the photograph of the finished suit takes over
 */

const S = suit.layScale;
const SRC = 'media/suit/';

export const CUT_AT = 0.27;
const FLY_FROM = 0.4;
const FLY_SPAN = 0.14;
// one pair at a time, the way a suit is built: trousers, waistcoat, fronts, sleeves
const ORDER: Record<string, number> = {trouserL: 0, trouserR: 0.03, vestL: 0.08, vestR: 0.11, frontL: 0.16, frontR: 0.19, sleeveL: 0.24, sleeveR: 0.27};

const range = (v: number, a: number, b: number) => clamp((v - a) / (b - a));

type Piece = (typeof suit.pieces)[number];

/** Writes an SVG `transform` attribute from a motion value. Framer Motion
 *  treats `transform` on SVG as a CSS transform, so it is set directly. */
function useSvgTransform(value: MotionValue<string>) {
  const ref = useRef<SVGGElement>(null);
  useEffect(() => {
    const set = (v: string) => ref.current?.setAttribute('transform', v);
    set(value.get());
    return value.on('change', set);
  }, [value]);
  return ref;
}

function PieceView({pc, i, p}: {pc: Piece; i: number; p: MotionValue<number>}) {
  const [lx, ly, lrot] = pc.lay;
  const [hx, hy] = pc.home;
  // a 180° piece turns the rest of the way round rather than back
  const endRot = lrot > 90 ? 360 : 0;
  const delay = ORDER[pc.id] ?? 0;

  const transform = useTransform(p, (v) => {
    const lift = range(v, CUT_AT, CUT_AT + 0.09);
    const f = easeInOutCubic(range(v, FLY_FROM + delay, FLY_FROM + delay + FLY_SPAN));
    // lifted pieces drift a little apart, as if laid aside after cutting
    const ax = lx + (lx - 560) * 0.06 * lift;
    const ay = ly + (ly - 500) * 0.06 * lift - 6 * lift;
    // a shallow arc, lifted off the table and set down on the suit
    const mx = (ax + hx) / 2;
    const my = (ay + hy) / 2 - 70;
    const u = 1 - f;
    const x = u * u * ax + 2 * u * f * mx + f * f * hx;
    const y = u * u * ay + 2 * u * f * my + f * f * hy;
    const r = lerp(lrot, endRot, f);
    const s = lerp(S * (1 + 0.025 * lift), 1, f);
    return `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${r.toFixed(2)}) scale(${s.toFixed(4)})`;
  });
  const shadow = useTransform(p, (v) => {
    const lift = range(v, CUT_AT, CUT_AT + 0.09);
    const land = range(v, FLY_FROM + delay + FLY_SPAN * 0.8, FLY_FROM + delay + FLY_SPAN);
    return 0.38 * lift * (1 - land);
  });
  const chalk = useTransform(p, [0.07 + i * 0.016, 0.16 + i * 0.016], [0, 1]);
  const chalkFade = useTransform(p, [FLY_FROM + delay + FLY_SPAN * 0.5, FLY_FROM + delay + FLY_SPAN], [0.9, 0]);
  const mark = useTransform(p, (v) => range(v, 0.16 + i * 0.016, 0.22 + i * 0.016) * (1 - range(v, FLY_FROM + delay, FLY_FROM + delay + 0.08)));
  const opacity = useTransform(p, [0.85, 0.9], [1, 0]);

  // the cloth under the piece where it lies on the marker, in piece space
  const clothXf = `scale(${(1 / S).toFixed(5)}) rotate(${-lrot}) translate(${-lx} ${-ly})`;
  const [g0, g1] = pc.grain;
  const ref = useSvgTransform(transform);

  return (
    <motion.g ref={ref} style={{opacity}}>
      <motion.path d={pc.path} fill="#0b1020" filter="url(#piece-shadow)" style={{opacity: shadow}} transform="translate(0 16)" />
      <g clipPath={`url(#clip-${pc.id})`}>
        <image href={`${SRC}cloth.webp`} width={1000} height={1000} transform={clothXf} preserveAspectRatio="none" />
      </g>
      <motion.path
        d={pc.path}
        fill="none"
        stroke="#f2eee6"
        strokeWidth={2.4 / S}
        strokeLinejoin="round"
        style={{pathLength: chalk, opacity: chalkFade}}
      />
      {/* grain line and the cutter's chalk note, as on a real marker */}
      <motion.g style={{opacity: mark}} stroke="#f2eee6" strokeWidth={1.8 / S} fill="none">
        <line x1={0} y1={g0} x2={0} y2={g1} />
        <path d={`M-9 ${g0 + 18} L0 ${g0} L9 ${g0 + 18} M-9 ${g1 - 18} L0 ${g1} L9 ${g1 - 18}`} />
        <text
          x={14}
          y={0}
          fill="#f2eee6"
          stroke="none"
          fontFamily="Hanken Grotesk, Helvetica Neue, Arial, sans-serif"
          fontSize={15 / S}
          letterSpacing={2 / S}
          transform={`rotate(-90 14 0)`}
          textAnchor="middle"
        >
          {pc.label.toUpperCase()}
        </text>
      </motion.g>
    </motion.g>
  );
}

export function SuitStage({progress, still = false}: {progress: MotionValue<number>; still?: boolean}) {
  const p = progress;
  // until the cut, the cloth is one uninterrupted photograph
  const whole = useTransform(p, (v) => (v < CUT_AT ? 1 : 0));
  const remnant = useTransform(p, (v) => (v < CUT_AT ? 0 : 1 - range(v, CUT_AT + 0.06, FLY_FROM + 0.06)));
  const remnantXf = useTransform(p, (v) => `translate(0 ${(range(v, CUT_AT + 0.04, FLY_FROM + 0.08) * 60).toFixed(1)})`);
  const remnantRef = useSvgTransform(remnantXf);
  // a faint ghost of the finished suit shows where the pieces go, then the
  // photograph takes over as the last sleeve lands
  const ghost = useTransform(p, [0.38, 0.46, 0.84, 0.88], [0, 0.14, 0.14, 0]);
  const suitOn = useTransform(p, [0.8, 0.88], [0, 1]);
  const suitScale = useTransform(p, [0.79, 1], [0.985, 1]);

  if (still) {
    return (
      <svg viewBox="0 0 1000 1000" className="block size-full" role="img" aria-label="A blue windowpane three-piece suit">
        <image href={`${SRC}suit.webp`} width={1000} height={1000} />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 1000 1000" className="block size-full overflow-visible" role="img" aria-label="A length of blue windowpane cloth is chalked, cut into pattern pieces, and assembled into a three-piece suit">
      <defs>
        {suit.pieces.map((pc) => (
          <clipPath key={pc.id} id={`clip-${pc.id}`}>
            <path d={pc.path} />
          </clipPath>
        ))}
        <mask id="remnant-mask" maskUnits="userSpaceOnUse" x={0} y={0} width={1000} height={1000}>
          <rect width={1000} height={1000} fill="#fff" />
          {suit.pieces.map((pc) => (
            <path key={pc.id} d={pc.path} fill="#000" transform={`translate(${pc.lay[0]} ${pc.lay[1]}) rotate(${pc.lay[2]}) scale(${S})`} />
          ))}
        </mask>
        <filter id="piece-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <clipPath id="cloth-edge">
          <rect width={1000} height={1000} rx={2} />
        </clipPath>
      </defs>

      <g clipPath="url(#cloth-edge)">
        <motion.image href={`${SRC}cloth.webp`} width={1000} height={1000} style={{opacity: whole}} />
        <motion.g ref={remnantRef} style={{opacity: remnant}}>
          <image href={`${SRC}cloth.webp`} width={1000} height={1000} mask="url(#remnant-mask)" />
        </motion.g>
      </g>

      <motion.image href={`${SRC}suit.webp`} width={1000} height={1000} style={{opacity: ghost}} />

      {suit.pieces.map((pc, i) => (
        <PieceView key={pc.id} pc={pc} i={i} p={p} />
      ))}

      <motion.image
        href={`${SRC}suit.webp`}
        width={1000}
        height={1000}
        style={{opacity: suitOn, scale: suitScale, transformOrigin: '500px 500px'}}
      />
    </svg>
  );
}
