import { useLayoutEffect, useRef, useState } from 'react'
import LiquidGlass from 'liquid-glass-react'

// liquid-glass-react always centres itself with translate(-50%, -50%) and sizes
// to its content. This wrapper lets it sit in normal document flow: the outer
// box takes part in layout, and the glass is pinned to its centre at its size.
export default function Glass({
  children,
  className = '',
  innerClassName = '',
  radius = 28,
  mouseContainer = null,
  onClick,
  ...glassProps
}) {
  const boxRef = useRef(null)
  const [size, setSize] = useState(null)

  useLayoutEffect(() => {
    const el = boxRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize({ width, height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={boxRef} className={`glass-box ${className}`}>
      {/* Invisible copy keeps the box sized to the content in flow */}
      <div className={`glass-ghost ${innerClassName}`} aria-hidden="true">
        {children}
      </div>
      {size && (
        <LiquidGlass
          cornerRadius={radius}
          padding="0px"
          displacementScale={64}
          blurAmount={0.08}
          saturation={140}
          aberrationIntensity={2}
          elasticity={0.12}
          mode="standard"
          mouseContainer={mouseContainer}
          onClick={onClick}
          style={{ position: 'absolute', top: '50%', left: '50%' }}
          {...glassProps}
        >
          <div
            className={`glass-inner ${innerClassName}`}
            style={{ minWidth: size.width, minHeight: size.height }}
          >
            {children}
          </div>
        </LiquidGlass>
      )}
    </div>
  )
}
