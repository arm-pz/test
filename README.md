# Richman Calicut

Website for **Richman, Collections & Designs** (Malabar Gate Building, Ram Mohan Road, Calicut).

## The hero: from cloth to suit

One pinned scroll scene, built from two real photographs:

1. **The cloth.** A length of blue windowpane suiting, selvedge and all.
2. **Chalk.** Eight pattern pieces are drawn onto it the way a cutter lays a marker: on the
   grain, with grain-line arrows and the piece written on each one.
3. **The cut.** The pieces lift off the cloth, leaving the holes behind; the remnant falls away.
4. **Assembly.** Pair by pair (trousers, waistcoat, fronts, sleeves) each piece flies to its
   place over a faint ghost of the finished suit.
5. **The suit.** The photograph of the finished three-piece takes over.

Each pattern piece is the suit's own outline, traced from the photograph, so the pieces land
exactly where the photographed suit is. A tailor's tape on the right edge runs out as you scroll.

## Photographs

All free-licence stock, credited in the footer, as stand-ins until the shop's own photographs are
available. The cloth's selvedge lettering (a mill name and "Made in Italy") was painted out so the
page makes no claim about the cloth's origin.

| File | Source |
| --- | --- |
| `public/media/suit/suit.webp` | Benjamin R. (Dapper Professional), Unsplash — background removed |
| `public/media/suit/cloth.webp` | Garima Bhaskar, Pexels — selvedge lettering removed |
| `public/media/atelier.webp` | Tima Miroshnichenko, Pexels |

### Rebuilding the assets

From the repo root, with the source photos `raw/suit.jpg`, `raw/cloth.jpg` and the U²-Net model
`raw/u2net.onnx` in a git-ignored `raw/` folder:

```sh
python3 scripts/suit_cut.py      # cut the suit out of its backdrop
python3 scripts/cloth_prep.py    # remove selvedge lettering, square crop
python3 scripts/layout.py        # optional: preview the cutting layout
python3 scripts/export_suit.py   # write public/media/suit/* and src/suit.json
```

Piece outlines live in `scripts/suit_pieces.py`; their positions on the cloth in
`scripts/layout.py`. To use the shop's own suit, photograph it front-on against a plain wall,
retrace the outlines on it, and rerun.

## Stack

Vite 6 · React 19 · TypeScript 5.8 · Tailwind 4 · Framer Motion · Lenis.

```sh
npm install
npm run dev          # http://localhost:3006
npm run lint         # tsc --noEmit
npm run build        # dist/
npm run build:single # dist-single/index.html with JS and CSS inlined (photos stay in media/)
```

With `prefers-reduced-motion: reduce`, the page is a plain stack of the copy beside the cloth
and the finished suit.
