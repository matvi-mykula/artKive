function imagePath(slug, fileName) {
  return `/images/${slug}/${fileName}`;
}

function text(value) {
  return { type: 'text', text: value };
}

function tag(textValue, tagId) {
  return { type: 'tag', text: textValue, tagId };
}

function createWork({
  slug,
  title,
  year,
  tags,
  cardText,
  blurb = 'blurb.txt',
  cover = 'cover.jpg',
  coverPosition = 'center center',
  coverScale = 1,
  images = [],
}) {
  return {
    slug,
    title,
    year,
    tags,
    cardText,
    blurbPath: imagePath(slug, blurb),
    coverImage: imagePath(slug, cover),
    coverPosition,
    coverScale,
    images: images.map((fileName) => imagePath(slug, fileName)),
  };
}

export const works = [
  createWork({
    slug: 'rib-rock',
    title: 'RibRock',
    year: '2026',
    tags: ['stone', 'lamp', 'sculpture'],
    cardText: [
      text('A stacked '),
      tag('stone', 'stone'),
      text(' '),
      tag('lamp', 'lamp'),
      text(' cut into luminous bands.'),
    ],
    cover: 'cover.jpg',
    images: ['cover.jpg', '01.jpg', '02.jpg', '03.jpg', '04.jpg'],
  }),
  createWork({
    slug: 'shell-lamp',
    title: 'ShellLamp',
    year: '2026',
    tags: ['shell', 'lamp', 'sculpture'],
    cardText: [
      text('A shell-built '),
      tag('lamp', 'lamp'),
      text(' arranged as a narrow glowing '),
      tag('sculpture', 'sculpture'),
      text('.'),
    ],
    cover: 'cover.jpg',
    coverPosition: 'center top',
    coverScale: 1.22,
    images: ['cover.jpg', '01.jpg', '02.jpg'],
  }),
  createWork({
    slug: 'little-guys',
    title: 'LittleGuys',
    year: '2026',
    tags: ['figure', 'object', 'study'],
    cardText: [
      text('A compact '),
      tag('figure', 'figure'),
      text(' study treated like a small found '),
      tag('object', 'object'),
      text('.'),
    ],
    cover: 'cover.png',
    images: ['cover.png'],
  }),
];
