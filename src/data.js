function imagePath(slug, fileName) {
  return `/images/${slug}/${fileName}`;
}

function createWork({
  slug,
  title,
  year,
  tags,
  description,
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
    description,
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
    description: '',
    cover: 'cover.jpg',
    images: ['cover.jpg', '01.jpg', '02.jpg', '03.jpg', '04.jpg'],
  }),
  createWork({
    slug: 'shell-lamp',
    title: 'ShellLamp',
    year: '2026',
    tags: ['shell', 'lamp', 'sculpture'],
    description: '',
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
    description: '',
    cover: 'cover.png',
    images: ['cover.png'],
  }),
];
