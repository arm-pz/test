/** Everything the page says, in one place. Facts come from the shop's own
 *  Instagram (@richman_calicut): name, address, phone, what they make. */

export const shop = {
  name: 'Richman',
  line: 'Collections & Designs',
  address: ['Malabar Gate Building', 'Ram Mohan Road', 'Calicut, Kerala'],
  phoneDisplay: '97479 99595',
  phoneHref: 'tel:+919747999595',
  instagram: 'https://www.instagram.com/richman_calicut/',
};

export const beats = [
  {
    // shown at rest; scroll starts it moving
    from: -1,
    to: 0.12,
    title: 'Cut for you in Calicut',
    body: 'Suits, shirts and trousers made to your measurements at Richman, Ram Mohan Road.',
    cta: true,
  },
  {
    from: 0.2,
    to: 0.4,
    title: 'Every jacket starts as flat cloth',
    body: 'Unpick the stitches and a double-breasted jacket is eleven pieces and six buttons.',
  },
  {
    from: 0.48,
    to: 0.58,
    title: 'Drafted to one body',
    body: 'Fronts, back, sleeves, lapels and collar are each drawn from your measurements before the cloth is cut.',
  },
  {
    from: 0.66,
    to: 0.82,
    title: 'Then built back around you',
    body: 'The pieces are joined, pressed and fitted until the stripes meet across every seam.',
  },
  {
    from: 0.9,
    to: 2,
    title: 'Pick the cloth. We cut the rest.',
    body: 'A size 38 on our mannequin here. Yours is drafted to your own measurements.',
    cta: true,
  },
] as const;

/** Cloths taken from suits and blazers in the shop's recent posts. */
export const cloths = [
  {id: 'chalk', name: 'Navy chalk stripe', swatch: '#27324a'},
  {id: 'brown', name: 'Brown worsted', swatch: '#5a4232'},
  {id: 'black', name: 'Black', swatch: '#1b1c20'},
  {id: 'rust', name: 'Rust', swatch: '#8a3f2c'},
  {id: 'teal', name: 'Teal', swatch: '#1f6f78'},
] as const;

export type ClothId = (typeof cloths)[number]['id'];
