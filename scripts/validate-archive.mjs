import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const IMAGE_PATTERN = /\.(?:png|jpe?g|svg|webp|heic)$/i;
const INLINE_TAG_PATTERN = /\[\[([^|\]]+)(?:\|[^\]]+)?\]\]/g;

function readStringField(body, fieldName, fallback = null) {
  const match = body.match(new RegExp(`${fieldName}:\\s*"([^"]+)"`));
  return match?.[1] ?? fallback;
}

function readOptionalTextField(body, fieldName, fallback) {
  if (body.match(new RegExp(`${fieldName}:\\s*null`))) {
    return null;
  }

  return readStringField(body, fieldName, fallback);
}

function readTags(body) {
  const match = body.match(/tags:\s*\[([\s\S]*?)\]/);
  if (!match) {
    return [];
  }

  return [...match[1].matchAll(/"([^"]+)"/g)].map((tagMatch) => tagMatch[1]);
}

export function parseTagIds(source) {
  return [...source.matchAll(/id:\s*'([^']+)'/g)].map((match) => match[1]);
}

export function parseWorks(source) {
  const worksStart = source.indexOf("export const works");
  if (worksStart === -1) {
    return [];
  }

  const worksSource = source.slice(worksStart);

  return [...worksSource.matchAll(/createWork\(\{([\s\S]*?)\}\)/g)]
    .map((match) => {
      const body = match[1];
      const slug = readStringField(body, "slug");
      const assetPath = readStringField(body, "assetPath", slug);

      return {
        slug,
        title: readStringField(body, "title"),
        year: readStringField(body, "year"),
        assetPath,
        cover: readStringField(body, "cover", "cover.jpg"),
        blurb: readOptionalTextField(body, "blurb", "blurb.txt"),
        description: readOptionalTextField(
          body,
          "description",
          "description.txt",
        ),
        tags: readTags(body),
      };
    })
    .filter((work) => work.slug);
}

function finding({ level = "error", work = null, message }) {
  return { level, work, message };
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function findInlineTags(source) {
  return [...source.matchAll(INLINE_TAG_PATTERN)].map((match) =>
    match[1].trim(),
  );
}

async function listFiles(directory) {
  try {
    return await fs.readdir(directory);
  } catch {
    return null;
  }
}

function getWorkDirectory(root, work) {
  return path.join(root, "public", "images", ...work.assetPath.split("/"));
}

export async function validateArchive(root = process.cwd()) {
  const findings = [];
  const dataPath = path.join(root, "src", "data.js");
  const tagsPath = path.join(root, "src", "tags.js");

  const [dataSource, tagsSource] = await Promise.all([
    fs.readFile(dataPath, "utf8"),
    fs.readFile(tagsPath, "utf8"),
  ]);

  const works = parseWorks(dataSource);
  const tagIds = parseTagIds(tagsSource);
  const tagSet = new Set(tagIds);
  const slugCounts = new Map();
  const tagCounts = new Map();

  for (const tagId of tagIds) {
    tagCounts.set(tagId, (tagCounts.get(tagId) ?? 0) + 1);
  }

  for (const [tagId, count] of tagCounts) {
    if (count > 1) {
      findings.push(finding({ message: `Duplicate tag id "${tagId}".` }));
    }
  }

  for (const work of works) {
    slugCounts.set(work.slug, (slugCounts.get(work.slug) ?? 0) + 1);
  }

  for (const [slug, count] of slugCounts) {
    if (count > 1) {
      findings.push(finding({ message: `Duplicate work slug "${slug}".` }));
    }
  }

  for (const work of works) {
    if (!work.title) {
      findings.push(finding({ work: work.slug, message: "Missing title." }));
    }

    if (!work.year) {
      findings.push(finding({ work: work.slug, message: "Missing year." }));
    }

    if (!work.tags.length) {
      findings.push(finding({ work: work.slug, message: "Missing tags." }));
    }

    for (const tagId of work.tags) {
      if (!tagSet.has(tagId)) {
        findings.push(
          finding({
            work: work.slug,
            message: `Metadata uses unknown tag "${tagId}".`,
          }),
        );
      }
    }

    const workDirectory = getWorkDirectory(root, work);
    const files = await listFiles(workDirectory);
    if (!files) {
      findings.push(
        finding({
          work: work.slug,
          message: `Missing image folder "${work.assetPath}".`,
        }),
      );
      continue;
    }

    const imageFiles = files.filter((fileName) => IMAGE_PATTERN.test(fileName));
    if (!imageFiles.length) {
      findings.push(finding({ work: work.slug, message: "No images found." }));
    }

    if (!files.includes(work.cover)) {
      findings.push(
        finding({
          work: work.slug,
          message: `Missing cover file "${work.cover}".`,
        }),
      );
    }

    for (const textFile of [work.blurb, work.description].filter(Boolean)) {
      const textPath = path.join(workDirectory, textFile);
      if (!(await pathExists(textPath))) {
        findings.push(
          finding({
            work: work.slug,
            message: `Missing text file "${textFile}".`,
          }),
        );
        continue;
      }

      const textSource = await fs.readFile(textPath, "utf8");
      for (const tagId of findInlineTags(textSource)) {
        if (!tagSet.has(tagId)) {
          findings.push(
            finding({
              work: work.slug,
              message: `${textFile} uses unknown tag "${tagId}".`,
            }),
          );
        }
      }
    }
  }

  return findings;
}

function formatFinding(result) {
  const prefix = result.work ? `[${result.work}] ` : "";
  return `${result.level.toUpperCase()}: ${prefix}${result.message}`;
}

async function main() {
  const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
  const findings = await validateArchive(root);
  const errors = findings.filter((result) => result.level === "error");

  if (!findings.length) {
    console.log("Archive validation passed.");
    return;
  }

  for (const result of findings) {
    console.log(formatFinding(result));
  }

  if (errors.length) {
    process.exitCode = 1;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
