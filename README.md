# Richman Calicut

Website for **Richman, Collections & Designs** (Malabar Gate Building, Ram Mohan Road, Calicut).

## The hero

One pinned scroll scene built from real photographs:

1. A black jacket hangs on its hanger, whole.
2. As you scroll, it comes apart along its seams: button, flaps and welt first, then the
   lapels open like pages, the fronts lift and the sleeves swing off. Each piece is a layer
   cut from the same photograph, moved in CSS 3D depth by Framer Motion.
3. Under the wool is a second photograph: canvas pad-stitched by hand, masked to the
   jacket's silhouette, so lifting the cloth shows what holds a jacket's shape.
4. Pieces hold apart with chalk outlines and names, then go back together, and the jacket
   gives way to a photograph of the same cut, worn.

A tailor's tape on the right edge runs out as you scroll.

## Photographs

`public/media/` — all free-licence stock, credited in the page footer, as stand-ins until
the shop's own photographs are available:

| File | Source |
| --- | --- |
| `jacket/*.webp` | Victoria Priessnitz, Unsplash (background removed, hanger print painted out) |
| `jacket/inside.webp` | Tima Miroshnichenko, Pexels — pad-stitched canvas |
| `atelier.webp` | Tima Miroshnichenko, Pexels |
| `worn.webp` | Ketut Subiyanto, Pexels |

To swap in the shop's own jacket photo: shoot it front-on against a plain wall, then run
`scripts/segment_jacket.py` (U²-Net background removal), adjust the seam outlines in
`scripts/jacket_pieces.py`, and run `scripts/cut_jacket.py`. It writes the layers to
`public/media/jacket/` and their positions and outlines to `src/jacket.json`.
Run them from the repo root with the source photos and `u2net.onnx` in `raw/` (git-ignored).

## Stack

Vite 6 · React 19 · TypeScript 5.8 · Tailwind 4 · Framer Motion · Lenis.

```sh
npm install
npm run dev          # http://localhost:3006
npm run lint         # tsc --noEmit
npm run build        # dist/
npm run build:single # dist-single/index.html with JS and CSS inlined (photos stay in media/)
```

With `prefers-reduced-motion: reduce`, the page is a plain stack of the copy beside the
whole jacket and the worn photograph.
