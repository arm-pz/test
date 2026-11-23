import logo from '@assets/logo.png'
import logoWhite from '@assets/logo-white.png'
import building from '@assets/photos/building.webp'
import labScientist from '@assets/photos/lab-scientist.webp'
import lab from '@assets/photos/lab.webp'
import warehouse from '@assets/photos/warehouse.webp'
import lineEmpty from '@assets/photos/line-empty.webp'
import lineOperator from '@assets/photos/line-operator.webp'
import lineFilled from '@assets/photos/line-filled.webp'
import filler from '@assets/photos/filler.webp'
import capper from '@assets/photos/capper.webp'
import tanks from '@assets/photos/tanks.webp'
import pallet from '@assets/photos/pallet.webp'
import teamLine from '@assets/photos/team-line.webp'
import teamWarehouse from '@assets/photos/team-warehouse.webp'
import teamOffice from '@assets/photos/team-office.webp'
import beekeeper from '@assets/photos/beekeeper.webp'
import dipper from '@assets/photos/dipper.webp'

export const img = {
  logo, logoWhite, building, labScientist, lab, warehouse, lineEmpty, lineOperator, lineFilled,
  filler, capper, tanks, pallet, teamLine, teamWarehouse, teamOffice, beekeeper, dipper,
}

// Rendered from the 3D models by tools/posters.mjs; used before WebGL starts and in the product grid.
const posterFiles = import.meta.glob('@assets/posters/*.webp', { eager: true, import: 'default' })
export const poster = key => Object.entries(posterFiles).find(([k]) => k.endsWith(`/${key}.webp`))?.[1]

/* Every piece of copy is { en, es }; t() in ui.jsx picks the visitor's language. */

// Colour on the Pfund scale (mm) with its USDA class. Readings are typical for each honey;
// each lot ships with its own analysis.
export const pfundClass = mm => mm <= 8 ? { en: 'Water white', es: 'Blanco agua' }
  : mm <= 17 ? { en: 'Extra white', es: 'Extra blanco' }
  : mm <= 34 ? { en: 'White', es: 'Blanco' }
  : mm <= 50 ? { en: 'Extra light amber', es: 'Ámbar extra claro' }
  : mm <= 85 ? { en: 'Light amber', es: 'Ámbar claro' }
  : mm <= 114 ? { en: 'Amber', es: 'Ámbar' }
  : { en: 'Dark amber', es: 'Ámbar oscuro' }

