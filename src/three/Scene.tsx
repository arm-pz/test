import {ContactShadows, Environment, Lightformer} from '@react-three/drei';
import {Canvas, useFrame, useThree} from '@react-three/fiber';
import type {MotionValue} from 'framer-motion';
import {useMemo, useRef} from 'react';
import * as THREE from 'three';
import type {ClothId} from '../content';
import {cuttingGrid} from '../lib/fabric';
import {easeInOutCubic, lerp} from '../lib/math';
import {apartAt} from '../lib/pattern';
import {Jacket} from './Jacket';
import {Mannequin} from './Mannequin';

type Props = {
  progress: MotionValue<number>;
  cloth: ClothId;
  labels: React.RefObject<HTMLDivElement | null>;
  still?: boolean;
};

const FOV = 30;
const HALF_TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));

/**
 * Camera and turntable. Close on the jacket at rest; pulled back far enough
 * to see every laid-out piece when it is apart. On wide screens the form sits
 * right of centre so the copy has the left third.
 */
function Rig({progress, cloth, labels, still}: Props) {
  const {size, camera} = useThree();
  const phone = size.width <= 760;
  const turntable = useRef<THREE.Group>(null);
  const grid = useRef<THREE.Mesh>(null);
  const pointer = useRef({x: 0, y: 0});
  const gridTex = useMemo(() => cuttingGrid(), []);

  useFrame((state) => {
    const p = progress.get();
    const T = easeInOutCubic(apartAt(p));
    const aspect = size.width / Math.max(1, size.height);

    pointer.current.x = lerp(pointer.current.x, still ? 0 : state.pointer.x, 0.05);
    pointer.current.y = lerp(pointer.current.y, still ? 0 : state.pointer.y, 0.05);

    const needH = lerp(4.2, phone ? 8.4 : 6.6, T);
    const needW = lerp(phone ? 3.5 : 3.3, phone ? 3.9 : 9.2, T);
    const dist = Math.max(needH, needW / aspect) / (2 * HALF_TAN);
    camera.position.set(pointer.current.x * 0.3, 0.15 - pointer.current.y * 0.2, dist);
    camera.lookAt(0, 0, 0);

    const visW = 2 * dist * HALF_TAN * aspect;
    const visH = 2 * dist * HALF_TAN;
    const g = turntable.current!;
    // the static (reduced-motion) layout gives the scene its own column
    g.position.x = phone || still ? 0 : visW * lerp(0.18, 0.145, T);
    g.position.y = phone ? -visH * lerp(0.2, 0.15, T) : lerp(-0.2, 0, T);
    // a slow three-quarter turn each way, so the cut reads in depth
    g.rotation.y = (still ? 0 : Math.sin(p * Math.PI * 2) * 0.42) + pointer.current.x * 0.14;
    g.rotation.x = Math.sin(p * Math.PI) * 0.06;

    (grid.current!.material as THREE.MeshBasicMaterial).opacity = T * 0.16;
  });

  return (
    <group ref={turntable}>
      <mesh ref={grid} position={[0, 0, -0.95]}>
        <planeGeometry args={[16, 10]} />
        <meshBasicMaterial map={gridTex} transparent opacity={0} depthWrite={false} />
      </mesh>
      <Mannequin />
      <Jacket progress={progress} cloth={cloth} labels={labels} phone={phone} />
      <ContactShadows position={[0, -2.62, 0]} scale={4} blur={2.4} far={1.2} opacity={0.55} color="#05070c" />
    </group>
  );
}

export function Scene(props: Props) {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{antialias: true, alpha: true, powerPreference: 'high-performance'}}
      camera={{fov: FOV, position: [0, 0, 9], near: 0.1, far: 60}}
      style={{position: 'absolute', inset: 0}}
    >
      <ambientLight intensity={0.15} />
      <directionalLight position={[3, 4, 5]} intensity={1.6} color="#fff1dc" />
      <directionalLight position={[-4, 2, -3]} intensity={0.9} color="#9fb3d9" />
      {/* Studio lighting built in place: no HDR file to fetch. */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.2} color="#fff4e6" position={[0, 4, 3]} scale={[8, 3, 1]} rotation-x={Math.PI / 3} />
        <Lightformer form="rect" intensity={1.2} color="#dbe5ff" position={[-5, 1, 1]} scale={[2, 6, 1]} rotation-y={Math.PI / 2} />
        <Lightformer form="rect" intensity={1.6} color="#ffe2bf" position={[5, 0.5, 2]} scale={[2, 6, 1]} rotation-y={-Math.PI / 2} />
        <Lightformer form="circle" intensity={0.8} color="#ffffff" position={[0, -3, 4]} scale={3} />
      </Environment>
      <Rig {...props} />
    </Canvas>
  );
}
