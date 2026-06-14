import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";
import {
  ensureTagsSource,
  parseArgs,
  readTagsFile,
  requireArgs,
  splitList,
  writeJsonFile,
  writeTagsFile,
} from "./archive-workflow.mjs";
import { validateArchive } from "./validate-archive.mjs";

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function optimizeImage(input, output, { max, quality }) {
  await sharp(input)
    .rotate()
    .resize({
      width: max,
      height: max,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({
      quality,
      mozjpeg: true,
      progressive: true,
    })
    .toFile(output);
}

export async function ingestWork(root, options) {
  requireArgs(options, ["slug", "title", "year", "tags", "images"]);

  const tags = splitList(options.tags);
  const images = splitList(options.images).map((imagePath) =>
    path.resolve(root, imagePath),
  );
  const coverIndex = Number(options["cover-index"] ?? 0);
  const max = Number(options.max ?? 2200);
  const quality = Number(options.quality ?? 80);
  const assetPath = options["asset-path"] ?? options.slug;
  const workDirectory = path.join(root, "public", "images", ...assetPath.split("/"));

  if (!tags.length) {
    throw new Error("At least one tag is required.");
  }

  if (!images.length) {
    throw new Error("At least one image is required.");
  }

  if (!Number.isInteger(coverIndex) || coverIndex < 0 || coverIndex >= images.length) {
    throw new Error("--cover-index must point to one of the provided images.");
  }

  if (await pathExists(workDirectory)) {
    throw new Error(`Work folder already exists: ${workDirectory}`);
  }

  await fs.mkdir(workDirectory, { recursive: true });

  const coverImage = images[coverIndex];
  await optimizeImage(coverImage, path.join(workDirectory, "cover.jpg"), {
    max,
    quality,
  });

  let imageNumber = 1;
  for (const [index, image] of images.entries()) {
    if (index === coverIndex) {
      continue;
    }

    await optimizeImage(
      image,
      path.join(workDirectory, `${String(imageNumber).padStart(2, "0")}.jpg`),
      { max, quality },
    );
    imageNumber += 1;
  }

  await fs.writeFile(path.join(workDirectory, "blurb.txt"), options.blurb ?? "");
  await fs.writeFile(
    path.join(workDirectory, "description.txt"),
    options.description ?? "",
  );

  const work = {
    slug: options.slug,
    title: options.title,
    year: options.year,
    tags,
    cover: "cover.jpg",
  };

  if (options.dimension) {
    work.dimension = options.dimension;
  }

  if (options.order !== undefined) {
    const order = Number(options.order);
    if (!Number.isFinite(order)) {
      throw new Error("--order must be a number.");
    }

    work.order = order;
  }

  if (options["cover-position"]) {
    work.coverPosition = options["cover-position"];
  }

  await writeJsonFile(path.join(workDirectory, "work.json"), work);

  const tagsFile = await readTagsFile(root);
  tagsFile.tagsSource = ensureTagsSource(tagsFile.tagsSource, tags);
  await writeTagsFile(tagsFile);

  const findings = await validateArchive(root);
  if (findings.some((result) => result.level === "error")) {
    throw new Error("Archive validation failed after ingest.");
  }

  return { slug: options.slug, workDirectory };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = args.root ? path.resolve(args.root) : process.cwd();
  const result = await ingestWork(root, args);
  console.log(`Ingested ${result.slug} at ${result.workDirectory}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
