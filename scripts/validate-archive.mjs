import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const IMAGE_PATTERN = /\.(?:png|jpe?g|svg|webp|heic)$/i;
const INLINE_TAG_PATTERN = /\[\[([^|\]]+)(?:\|[^\]]+)?\]\]/g;
const MANIFEST_FILE = "work.json";
const ALLOWED_TAG_FIELDS = new Set([
  "id",
  "label",
  "types",
  "description",
  "aliases",
  "related",
]);

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

async function listFiles(directory) {
  try {
    return await fs.readdir(directory);
  } catch {
    return null;
  }
}

async function listDirectoryEntries(directory) {
  try {
    return await fs.readdir(directory, { withFileTypes: true });
  } catch {
    return [];
  }
}

function normalizeAssetPath(filePath) {
  return filePath.split(path.sep).join("/");
}

function findInlineTags(source) {
  return [...source.matchAll(INLINE_TAG_PATTERN)].map((match) =>
    match[1].trim(),
  );
}

function isString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isOptionalString(value) {
  return value === undefined || value === null || typeof value === "string";
}

async function walk(directory, visit) {
  for (const entry of await listDirectoryEntries(directory)) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      await walk(entryPath, visit);
      continue;
    }

    await visit(entryPath);
  }
}

export async function readWorkManifests(root = process.cwd()) {
  const imagesRoot = path.join(root, "public", "images");
  const manifests = [];

  if (!(await pathExists(imagesRoot))) {
    return manifests;
  }

  await walk(imagesRoot, async (filePath) => {
    if (path.basename(filePath) !== MANIFEST_FILE) {
      return;
    }

    const directory = path.dirname(filePath);
    const assetPath = normalizeAssetPath(path.relative(imagesRoot, directory));

    try {
      const source = await fs.readFile(filePath, "utf8");
      manifests.push({
        assetPath,
        directory,
        manifestPath: filePath,
        manifest: JSON.parse(source),
      });
    } catch (error) {
      manifests.push({
        assetPath,
        directory,
        manifestPath: filePath,
        manifest: null,
        parseError: error,
      });
    }
  });

  return manifests;
}

async function findImageFoldersWithoutManifests(root) {
  const imagesRoot = path.join(root, "public", "images");
  const missingManifestFolders = [];

  if (!(await pathExists(imagesRoot))) {
    return missingManifestFolders;
  }

  async function visitDirectory(directory) {
    const entries = await listDirectoryEntries(directory);
    const fileNames = entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name);
    const hasImages = fileNames.some((fileName) => IMAGE_PATTERN.test(fileName));
    const hasManifest = fileNames.includes(MANIFEST_FILE);

    if (hasImages && !hasManifest) {
      missingManifestFolders.push(
        normalizeAssetPath(path.relative(imagesRoot, directory)),
      );
    }

    for (const entry of entries) {
      if (entry.isDirectory()) {
        await visitDirectory(path.join(directory, entry.name));
      }
    }
  }

  await visitDirectory(imagesRoot);
  return missingManifestFolders;
}

export function parseTagIds(source) {
  const tagsObjectMatch = source.match(/export const tags = \{[\s\S]*?\n\};/);
  const tagsSource = tagsObjectMatch?.[0] ?? "";

  return [...tagsSource.matchAll(/id:\s*["']([^"']+)["']/g)].map(
    (match) => match[1],
  );
}

async function loadTagRegistry(root) {
  const tagsPath = path.join(root, "src", "tags.js");
  const tagsSource = await fs.readFile(tagsPath, "utf8");
  const tagsUrl = `${pathToFileURL(tagsPath).href}?cache=${Date.now()}-${Math.random()}`;
  const tagsModule = await import(tagsUrl);

  return {
    tagsPath,
    tagsSource,
    tags: tagsModule.tags ?? {},
    tagTypes: tagsModule.tagTypes ?? {},
  };
}

