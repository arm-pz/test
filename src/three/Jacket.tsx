import {useFrame, useThree} from '@react-three/fiber';
import type {MotionValue} from 'framer-motion';
import {useEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import type {ClothId} from '../content';
import {clothTexture, twillNormal} from '../lib/fabric';
import {clamp, easeInOutCubic, lerp, range, smoothstep} from '../lib/math';
import {BUTTONS, PIECES, apartAt, bodyZ, buildPiece, localT} from '../lib/pattern';

type Props = {
  progress: MotionValue<number>;
  cloth: ClothId;
  labels: React.RefObject<HTMLDivElement | null>;
  phone: boolean;
};

const SHEEN: Record<ClothId, string> = {chalk: '#8d9bbd', brown: '#b39275', black: '#6a6f80', rust: '#d08a6d', teal: '#7fc3c2'};

type Live = {
  group: THREE.Group;
  mesh: THREE.Mesh;
  chalk: THREE.Line;
  stitch: THREE.Line;
  stitchCount: number;
  material: THREE.MeshPhysicalMaterial;
  a: THREE.Vector3;
  via: THREE.Vector3;
  e: THREE.Vector3;
  ep: THREE.Vector3;
  rot: THREE.Euler;
  tumble: THREE.Vector3;
  delay: number;
  label: HTMLDivElement | null;
  small: boolean;
  lt: number;
};

type Button = {group: THREE.Group; a: THREE.Vector3; e: THREE.Vector3; ep: THREE.Vector3; delay: number; spin: number};

function buttonGeometry() {
  // a domed horn button with a raised rim, turned on a lathe
  const pts = [
    [0, 0.012], [0.02, 0.0115], [0.032, 0.01], [0.038, 0.0135], [0.044, 0.012], [0.047, 0.006], [0.046, 0], [0, 0],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const g = new THREE.LatheGeometry(pts, 40);
  g.rotateX(Math.PI / 2);
  return g;
}

export function Jacket({progress, cloth, labels, phone}: Props) {
  const root = useRef<THREE.Group>(null);
  const {camera, size, gl} = useThree();
  const anisotropy = gl.capabilities.getMaxAnisotropy();

  const {pieces, buttons} = useMemo(() => {
    const normalMap = twillNormal(anisotropy);
    const lining = new THREE.MeshStandardMaterial({color: '#6e4b37', roughness: 0.42, metalness: 0.05, side: THREE.DoubleSide});

    const pieces: Live[] = PIECES.map((d, i) => {
      const built = buildPiece(d.pts, d.kind, d.lift, d.outward);
      const material = new THREE.MeshPhysicalMaterial({
        map: clothTexture('chalk', anisotropy),
        normalMap,
        normalScale: new THREE.Vector2(0.45, 0.45),
        roughness: 0.84,
        sheen: 1,
        sheenRoughness: 0.55,
        sheenColor: new THREE.Color(SHEEN.chalk),
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(built.geometry, [material, lining, material]);
      mesh.morphTargetInfluences = [0];

      const chalk = new THREE.Line(
        built.chalk,
        new THREE.LineDashedMaterial({color: '#ece6da', dashSize: 0.05, gapSize: 0.03, transparent: true, opacity: 0, depthWrite: false}),
      );
      chalk.computeLineDistances();
      chalk.morphTargetInfluences = [0];

      const stitch = new THREE.Line(
        built.stitch,
        new THREE.LineDashedMaterial({color: '#d9cfbd', dashSize: 0.012, gapSize: 0.014, transparent: true, opacity: 0.32}),
      );
      stitch.morphTargetInfluences = [0];

      const group = new THREE.Group();
      group.add(mesh, chalk, stitch);
      group.position.copy(built.centre);

      const a = built.centre.clone();
      const sign = i % 2 ? 1 : -1;
      return {
        group, mesh, chalk, stitch, material,
        stitchCount: built.stitch.getAttribute('position').count,
        a,
        via: a.clone().add(new THREE.Vector3(...d.via)),
        e: new THREE.Vector3(...d.e),
        ep: new THREE.Vector3(...d.ep),
        rot: new THREE.Euler(...d.rot),
        tumble: new THREE.Vector3(0.35 * sign, 0.5 * -sign, 0.25 * sign),
        delay: d.delay,
        label: null,
        small: /flap|welt|collar/i.test(d.id),
        lt: 0,
      };
    });

    const bGeo = buttonGeometry();
    const horn = new THREE.MeshPhysicalMaterial({color: '#2a1c14', roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.25});
    const hole = new THREE.MeshBasicMaterial({color: '#0b0705'});
    const holeGeo = new THREE.CircleGeometry(0.0065, 12);
    const buttons: Button[] = BUTTONS.map((b, i) => {
      const group = new THREE.Group();
      group.add(new THREE.Mesh(bGeo, horn));
      for (const [hx, hy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        const h = new THREE.Mesh(holeGeo, hole);
        h.position.set(hx * 0.011, hy * 0.011, 0.0125);
        group.add(h);
      }
      const [x, y] = b.at;
      const a = new THREE.Vector3(x, y, bodyZ(x, y) + 0.072);
      group.position.copy(a);
      return {group, a, e: new THREE.Vector3(b.e[0], b.e[1], 1.1), ep: new THREE.Vector3(b.ep[0], b.ep[1], 1.1), delay: i * 0.012, spin: i % 2 ? 1 : -1};
    });

    return {pieces, buttons};
  }, [anisotropy]);

  // Piece labels live in the DOM, positioned each frame from the 3D scene.
  useEffect(() => {
    const host = labels.current;
    if (!host) return;
    host.replaceChildren();
    const make = (title: string, note?: string) => {
      const el = document.createElement('div');
      el.className = 'piece-label';
      el.style.position = 'absolute';
      el.style.left = '0';
      el.style.top = '0';
      el.style.opacity = '0';
      el.innerHTML = `<b>${title}</b>${note ? `<span>${note}</span>` : ''}`;
      host.appendChild(el);
      return el;
    };
    PIECES.forEach((d, i) => {
      if (d.label) pieces[i].label = make(d.label, d.note);
    });
    const buttonLabel = make('Buttons', '× 6');
    buttonLabelRef.current = buttonLabel;
    return () => host.replaceChildren();
  }, [labels, pieces]);
  const buttonLabelRef = useRef<HTMLDivElement | null>(null);

  // Changing the cloth turns each piece over in turn, left to right; the new
  // cloth is swapped in while the piece is edge-on.
  const flip = useRef({start: -1, to: cloth as ClothId, swapped: new Set<number>()});
  useEffect(() => {
    if (pieces[0].material.map === clothTexture(cloth, anisotropy)) return;
    flip.current = {start: performance.now(), to: cloth, swapped: new Set()};
  }, [cloth, pieces, anisotropy]);

  const v = useMemo(() => new THREE.Vector3(), []);
  const order = useMemo(() => pieces.map((p, i) => ({i, x: p.a.x})).sort((m, n) => m.x - n.x).map((o) => o.i), [pieces]);

  useFrame(() => {
    const p = progress.get();
    const t = apartAt(p);
    const now = performance.now();
    const f = flip.current;

    pieces.forEach((pc, i) => {
      const lt = easeInOutCubic(localT(t, pc.delay));
      pc.lt = lt;
      const e = phone ? pc.ep : pc.e;
      // quadratic path: body → waypoint → table
      const u = 1 - lt;
      pc.group.position.set(
        u * u * pc.a.x + 2 * u * lt * pc.via.x + lt * lt * e.x,
        u * u * pc.a.y + 2 * u * lt * pc.via.y + lt * lt * e.y,
        u * u * pc.a.z + 2 * u * lt * pc.via.z + lt * lt * e.z,
      );
      const arc = Math.sin(lt * Math.PI);
      let flipY = 0;
      if (f.start > 0) {
        const k = clamp((now - f.start - order.indexOf(i) * 55) / 650);
        flipY = easeInOutCubic(k) * Math.PI * 2;
        if (k > 0.25 && !f.swapped.has(i)) {
          f.swapped.add(i);
          pc.material.map = clothTexture(f.to, anisotropy);
          pc.material.sheenColor.set(SHEEN[f.to]);
          pc.material.needsUpdate = true;
        }
      }
      pc.group.rotation.set(
        pc.rot.x * lt + arc * pc.tumble.x,
        pc.rot.y * lt + arc * pc.tumble.y + flipY,
        pc.rot.z * lt + arc * pc.tumble.z,
      );

      // curved on the body → flat on the table
      const flat = smoothstep(range(lt, 0.25, 0.8));
      pc.mesh.morphTargetInfluences![0] = flat;
      pc.chalk.morphTargetInfluences![0] = flat;
      pc.stitch.morphTargetInfluences![0] = flat;
      (pc.chalk.material as THREE.LineDashedMaterial).opacity = range(lt, 0.8, 1) * 0.9;
      // stitches unpick first and are sewn back last
      pc.stitch.geometry.setDrawRange(0, Math.round((1 - range(lt, 0, 0.22)) * pc.stitchCount));
    });
    if (f.start > 0 && now - f.start > 650 + pieces.length * 55 + 50) f.start = -1;

    buttons.forEach((b) => {
      const lt = easeInOutCubic(localT(t, b.delay));
      const e = phone ? b.ep : b.e;
      const arc = Math.sin(lt * Math.PI);
      b.group.position.set(lerp(b.a.x, e.x, lt), lerp(b.a.y, e.y, lt) + arc * 0.4, lerp(b.a.z, e.z, lt) + arc * 0.9);
      b.group.rotation.set(arc * 1.2, 0, lt * Math.PI * 3 * b.spin);
    });

    // labels
    const W = size.width, H = size.height;
    const place = (el: HTMLDivElement | null, obj: THREE.Object3D, dy: number, alpha: number) => {
      if (!el) return;
      obj.getWorldPosition(v);
      v.y += dy;
      v.project(camera);
      const x = (v.x * 0.5 + 0.5) * W;
      const y = (-v.y * 0.5 + 0.5) * H;
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`;
      el.style.opacity = alpha.toFixed(3);
    };
    pieces.forEach((pc) => {
      const alpha = range(pc.lt, 0.88, 1) * (phone && pc.small ? 0 : 1);
      place(pc.label, pc.group, pc.small ? -0.2 : 0, alpha);
    });
    const last = buttons[buttons.length - 1];
    place(buttonLabelRef.current, buttons[2].group, -0.18, range(easeInOutCubic(localT(t, last.delay)), 0.88, 1) * (phone ? 0 : 1));
  });

  return (
    <group ref={root}>
      {pieces.map((pc, i) => (
        <primitive key={i} object={pc.group} />
      ))}
      {buttons.map((b, i) => (
        <primitive key={`b${i}`} object={b.group} />
      ))}
    </group>
  );
}
