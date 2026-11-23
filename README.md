# Reina Apícola — website redesign

A redesign of [reinaapicola.com](https://reinaapicola.com) in Reina Apícola's own colours (gold `#F2A900`, black and white) and type (Raleway and Open Sans). It is built with the same structure and motion system as the Safa Honey site; only the brand is different.

## What's on the page

- **The packing line (home hero).** A 3D conveyor in black and gold. As you scroll, each unit rides under a filling nozzle, honey pours in, and the lid drops and twists on. The line runs through the seven honeys in their retail packs (smooth jar, honeycomb jar, anti-drip bottle), then the bulk formats (20 kg pail, 290 kg drum, IBC tote). A readout on the belt shows the honey, the format, a lot number, the origin, and its colour on the Pfund scale, with a status badge (Conveying, Filling, Capping, Packed).
- **Honey pages** (`#rosemary`, `#orange-blossom`, `#multifloral`, `#eucalyptus`, `#heather`, `#chestnut`, `#forest`). A large two-tone title and a 3D jar that rises in; you can drag it round, with inertia. Below that: tasting notes, uses, origin and harvest, the colour grade, the formats it ships in, "Add to quote", a draggable photo gallery and the other honeys.
- **Quote list instead of a cart.** Honeys added from their pages collect in a drawer with a notes field for formats, volumes and destination. "Email this request" opens an email to info@reinaapicola.com with everything filled in.
- **English and Spanish.** Every piece of copy is in both languages (`site/src/data.js` and the `{ en, es }` objects in the components). The choice is remembered, and the first visit follows the browser's language.
- The rest of the home page:
  - a manifesto that fills in word by word
  - a band of Reina's real packing-line photo with parallax words
  - four process steps: sourced, analysed, packed, shipped
  - the honey catalogue
  - retail and industry formats
  - facilities, with key figures, the lab tests and team photos
  - market notes from the blog
  - a black footer whose "reina" wordmark sits under the crown's two gold bars

## Layout

- `site/`: the app (React, Vite, framer-motion, GSAP + ScrollTrigger, Lenis, three.js)
  - `src/models.js`: the 3D packaging, built in code. It contains the smooth jar, honeycomb jar with a hex texture, anti-drip bottle, pail, drum and IBC tote, plus the canvas-drawn labels (Reina crown, wordmark, the honey's Spanish name, weight and Pfund reading) and the line's timing (`lineState`).
  - `src/Line3D.jsx`: the hero's conveyor scene. It draws only when something moves, pauses off screen, and drops to 1× pixels on slow devices.
  - `src/Unit3D.jsx`: the draggable jar on honey pages.
  - `src/data.js`: honeys, formats, figures, steps, posts and contact details, in English and Spanish.
  - `render-posters.mjs`: renders every honey and format from the 3D models into transparent WebP posters in `assets/posters/`, using `poster.html`, a dev-only page. The posters are used in cards and the quote list, before WebGL starts, and when it isn't available. Run it again with `npm run posters` after changing a model.
  - `build-artifact.py`: builds one self-contained HTML page with everything inlined, for sharing.
- `assets/`: Reina's logo (`logo.png`, plus `logo-white.png` for dark backgrounds), the crown, facility and team photos from reinaapicola.com (`photos/`), and the rendered posters.

```bash
cd site && npm install && npm run dev
```

`npm run build` writes a static site to `site/dist/`. `npm run test:e2e` runs the Playwright suite on desktop and Pixel 7. It covers:

- the packing line and its scroll
- the language switch
- honey pages and the 3D jar
- the quote list and its email
- the menu, and Back pressed during a transition
- horizontal overflow, the footer, reduced motion, and the phone card row

CI runs it on every pull request, and merges to `master` deploy `site/dist` to the `gh-pages` branch.

## Before going live

- **Pfund readings** are typical values for each honey, labelled as such on the page. Replace them with Reina's lab figures.
- **Honey descriptions, origins and harvest seasons** are drafted from general knowledge of Spanish honeys. Reina should check them.
- **3D models** are built in code from the shapes of Reina's packaging. If Reina has 3D files or label artwork for its packs, they can replace these, as Safa's jars were built from product photos.
