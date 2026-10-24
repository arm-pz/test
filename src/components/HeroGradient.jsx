import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react'

export default function HeroGradient({ variant = 'hero' }) {
  const presets = {
    hero: {
      type: 'waterPlane',
      color1: '#ff6b3d',
      color2: '#3b2bff',
      color3: '#0b0a14',
      uSpeed: 0.18,
      uStrength: 3.2,
      uDensity: 1.4,
      uFrequency: 5.5,
      brightness: 1.15,
      cDistance: 3.6,
      cPolarAngle: 115,
      cAzimuthAngle: 180,
      rotationX: 50,
      rotationY: 0,
      rotationZ: -60,
      positionX: 0,
      positionY: 0.9,
      positionZ: -0.3,
    },
    services: {
      type: 'plane',
      color1: '#ff6b3d',
      color2: '#6b5cff',
      color3: '#0b0a12',
      uSpeed: 0.2,
      uStrength: 4,
      uDensity: 1.3,
      uFrequency: 5.5,
      brightness: 1.1,
      cDistance: 3.9,
      cPolarAngle: 90,
      cAzimuthAngle: 180,
      rotationX: 0,
      rotationY: 10,
      rotationZ: 50,
      positionX: -1.4,
      positionY: 0,
      positionZ: 0,
    },
    cta: {
      type: 'sphere',
      color1: '#ff8a5c',
      color2: '#6b5cff',
      color3: '#12101f',
      uSpeed: 0.25,
      uStrength: 0.4,
      uDensity: 0.9,
      uFrequency: 5.5,
      brightness: 1.2,
      cDistance: 7,
      cPolarAngle: 90,
      cAzimuthAngle: 180,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      positionX: -0.1,
      positionY: 0,
      positionZ: 0,
    },
  }

  return (
    <ShaderGradientCanvas
      className="gradient-canvas"
      pointerEvents="none"
      pixelDensity={1}
      fov={45}
      lazyLoad
    >
      <ShaderGradient
        control="props"
        animate="on"
        grain="on"
        lightType="3d"
        envPreset="city"
        reflection={0.1}
        cameraZoom={1}
        {...presets[variant]}
      />
    </ShaderGradientCanvas>
  )
}