// format = the retail pack each honey is shown in on the packing line and its page
export const varieties = [
  {
    slug: 'rosemary', es: 'Romero', n: { en: 'Rosemary Honey', es: 'Miel de Romero' }, color: '#e8b545', pfund: 10, format: 'smooth', lid: 'gold',
    origin: { en: 'Valencia and Aragón', es: 'Valencia y Aragón' },
    season: { en: 'Late winter to spring', es: 'Finales de invierno a primavera' },
    desc: {
      en: 'Pale, delicate and floral, with a light note of the herb. Rosemary honey sets quickly into a fine, almost white cream, and is one of the classic single-flower honeys of eastern Spain.',
      es: 'Clara, delicada y floral, con una ligera nota de la planta. La miel de romero cristaliza pronto en una crema fina, casi blanca, y es una de las mieles monoflorales clásicas del este de España.',
    },
    uses: { en: 'Breakfast ranges, tea, yoghurt and fine pastry.', es: 'Gamas de desayuno, infusiones, yogur y pastelería fina.' },
  },
  {
    slug: 'orange-blossom', es: 'Azahar', n: { en: 'Orange Blossom Honey', es: 'Miel de Azahar' }, color: '#dc9a22', pfund: 24, format: 'comb', lid: 'gold',
    origin: { en: 'Valencia', es: 'Valencia' },
    season: { en: 'Spring', es: 'Primavera' },
    desc: {
      en: 'Bright and fragrant, with the scent of the citrus orchards that surround Alzira. A light, sweet honey that is easy to place on any shelf.',
      es: 'Luminosa y aromática, con el perfume de los naranjos que rodean Alzira. Una miel clara y dulce que encaja en cualquier lineal.',
    },
    uses: { en: 'Retail jars, desserts, dressings and gift ranges.', es: 'Tarros de lineal, postres, aliños y gamas de regalo.' },
  },
  {
    slug: 'multifloral', es: 'Mil Flores', n: { en: 'Multifloral Honey', es: 'Miel Mil Flores' }, color: '#c46c10', pfund: 60, format: 'drip', lid: 'gold',
    origin: { en: 'Spain and selected origins', es: 'España y orígenes seleccionados' },
    season: { en: 'Spring and summer', es: 'Primavera y verano' },
    desc: {
      en: 'Rounded and versatile: a blend of spring and summer flowers, balanced in our laboratory so colour and flavour stay consistent from lot to lot.',
      es: 'Redonda y versátil: una mezcla de flores de primavera y verano, equilibrada en nuestro laboratorio para que el color y el sabor se mantengan de un lote a otro.',
    },
    uses: { en: 'Everyday retail, food service and industry.', es: 'Lineal diario, hostelería e industria.' },
  },
  {
    slug: 'eucalyptus', es: 'Eucalipto', n: { en: 'Eucalyptus Honey', es: 'Miel de Eucalipto' }, color: '#a14c0c', pfund: 76, format: 'smooth', lid: 'black',
    origin: { en: 'Huelva and Galicia', es: 'Huelva y Galicia' },
    season: { en: 'Summer', es: 'Verano' },
    desc: {
      en: 'Warm and slightly balsamic, with a fresh finish. Demand peaks every winter, so we plan stock with our buyers well before the cold season.',
      es: 'Cálida y algo balsámica, con un final fresco. La demanda sube cada invierno, así que planificamos el stock con nuestros clientes antes de que llegue el frío.',
    },
    uses: { en: 'Winter campaigns, pharmacy and herbal drinks.', es: 'Campañas de invierno, farmacia e infusiones.' },
  },
  {
    slug: 'heather', es: 'Brezo', n: { en: 'Heather Honey', es: 'Miel de Brezo' }, color: '#76320c', pfund: 100, format: 'comb', lid: 'gold',
    origin: { en: 'Galicia and León', es: 'Galicia y León' },
    season: { en: 'Late summer', es: 'Finales de verano' },
    desc: {
      en: 'Intense and slightly bitter, with a caramel aroma and a dense body. A honey with character for gourmet ranges.',
      es: 'Intensa y ligeramente amarga, con aroma a caramelo y cuerpo denso. Una miel con carácter para gamas gourmet.',
    },
    uses: { en: 'Gourmet ranges, cheese pairings and baking.', es: 'Gamas gourmet, maridaje con quesos y panadería.' },
  },
  {
    slug: 'chestnut', es: 'Castaño', n: { en: 'Chestnut Honey', es: 'Miel de Castaño' }, color: '#4a1e08', pfund: 122, format: 'drip', lid: 'gold',
    origin: { en: 'Asturias and Galicia', es: 'Asturias y Galicia' },
    season: { en: 'Summer', es: 'Verano' },
    desc: {
      en: 'Strong, woody and bitter-sweet, and slow to crystallise. Dark honeys like this one are growing fast in European retail.',
      es: 'Intensa, leñosa y agridulce, y lenta en cristalizar. Las mieles oscuras como esta crecen rápido en el lineal europeo.',
    },
    uses: { en: 'Gourmet, sauces, cured meats and craft beer.', es: 'Gourmet, salsas, embutidos y cerveza artesana.' },
  },
  {
    slug: 'forest', es: 'Bosque', n: { en: 'Forest Honey', es: 'Miel de Bosque' }, color: '#2c1105', pfund: 140, format: 'smooth', lid: 'black',
    origin: { en: 'Extremadura and Salamanca', es: 'Extremadura y Salamanca' },
    season: { en: 'Summer and autumn', es: 'Verano y otoño' },
    desc: {
      en: 'A honeydew honey from oak and holm-oak forests: very dark, malty and mineral, less sweet than flower honeys, with a long finish.',
      es: 'Una miel de mielada de robles y encinas: muy oscura, maltosa y mineral, menos dulce que las mieles de flor y con un final largo.',
    },
    uses: { en: 'Gourmet, bakery and sports nutrition.', es: 'Gourmet, panadería y nutrición deportiva.' },
  },
]

export const formats = [
  { key: 'drip', kind: 'retail', n: { en: 'Anti-drip bottle', es: 'Envase antigoteo' }, sizes: '350 g – 500 g' },
  { key: 'smooth', kind: 'retail', n: { en: 'Smooth jar', es: 'Tarro liso' }, sizes: '300 g – 450 g' },
  { key: 'comb', kind: 'retail', n: { en: 'Honeycomb jar', es: 'Tarro celdillas' }, sizes: '500 g – 1 kg' },
  { key: 'pail', kind: 'industry', n: { en: 'Plastic pail', es: 'Cubo de plástico' }, sizes: '15 kg – 20 kg' },
  { key: 'drum', kind: 'industry', n: { en: 'Metal drum', es: 'Bidón metálico' }, sizes: '290 kg' },
  { key: 'ibc', kind: 'industry', n: { en: 'IBC tote', es: 'Contenedor IBC' }, sizes: '1,000 kg – 1,400 kg' },
]
export const formatOf = key => formats.find(f => f.key === key)
export const varietyOf = slug => varieties.find(v => v.slug === slug)

