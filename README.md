# Richman Calicut

Website for **Richman, Collections & Designs** (Malabar Gate Building, Ram Mohan Road, Calicut).

## The hero

One pinned scroll scene. A navy chalk-stripe double-breasted jacket (the size 38 from the
shop's own mannequin) comes off the dress form as you scroll:

1. the pick-stitching unpicks, buttons spin off, flaps and lapels peel away;
2. every piece arcs off the body and flattens onto a cutting table — the curved, on-body
   mesh morphs into the flat pattern piece, chalk lines draw round it and each is labelled;
3. the jacket is sewn back together, back panel first and buttons last;
4. pick a cloth (navy chalk stripe, brown, black, rust, teal — all from suits in the shop's
   posts) and every piece turns over and is re-cut in it.

A tailor's tape on the right edge runs out as you scroll.

## Stack

Vite 6 · React 19 · TypeScript 5.8 · Tailwind 4 · Framer Motion · react-three-fiber + drei ·
three.js · Lenis. Exact versions are pinned in `package.json`.

- Framer Motion owns the scroll progress (`useScroll` + `useSpring`), the copy, the tape,
  the headline reveal and the swatches. The 3D scene reads the same spring each frame.
- Cloth, normal map and cutting-table grid are drawn on canvas in `src/lib/fabric.ts`;
  there are no image assets.
- Piece outlines and the body they wrap around are in `src/lib/pattern.ts`.

```sh
npm install
npm run dev          # http://localhost:3006
npm run lint         # tsc --noEmit
npm run build        # dist/
npm run build:single # dist-single/index.html, everything inlined
```

With `prefers-reduced-motion: reduce`, the page is a plain stack of the copy next to a
still, assembled jacket (swatches still work). Without WebGL it shows the copy only.
