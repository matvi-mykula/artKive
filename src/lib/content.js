import fs from "node:fs";
import path from "node:path";
import { parseTaggedText } from "./richText.js";

const IMAGE_PATTERN = /\.(?:png|jpe?g|svg|webp|heic)$/i;
const IMAGES_ROOT = path.join(process.cwd(), "public", "images");

function toPublicPath(assetPath, fileName) {
  return `/images/${assetPath.split(path.sep).join("/")}/${fileName}`;
}

function compareImageNames(left, right) {
  return left.localeCompare(right, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function readText(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8").trim() : "";
}

function findManifestPaths(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return findManifestPaths(entryPath);
    }

    return entry.name === "work.json" ? [entryPath] : [];
  });
}

function createWork(manifestPath) {
  const directory = path.dirname(manifestPath);
  const assetPath = path.relative(IMAGES_ROOT, directory).split(path.sep).join("/");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const coverFileName = manifest.cover ?? "cover.jpg";
  const imageFileNames = fs
    .readdirSync(directory)
    .filter((fileName) => IMAGE_PATTERN.test(fileName))
    .sort(compareImageNames);
  const orderedImageNames = [
    coverFileName,
    ...imageFileNames.filter((fileName) => fileName !== coverFileName),
  ].filter((fileName, index, names) => names.indexOf(fileName) === index);
  const blurbFileName = manifest.blurb === null ? null : manifest.blurb ?? "blurb.txt";
  const descriptionFileName =
    manifest.description === null ? null : manifest.description ?? "description.txt";
  const blurb = blurbFileName ? readText(path.join(directory, blurbFileName)) : "";
  const description = descriptionFileName
    ? readText(path.join(directory, descriptionFileName))
    : "";

  return {
    slug: manifest.slug,
    title: manifest.title,
    year: manifest.year,
    order: manifest.order ?? null,
    tags: manifest.tags ?? [],
    dimension: manifest.dimension ?? null,
    assetPath,
    blurb,
    blurbSegments: parseTaggedText(blurb),
    description,
    descriptionSegments: parseTaggedText(description),
    coverImage: toPublicPath(assetPath, coverFileName),
    coverPosition: manifest.coverPosition ?? "center center",
    images: orderedImageNames.map((fileName) => ({
      fileName,
      url: toPublicPath(assetPath, fileName),
    })),
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

export function taggedTextToPlainText(source) {
  return String(source ?? "")
    .replace(/\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g, (_match, tagId, label) =>
      (label ?? tagId).trim(),
    )
    .replace(/\s+/g, " ")
    .trim();
}

export function summarizeText(source, maximumLength = 155) {
  const plainText = taggedTextToPlainText(source);
  if (plainText.length <= maximumLength) {
    return plainText;
  }

  return `${plainText.slice(0, maximumLength - 1).replace(/\s+\S*$/, "")}…`;
}

export const works = findManifestPaths(IMAGES_ROOT)
  .map(createWork)
  .sort(compareWorks);

export function getWorksForTag(tagId) {
  return works.filter((work) => work.tags.includes(tagId));
}
