const workModules = import.meta.glob("../public/images/**/work.json", {
  eager: true,
  import: "default",
});

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

function assetPathFromManifestPath(modulePath) {
  return modulePath
    .replace("../public/images/", "")
    .replace(/\/work\.json$/, "");
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

function textPath(assetPath, fileName, fallback) {
  if (fileName === null) {
    return null;
  }

  return imagePath(assetPath, fileName ?? fallback);
}

function createWork(modulePath, manifest) {
  const assetPath = assetPathFromManifestPath(modulePath);
  const cover = manifest.cover ?? "cover.jpg";
  const { coverImage, images } = resolveImages(assetPath, cover);

  return {
    slug: manifest.slug,
    title: manifest.title,
    year: manifest.year,
    order: manifest.order ?? null,
    tags: manifest.tags ?? [],
    dimension: manifest.dimension ?? null,
    assetPath,
    blurbPath: textPath(assetPath, manifest.blurb, "blurb.txt"),
    descriptionPath: textPath(
      assetPath,
      manifest.description,
      "description.txt",
    ),
    coverImage,
    coverPosition: manifest.coverPosition ?? "center center",
    images,
  };
}

function compareWorks(left, right) {
  const leftOrder =
    typeof left.order === "number" ? left.order : Number.POSITIVE_INFINITY;
  const rightOrder =
    typeof right.order === "number" ? right.order : Number.POSITIVE_INFINITY;

  if (leftOrder !== rightOrder) {
    return leftOrder - rightOrder;
  }

  return left.title.localeCompare(right.title, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

export const works = Object.entries(workModules)
  .map(([modulePath, manifest]) => createWork(modulePath, manifest))
  .sort(compareWorks);