// What travels down the packing line in the home hero: every honey in its retail pack, then bulk.
export const line = [
  ...varieties.map(v => ({ v: v.slug, f: v.format })),
  { v: 'multifloral', f: 'pail' },
  { v: 'orange-blossom', f: 'drum' },
  { v: 'eucalyptus', f: 'ibc' },
]

export const facts = [
  { n: '1941', l: { en: 'Trading honey since', es: 'Comercializando miel desde' } },
  { n: '35+', l: { en: 'Countries supplied', es: 'Países a los que servimos' } },
  { n: '5,000 m²', l: { en: 'Automated facilities', es: 'De instalaciones automatizadas' } },
  { n: '6,000', l: { en: 'Units packed per hour', es: 'Unidades envasadas por hora' } },
  { n: '1,000 t', l: { en: 'Warehouse capacity', es: 'Capacidad de almacén' } },
]

export const steps = [
  { t: { en: 'Sourced', es: 'Seleccionada' }, p: { en: 'Flower honeys bought from trusted beekeepers and cooperatives, in Spain and abroad.', es: 'Mieles de flor compradas a apicultores y cooperativas de confianza, en España y fuera.' }, img: beekeeper },
  { t: { en: 'Analysed', es: 'Analizada' }, p: { en: 'Physicochemical, authenticity, microbiology, residue and pollen tests in our own laboratory.', es: 'Análisis fisicoquímicos, de autenticidad, microbiológicos, de residuos y polínicos en nuestro propio laboratorio.' }, img: labScientist },
  { t: { en: 'Packed', es: 'Envasada' }, p: { en: 'Fully automated lines fill, cap and label your format at up to 6,000 units an hour, under your brand or ours.', es: 'Líneas totalmente automatizadas llenan, cierran y etiquetan tu formato a hasta 6.000 unidades por hora, con tu marca o la nuestra.' }, img: filler },
  { t: { en: 'Shipped', es: 'Expedida' }, p: { en: 'Palletised, stored in a 1,000-tonne warehouse and dispatched to buyers in more than 35 countries.', es: 'Paletizada, almacenada en un almacén de 1.000 toneladas y enviada a clientes de más de 35 países.' }, img: pallet },
]

export const tests = [
  { en: 'Physicochemical analysis', es: 'Análisis fisicoquímico' },
  { en: 'Authenticity tests', es: 'Pruebas de autenticidad' },
  { en: 'Microbiology', es: 'Microbiología' },
  { en: 'Antibiotic residues', es: 'Residuos de antibióticos' },
  { en: 'Palynology (floral origin)', es: 'Palinología (origen floral)' },
]

export const posts = [
  { date: '2026-05-22', t: { en: 'Improving production and quality through technology', es: 'Mejora de la producción y calidad mediante innovación tecnológica' }, p: { en: 'An update on our project to raise output and quality in the beekeeping sector with new technology.', es: 'Novedades de nuestro proyecto para mejorar la producción y la calidad del sector apícola con innovación tecnológica.' } },
  { date: '2026-01-05', t: { en: 'Flu season 2026: secure your eucalyptus and propolis stock', es: 'Campaña de gripe 2026: asegura tu stock de miel de eucalipto y propóleo' }, p: { en: 'The flu peak drives honey demand. Bulk and packed supply for retail and pharma.', es: 'El pico de gripe dispara la demanda de miel. Suministro a granel y envasado para retail y farmacia.' } },
  { date: '2025-12-30', t: { en: 'Market report 2026: four trends shaping honey', es: 'Informe de mercado 2026: las 4 tendencias que definen la miel' }, p: { en: 'Radical transparency, darker honeys and sustainability, and how to adapt your range.', es: 'Transparencia radical, mieles oscuras y sostenibilidad, y cómo adaptar tu catálogo.' } },
]

export const gallery = [lineFilled, lab, warehouse, capper, tanks, lineOperator]
export const contact = {
  address: 'Calle Ferrers, 13, 46600 Alzira, Valencia, Spain',
  addressEs: 'Calle Ferrers, 13, 46600 Alzira, Valencia, España',
  phone: '+34 962 455 171',
  email: 'info@reinaapicola.com',
}
export { building, teamLine, teamWarehouse, teamOffice, lineEmpty, dipper }