function validateTagTypes(tagTypes, findings) {
  for (const [typeId, tagType] of Object.entries(tagTypes)) {
    if (!tagType || typeof tagType !== "object") {
      findings.push(
        finding({ message: `Tag type "${typeId}" must be an object.` }),
      );
      continue;
    }

    if (tagType.id !== typeId) {
      findings.push(
        finding({ message: `Tag type "${typeId}" has mismatched id.` }),
      );
    }

    if (!isString(tagType.label)) {
      findings.push(
        finding({ message: `Tag type "${typeId}" is missing a label.` }),
      );
    }

    if (
      tagType.order !== undefined &&
      (typeof tagType.order !== "number" || !Number.isFinite(tagType.order))
    ) {
      findings.push(
        finding({ message: `Tag type "${typeId}" has invalid order.` }),
      );
    }
  }
}

function validateTags({ tagsSource, tags, tagTypes }, findings) {
  const tagIds = parseTagIds(tagsSource);
  const tagSet = new Set(Object.keys(tags));
  const typeSet = new Set(Object.keys(tagTypes));
  const tagCounts = new Map();

  for (const tagId of tagIds) {
    tagCounts.set(tagId, (tagCounts.get(tagId) ?? 0) + 1);
  }

  for (const [tagId, count] of tagCounts) {
    if (count > 1) {
      findings.push(finding({ message: `Duplicate tag id "${tagId}".` }));
    }
  }

  validateTagTypes(tagTypes, findings);

  for (const [tagId, tag] of Object.entries(tags)) {
    if (!tag || typeof tag !== "object") {
      findings.push(finding({ message: `Tag "${tagId}" must be an object.` }));
      continue;
    }

    for (const fieldName of Object.keys(tag)) {
      if (!ALLOWED_TAG_FIELDS.has(fieldName)) {
        findings.push(
          finding({
            message: `Tag "${tagId}" has unknown field "${fieldName}".`,
          }),
        );
      }
    }

    if (tag.id !== tagId) {
      findings.push(finding({ message: `Tag "${tagId}" has mismatched id.` }));
    }

    if (!isString(tag.label)) {
      findings.push(finding({ message: `Tag "${tagId}" is missing a label.` }));
    }

    if (!Array.isArray(tag.types) || !tag.types.length) {
      findings.push(finding({ message: `Tag "${tagId}" is missing types.` }));
    } else {
      for (const typeId of tag.types) {
        if (!typeSet.has(typeId)) {
          findings.push(
            finding({
              message: `Tag "${tagId}" uses unknown type "${typeId}".`,
            }),
          );
        }
      }
    }

    if (
      tag.aliases !== undefined &&
      (!Array.isArray(tag.aliases) ||
        tag.aliases.some((alias) => typeof alias !== "string"))
    ) {
      findings.push(finding({ message: `Tag "${tagId}" has invalid aliases.` }));
    }

    if (
      tag.related !== undefined &&
      (!Array.isArray(tag.related) ||
        tag.related.some((relatedTagId) => typeof relatedTagId !== "string"))
    ) {
      findings.push(finding({ message: `Tag "${tagId}" has invalid related tags.` }));
    } else if (tag.related) {
      for (const relatedTagId of tag.related) {
        if (!tagSet.has(relatedTagId)) {
          findings.push(
            finding({
              message: `Tag "${tagId}" relates to unknown tag "${relatedTagId}".`,
            }),
          );
        }
      }
    }

    if (tag.description !== undefined && typeof tag.description !== "string") {
      findings.push(
        finding({ message: `Tag "${tagId}" has invalid description.` }),
      );
    }
  }

  return tagSet;
}

