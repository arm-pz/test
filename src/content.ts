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
    to: 0.1,
    title: 'Cut for you in Calicut',
    body: 'Suits, shirts and trousers made to your measurements at Richman, Ram Mohan Road.',
    cta: true,
  },
  {
    from: 0.18,
    to: 0.4,
    title: 'Lift the cloth. Find the canvas.',
    body: 'In a canvassed jacket, a layer of canvas is pad-stitched under the wool so the chest and lapels keep their shape.',
  },
  {
    from: 0.46,
    to: 0.58,
    title: 'Every piece is cut to you',
    body: 'Fronts, sleeves, lapels, flaps. Each one is drafted from your measurements before the cloth is cut.',
  },
  {
    from: 0.65,
    to: 0.83,
    title: 'Then built back around you',
    body: 'Joined, pressed and fitted until it hangs as if it was always one piece.',
  },
  {
    from: 0.9,
    to: 2,
    title: 'Made to measure on Ram Mohan Road',
    body: 'Come in, choose the cloth and the cut, and we take your measurements.',
    cta: true,
  },
] as const;

export const credits = [
  {what: 'Jacket', who: 'Victoria Priessnitz', where: 'Unsplash', href: 'https://unsplash.com/photos/black-suit-jacket-on-white-plastic-clothes-hanger-VsCBt8j-qg4'},
  {what: 'Canvas and pad-stitching', who: 'Tima Miroshnichenko', where: 'Pexels', href: 'https://www.pexels.com/photo/an-unfinished-lapel-of-a-suit-jacket-6764990/'},
  {what: 'Fitting', who: 'Tima Miroshnichenko', where: 'Pexels', href: 'https://www.pexels.com/photo/a-tailor-measuring-his-client-using-a-tape-measure-6765658/'},
  {what: 'Black suit', who: 'Ketut Subiyanto', where: 'Pexels', href: 'https://www.pexels.com/photo/man-wearing-his-black-suit-on-white-background-4965013/'},
];
