import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Liquid chrome wordmark: the text is rasterised to two canvas textures (a
// crisp alpha mask and a blurred height field). A fragment shader flows noise
// through the UVs, derives normals from the height field and shades them with
// a banded chrome palette, with a ripple that follows the pointer.

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

const fragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uMask;
  uniform sampler2D uHeight;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uHover;
  uniform float uAspect;

  vec3 hash3(vec2 p) {
    vec3 q = vec3(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)), dot(p, vec2(419.2, 371.9)));
    return fract(sin(q) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash3(i).x;
    float b = hash3(i + vec2(1.0, 0.0)).x;
    float c = hash3(i + vec2(0.0, 1.0)).x;
    float d = hash3(i + vec2(1.0, 1.0)).x;
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = p * 2.03 + vec2(1.7, 9.2);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = vec2(uv.x * uAspect, uv.y);
    float t = uTime * 0.18;

    // Pointer ripple
    vec2 m = vec2(uMouse.x * uAspect, uMouse.y);
    float d = distance(p, m);
    float ripple = sin(d * 38.0 - uTime * 5.0) * exp(-d * 7.0) * uHover;

    // Flowing displacement
    vec2 flow = vec2(fbm(p * 2.2 + t), fbm(p * 2.2 - t + 4.0)) - 0.5;
    vec2 duv = uv + flow * 0.012 + normalize(p - m + 1e-4) * ripple * 0.006 / vec2(uAspect, 1.0);

    float mask = texture2D(uMask, duv).r;
    if (mask < 0.01) discard;

    // Normal from blurred height field
    vec2 e = vec2(1.5 / 1024.0, 1.5 / 1024.0 * uAspect);
    float hL = texture2D(uHeight, duv - vec2(e.x, 0.0)).r;
    float hR = texture2D(uHeight, duv + vec2(e.x, 0.0)).r;
    float hD = texture2D(uHeight, duv - vec2(0.0, e.y)).r;
    float hU = texture2D(uHeight, duv + vec2(0.0, e.y)).r;
    vec3 n = normalize(vec3((hL - hR) * 6.0, (hD - hU) * 6.0, 1.0));
    n.xy += (flow + ripple * 0.4) * 0.9;
    n = normalize(n);

    // Chrome: reflect a banded environment
    vec3 r = reflect(vec3(0.0, 0.0, -1.0), n);
    float band = r.y * 2.4 + fbm(p * 3.0 + t * 2.0) * 1.6 + t;
    vec3 env = 0.5 + 0.5 * cos(6.28318 * (band + vec3(0.0, 0.08, 0.18)));
    float lum = dot(env, vec3(0.333));
    vec3 chrome = mix(vec3(lum), env, 0.28);
    chrome = mix(vec3(0.04, 0.04, 0.07), vec3(1.0), smoothstep(0.08, 0.95, chrome));

    // Iridescent brand tint and specular
    vec3 tint = mix(vec3(1.0, 0.56, 0.35), vec3(0.55, 0.62, 1.0), smoothstep(-0.6, 0.6, r.x));
    chrome *= mix(vec3(1.0), tint, 0.35);
    float spec = pow(max(dot(n, normalize(vec3(-0.4, 0.6, 1.0))), 0.0), 60.0);
    chrome += spec * 0.9;

    gl_FragColor = vec4(chrome, mask);
  }
`

function makeTextCanvas(text, width, height, blur) {
  const c = document.createElement('canvas')
  c.width = width
  c.height = height
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  let size = height * 0.86
  ctx.font = `italic 400 ${size}px "Instrument Serif", Georgia, serif`
  const measured = ctx.measureText(text).width
  if (measured > width * 0.94) {
    size *= (width * 0.94) / measured
    ctx.font = `italic 400 ${size}px "Instrument Serif", Georgia, serif`
  }
  if (blur) ctx.filter = `blur(${blur}px)`
  ctx.fillText(text, width / 2, height * 0.54)
  return c
}

function LogoPlane({ text, aspect }) {
  const mat = useRef()
  const mouse = useRef(new THREE.Vector2(0.5, 0.5))
  const hover = useRef(0)

  const uniforms = useMemo(() => {
    const w = 2048
    const h = Math.round(w / aspect)
    const mask = new THREE.CanvasTexture(makeTextCanvas(text, w, h, 0))
    const height = new THREE.CanvasTexture(makeTextCanvas(text, w, h, 14))
    for (const tex of [mask, height]) {
      tex.minFilter = THREE.LinearFilter
      tex.generateMipmaps = false
    }
    return {
      uMask: { value: mask },
      uHeight: { value: height },
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uHover: { value: 0 },
      uAspect: { value: aspect },
    }
  }, [text, aspect])

  useEffect(
    () => () => {
      uniforms.uMask.value.dispose()
      uniforms.uHeight.value.dispose()
    },
    [uniforms],
  )

  useFrame((state, dt) => {
    const u = mat.current.uniforms
    u.uTime.value += dt
    const target = new THREE.Vector2(state.pointer.x * 0.5 + 0.5, state.pointer.y * 0.5 + 0.5)
    const inside = Math.abs(state.pointer.x) < 1 && Math.abs(state.pointer.y) < 1
    mouse.current.lerp(target, 0.08)
    hover.current += ((inside ? 1 : 0.25) - hover.current) * 0.05
    u.uMouse.value.copy(mouse.current)
    u.uHover.value = hover.current
  })

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={mat}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        transparent
      />
    </mesh>
  )
}

export default function LiquidLogo({ text = 'Meridian', aspect = 3.2, className = '' }) {
  const [fontsReady, setFontsReady] = useState(false)
  const [visible, setVisible] = useState(true)
  const boxRef = useRef(null)

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting))
    io.observe(boxRef.current)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    let alive = true
    document.fonts
      .load('italic 400 120px "Instrument Serif"')
      .catch(() => {})
      .finally(() => alive && setFontsReady(true))
    return () => {
      alive = false
    }
  }, [])

  return (
    <div ref={boxRef} className={`liquid-logo ${className}`} style={{ aspectRatio: aspect }}>
      <h1 className="sr-only">{text}</h1>
      {fontsReady && (
        <Canvas
          dpr={[1, 2]}
          frameloop={visible ? 'always' : 'never'}
          gl={{ alpha: true, antialias: true, premultipliedAlpha: false }}
          eventPrefix="client"
          eventSource={typeof document !== 'undefined' ? document.body : undefined}
        >
          <LogoPlane text={text} aspect={aspect} />
        </Canvas>
      )}
    </div>
  )
}