function validateManifestShape(manifestEntry, findings) {
  const { manifest, assetPath } = manifestEntry;
  const workLabel = manifest?.slug ?? assetPath;

  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    findings.push(
      finding({
        work: assetPath,
        message: "Manifest must contain a JSON object.",
      }),
    );
    return false;
  }

  if (!isString(manifest.slug)) {
    findings.push(finding({ work: workLabel, message: "Missing slug." }));
  }

  if (!isString(manifest.title)) {
    findings.push(finding({ work: workLabel, message: "Missing title." }));
  }

  if (!isString(manifest.year)) {
    findings.push(finding({ work: workLabel, message: "Missing year." }));
  }

  if (
    !Array.isArray(manifest.tags) ||
    !manifest.tags.length ||
    manifest.tags.some((tagId) => !isString(tagId))
  ) {
    findings.push(finding({ work: workLabel, message: "Missing tags." }));
  }

  if (!isOptionalString(manifest.dimension)) {
    findings.push(
      finding({ work: workLabel, message: "Invalid dimension field." }),
    );
  }

  if (!isOptionalString(manifest.cover)) {
    findings.push(finding({ work: workLabel, message: "Invalid cover field." }));
  }

  if (!isOptionalString(manifest.coverPosition)) {
    findings.push(
      finding({ work: workLabel, message: "Invalid coverPosition field." }),
    );
  }

  if (!isOptionalString(manifest.blurb)) {
    findings.push(finding({ work: workLabel, message: "Invalid blurb field." }));
  }

  if (!isOptionalString(manifest.description)) {
    findings.push(
      finding({ work: workLabel, message: "Invalid description field." }),
    );
  }

  if (
    manifest.order !== undefined &&
    (typeof manifest.order !== "number" || !Number.isFinite(manifest.order))
  ) {
    findings.push(finding({ work: workLabel, message: "Invalid order field." }));
  }

  return true;
}

async function validateManifestFiles(manifestEntry, tagSet, findings) {
  const { manifest, directory } = manifestEntry;
  const workLabel = manifest.slug;
  const files = await listFiles(directory);

  if (!files) {
    findings.push(
      finding({
        work: workLabel,
        message: `Missing image folder "${manifestEntry.assetPath}".`,
      }),
    );
    return;
  }

  const imageFiles = files.filter((fileName) => IMAGE_PATTERN.test(fileName));
  if (!imageFiles.length) {
    findings.push(finding({ work: workLabel, message: "No images found." }));
  }

  const cover = manifest.cover ?? "cover.jpg";
  if (!files.includes(cover)) {
    findings.push(
      finding({
        work: workLabel,
        message: `Missing cover file "${cover}".`,
      }),
    );
  }

  const textFiles = [
    manifest.blurb === null ? null : manifest.blurb ?? "blurb.txt",
    manifest.description === null
      ? null
      : manifest.description ?? "description.txt",
  ].filter(Boolean);

  for (const textFile of textFiles) {
    const textPath = path.join(directory, textFile);
    if (!(await pathExists(textPath))) {
      findings.push(
        finding({
          work: workLabel,
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
            work: workLabel,
            message: `${textFile} uses unknown tag "${tagId}".`,
          }),
        );
      }
    }
  }
}

export async function validateArchive(root = process.cwd()) {
  const findings = [];
  const tagRegistry = await loadTagRegistry(root);
  const tagSet = validateTags(tagRegistry, findings);
  const manifestEntries = await readWorkManifests(root);
  const slugCounts = new Map();

  if (!manifestEntries.length) {
    findings.push(finding({ message: "No work manifests found." }));
  }

  for (const assetPath of await findImageFoldersWithoutManifests(root)) {
    findings.push(
      finding({
        message: `Image folder "${assetPath}" is missing work.json.`,
      }),
    );
  }

  for (const manifestEntry of manifestEntries) {
    if (manifestEntry.parseError) {
      findings.push(
        finding({
          work: manifestEntry.assetPath,
          message: `Could not parse ${MANIFEST_FILE}.`,
        }),
      );
      continue;
    }

    if (!validateManifestShape(manifestEntry, findings)) {
      continue;
    }

    const slug = manifestEntry.manifest.slug;
    if (slug) {
      slugCounts.set(slug, (slugCounts.get(slug) ?? 0) + 1);
    }
  }

  for (const [slug, count] of slugCounts) {
    if (count > 1) {
      findings.push(finding({ message: `Duplicate work slug "${slug}".` }));
    }
  }

  for (const manifestEntry of manifestEntries) {
    const { manifest } = manifestEntry;
    if (!manifest || !manifest.slug) {
      continue;
    }

    for (const tagId of manifest.tags ?? []) {
      if (!tagSet.has(tagId)) {
        findings.push(
          finding({
            work: manifest.slug,
            message: `Metadata uses unknown tag "${tagId}".`,
          }),
        );
      }
    }

    await validateManifestFiles(manifestEntry, tagSet, findings);
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
