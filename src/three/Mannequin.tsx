import {useMemo} from 'react';
import * as THREE from 'three';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {TessellateModifier} from 'three/addons/modifiers/TessellateModifier.js';
import {lerp, range, smoothstep} from '../lib/math';
import {BODY, SHIRT, bodyZ} from '../lib/pattern';

/**
 * The shop's dress form: a linen-covered torso on a turned wooden stand,
 * wearing a white shirt. It stays put while the jacket comes off it.
 */

// radius at height, bottom to top; the form sits just inside the jacket
const TORSO: [number, number][] = [
  [0.0, -1.12], [0.6, -1.12], [0.68, -0.9], [0.71, -0.55], [0.64, -0.22], [0.69, 0.18], [0.78, 0.52], [0.79, 0.74], [0.7, 0.94], [0.4, 1.06], [0.2, 1.17], [0.16, 1.24],
];

function shirtGeometry() {
  const sh = new THREE.Shape();
  sh.moveTo(SHIRT[0][0] as number, SHIRT[0][1] as number);
  for (const s of SHIRT.slice(1)) sh.lineTo(s[0] as number, s[1] as number);
  let g: THREE.BufferGeometry = new THREE.ShapeGeometry(sh);
  g.deleteAttribute('normal');
  g = mergeVertices(new TessellateModifier(0.04, 8).modify(g));
  const pos = g.getAttribute('position');
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i);
    // the shirt front rises to meet the collar band around the neck
    pos.setZ(i, lerp(bodyZ(x, y) - 0.012, 0.155, smoothstep(range(y, 1.08, 1.3))));
  }
  g.computeVertexNormals();
  return g;
}

export function Mannequin() {
  const geo = useMemo(() => {
    const torso = new THREE.LatheGeometry(TORSO.map(([r, y]) => new THREE.Vector2(r, y)), 72);
    const leg = new THREE.BoxGeometry(0.07, 0.05, 0.62);
    leg.translate(0, 0, 0.31);
    return {torso, shirt: shirtGeometry(), leg};
  }, []);

  const linen = '#b9a688';
  const wood = '#5a3a22';
  // a touch flatter than the jacket's own curve so the form never shows through
  const zScale = (BODY.rz / BODY.rx) * 0.9;

  return (
    <group>
      <mesh geometry={geo.torso} scale={[1, 1, zScale]} position={[0, 0, -0.02]}>
        <meshStandardMaterial color={linen} roughness={0.95} />
      </mesh>
      {/* neck and turned cap */}
      <mesh position={[0, 1.4, -0.03]} scale={[1, 1, 0.85]}>
        <cylinderGeometry args={[0.13, 0.165, 0.32, 40]} />
        <meshStandardMaterial color={linen} roughness={0.95} />
      </mesh>
      <mesh position={[0, 1.57, -0.03]} scale={[1, 0.45, 0.85]}>
        <sphereGeometry args={[0.13, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={wood} roughness={0.45} />
      </mesh>
      <mesh position={[0, 1.66, -0.03]}>
        <sphereGeometry args={[0.035, 24, 12]} />
        <meshStandardMaterial color={wood} roughness={0.4} />
      </mesh>

      {/* shirt front and collar band */}
      <mesh geometry={geo.shirt}>
        <meshStandardMaterial color="#eef1f5" roughness={0.7} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 1.27, -0.03]} scale={[1, 1, 0.85]}>
        <cylinderGeometry args={[0.172, 0.18, 0.1, 40, 1, true]} />
        <meshStandardMaterial color="#eef1f5" roughness={0.7} side={THREE.DoubleSide} />
      </mesh>

      {/* stand */}
      <mesh position={[0, -1.85, -0.02]}>
        <cylinderGeometry args={[0.032, 0.032, 1.5, 20]} />
        <meshStandardMaterial color={wood} roughness={0.45} />
      </mesh>
      <mesh position={[0, -1.2, -0.02]}>
        <cylinderGeometry args={[0.07, 0.05, 0.08, 24]} />
        <meshStandardMaterial color="#b8924e" roughness={0.3} metalness={0.8} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} geometry={geo.leg} position={[0, -2.58, -0.02]} rotation={[0, (i / 3) * Math.PI * 2 + 0.6, 0]}>
          <meshStandardMaterial color={wood} roughness={0.45} />
        </mesh>
      ))}
    </group>
  );
}
