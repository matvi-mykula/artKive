function imagePath(basePath, fileName) {
  return `/images/${basePath}/${fileName}`;
}

function createWork({
  slug,
  title,
  year,
  tags,
  assetPath = slug,
  blurb = 'blurb.txt',
  description = 'description.txt',
  cover = 'cover.jpg',
  coverPosition = 'center center',
  images = [],
}) {
  return {
    slug,
    title,
    year,
    tags,
    blurbPath: imagePath(assetPath, blurb),
    descriptionPath: imagePath(assetPath, description),
    coverImage: imagePath(assetPath, cover),
    coverPosition,
    images: images.map((fileName) => imagePath(assetPath, fileName)),
  };
}

export const works = [
  createWork({
    slug: 'rib-rock',
    title: 'RibRock',
    year: '2026',
    tags: ['stone', 'lamp', 'sculpture'],
    cover: 'cover.jpg',
    images: ['cover.jpg', '01.jpg', '02.jpg', '03.jpg', '04.jpg'],
  }),
  createWork({
    slug: 'shell-lamp',
    title: 'ShellLamp',
    year: '2026',
    tags: ['shell', 'lamp', 'sculpture'],
    cover: 'cover.jpg',
    images: ['cover.jpg', '01.jpg', '02.jpg', '03.jpg'],
  }),
  createWork({
    slug: 'little-guys',
    title: 'LittleGuys',
    year: '2026',
    tags: ['figure', 'object', 'study'],
    cover: 'cover.png',
    images: ['cover.png'],
  }),
  createWork({
    slug: 'root-nightlight',
    title: 'RootNightlight',
    year: '2026',
    tags: ['root', 'lamp', 'sculpture', 'study'],
    assetPath: 'grown-tapestry/root-nightlight',
    cover: 'IMG_3310.JPG',
    images: ['IMG_3310.JPG', 'IMG_3311.JPG', 'IMG_3312.JPG'],
  }),
  createWork({
    slug: 'static-fabric',
    title: 'StaticFabric',
    year: '2026',
    tags: ['root', 'study', 'sculpture', 'object'],
    assetPath: 'grown-tapestry/static-fabric',
    cover: 'cover.png',
    images: ['cover.png', '01.jpg'],
  }),
];
