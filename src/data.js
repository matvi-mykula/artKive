const imageModules = import.meta.glob(
  "../public/images/**/*.{png,jpg,jpeg,JPG,JPEG,svg,webp,heic,HEIC}",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
);

function publicImagePath(modulePath) {
  return modulePath.replace("../public", "");
}

function compareImageNames(left, right) {
  const leftName = left.split("/").pop() ?? left;
  const rightName = right.split("/").pop() ?? right;

  return leftName.localeCompare(rightName, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function resolveImages(assetPath, coverFileName) {
  const folderPrefix = `../public/images/${assetPath}/`;
  const allImages = Object.entries(imageModules)
    .filter(([modulePath]) => modulePath.startsWith(folderPrefix))
    .map(([modulePath, url]) => ({
      fileName: modulePath.slice(folderPrefix.length),
      url: publicImagePath(String(url)),
    }))
    .sort((left, right) => compareImageNames(left.fileName, right.fileName));

  const coverEntry = allImages.find(
    (image) => image.fileName === coverFileName,
  );
  const remainingImages = allImages.filter(
    (image) => image.fileName !== coverFileName,
  );

  return {
    coverImage:
      coverEntry?.url ?? publicImagePath(`${folderPrefix}${coverFileName}`),
    images: [coverEntry, ...remainingImages]
      .filter(Boolean)
      .map((image) => image.url),
  };
}

function imagePath(basePath, fileName) {
  return `/images/${basePath}/${fileName}`;
}

function createWork({
  slug,
  title,
  year,
  tags,
  assetPath = slug,
  blurb = "blurb.txt",
  description = "description.txt",
  cover = "cover.jpg",
  coverPosition = "center center",
}) {
  const { coverImage, images } = resolveImages(assetPath, cover);

  return {
    slug,
    title,
    year,
    tags,
    blurbPath: blurb ? imagePath(assetPath, blurb) : null,
    descriptionPath: description ? imagePath(assetPath, description) : null,
    coverImage,
    coverPosition,
    images,
  };
}

export const works = [
  createWork({
    slug: "rib-rock",
    title: "RibRock",
    year: "2026",
    tags: ["stone", "lamp", "sculpture"],
    cover: "cover.jpg",
  }),
  createWork({
    slug: "shell-lamp",
    title: "ShellLamp",
    year: "2026",
    tags: ["shell", "lamp", "sculpture"],
    cover: "cover.jpg",
  }),
  createWork({
    slug: "little-guys",
    title: "LittleGuys",
    year: "2026",
    tags: ["figure", "coconut-fiber"],
    cover: "cover.png",
  }),
  createWork({
    slug: "root-nightlight",
    title: "RootNightlight",
    year: "2026",
    tags: ["oat-grass-roots", "lamp", "sculpture"],
    assetPath: "grown-tapestry/root-nightlight",
    cover: "IMG_3310.JPG",
  }),
  createWork({
    slug: "shell-lamp-2",
    title: "ShellLamp2",
    year: "2026",
    tags: ["shell", "lamp", "sculpture"],
    cover: "cover.jpg",
  }),
  createWork({
    slug: "static-fabric",
    title: "StaticFabric",
    year: "2026",
    tags: ["oat-grass-roots", "sculpture", "object"],
    assetPath: "grown-tapestry/static-fabric",
    cover: "cover.png",
  }),
  createWork({
    slug: "eye-seeds",
    title: "EyeSeeds",
    year: "2026",
    tags: ["painted", "seed-pod"],
    cover: "cover.JPG",
  }),
];
