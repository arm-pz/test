/** Everything the page says, in one place. Shop facts come from the shop's own
 *  Instagram (@richman_calicut): name, address, phone, what they make. */

export const shop = {
  name: 'Richman',
  line: 'Collections & Designs',
  address: ['Malabar Gate Building', 'Ram Mohan Road', 'Calicut, Kerala'],
  phoneDisplay: '97479 99595',
  phoneHref: 'tel:+919747999595',
  instagram: 'https://www.instagram.com/richman_calicut/',
};

/** Copy beats over the pinned hero; `from`/`to` are scroll progress (0–1). */
export const beats = [
  {
    from: -1,
    to: 0.06,
    title: 'Cut for you in Calicut',
    body: 'Suits, shirts and trousers made to your measurements at Richman, Ram Mohan Road.',
    cta: true,
  },
  {
    from: 0.13,
    to: 0.25,
    title: 'It starts as a length of cloth',
    body: 'Every piece is chalked onto the cloth by hand, laid along the grain so the check runs true.',
  },
  {
    from: 0.32,
    to: 0.42,
    title: 'Then the shears go in',
    body: 'Fronts, sleeves, waistcoat and trousers, each one cut to your measurements.',
  },
  {
    from: 0.49,
    to: 0.74,
    title: 'Piece by piece, a suit',
    body: 'Joined, pressed and fitted until the cloth takes your shape.',
  },
  {
    from: 0.84,
    to: 2,
    title: 'Your three-piece, made to measure',
    body: 'Choose the cloth and the cut on Ram Mohan Road. We take it from there.',
    cta: true,
  },
] as const;

export const credits = [
  {what: 'Three-piece suit', who: 'Benjamin R. (Dapper Professional)', where: 'Unsplash', href: 'https://unsplash.com/photos/man-in-blue-suit-jacket-ECJWF1NxSpM'},
  {what: 'Windowpane cloth', who: 'Garima Bhaskar', where: 'Pexels', href: 'https://www.pexels.com/photo/stylish-checkered-blue-fabric-with-made-in-italy-text-3858314/'},
  {what: 'Fitting', who: 'Tima Miroshnichenko', where: 'Pexels', href: 'https://www.pexels.com/photo/a-tailor-measuring-his-client-using-a-tape-measure-6765658/'},
];
