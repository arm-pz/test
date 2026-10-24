# Meridian — immersive studio site

A premium agency landing page built on four frontend animation libraries:

| Library | Used for |
| --- | --- |
| [React Three Fiber](https://github.com/pmndrs/react-three-fiber) (+ drei) | Live glass torus-knot showcase (`src/components/Showcase3D.jsx`) and the logo renderer |
| [liquid-glass-react](https://github.com/rdev/liquid-glass-react) | Nav pill, CTA, service cards, pricing cards, contact form (`src/components/Glass.jsx`) |
| [ShaderGradient](https://github.com/ruucm/shadergradient) | Animated hero, services and contact backgrounds (`src/components/HeroGradient.jsx`) |
| Liquid logo (custom GLSL) | Liquid-chrome wordmark that ripples under the cursor (`src/components/LiquidLogo.jsx`) |

There is no single "liquid logo" package, so the wordmark is a custom fragment shader
in the style of the Three.js examples: the text is rasterised to a mask + blurred height
field, then shaded as flowing chrome.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static output in dist/
```

Sections: hero, client marquee, intro + stats, services, 3D showcase, work, process,
pricing ($10k Signature Site), testimonial, contact form, footer. All client names and
the testimonial are placeholder content.

Note: liquid-glass-react's refraction relies on SVG displacement filters, which render
fully in Chromium; Safari and Firefox show a frosted fallback.
