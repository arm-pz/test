import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  Environment,
  Float,
  Lightformer,
  MeshTransmissionMaterial,
  ContactShadows,
} from '@react-three/drei'

function Knot() {
  const ref = useRef()
  useFrame((state, dt) => {
    ref.current.rotation.x += dt * 0.15
    ref.current.rotation.y += dt * 0.2
    ref.current.rotation.z = state.pointer.x * 0.4
    ref.current.position.y = state.pointer.y * 0.15
  })
  return (
    <Float speed={1.4} rotationIntensity={0.4} floatIntensity={0.8}>
      <mesh ref={ref} scale={0.95}>
        <torusKnotGeometry args={[1, 0.34, 256, 48]} />
        <MeshTransmissionMaterial
          backside
          samples={6}
          resolution={512}
          thickness={1.2}
          roughness={0.05}
          ior={1.45}
          chromaticAberration={0.6}
          anisotropy={0.3}
          distortion={0.4}
          distortionScale={0.4}
          temporalDistortion={0.15}
          color="#ffffff"
        />
      </mesh>
    </Float>
  )
}

// Big type behind the knot so the transmission material has something to refract
function Backdrop() {
  const texture = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 2048
    c.height = 512
    const ctx = c.getContext('2d')
    ctx.fillStyle = '#f2efe9'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = '600 300px "Inter Tight", Helvetica, Arial, sans-serif'
    ctx.fillText('REAL\u00B7TIME', 1024, 270)
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [])
  return (
    <mesh position={[0, 0, -2.5]}>
      <planeGeometry args={[9, 2.25]} />
      <meshBasicMaterial map={texture} transparent toneMapped={false} />
    </mesh>
  )
}

export default function Showcase3D({ active = true }) {
  return (
    <Canvas
      className="showcase-canvas"
      frameloop={active ? 'always' : 'never'}
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 5.5], fov: 40 }}
      eventPrefix="client"
      eventSource={typeof document !== 'undefined' ? document.body : undefined}
    >
      <color attach="background" args={['#0b0a12']} />
      <Backdrop />
      <Knot />
      <ContactShadows position={[0, -1.8, 0]} opacity={0.5} scale={10} blur={2.6} far={3} />
      <Environment resolution={256}>
        <group rotation={[-Math.PI / 3, 0, 1]}>
          <Lightformer form="circle" intensity={4} color="#ff7a4a" position={[0, 5, -9]} scale={2} />
          <Lightformer form="circle" intensity={2} color="#6b5cff" position={[-5, 1, -1]} scale={2} />
          <Lightformer form="ring" intensity={2} color="#ffffff" position={[5, 1, -1]} scale={6} />
          <Lightformer form="rect" intensity={1.5} position={[-5, -1, -1]} scale={[10, 1, 1]} />
        </group>
      </Environment>
    </Canvas>
  )
}
