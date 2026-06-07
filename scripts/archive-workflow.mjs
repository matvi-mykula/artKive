import fs from "node:fs/promises";
import path from "node:path";

export function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith("--")) {
      continue;
    }

    const [rawKey, inlineValue] = item.slice(2).split("=", 2);
    const key = rawKey.trim();
    if (!key) {
      continue;
    }

    if (inlineValue !== undefined) {
      args[key] = inlineValue;
      continue;
    }

    const nextValue = argv[index + 1];
    if (!nextValue || nextValue.startsWith("--")) {
      args[key] = true;
      continue;
    }

    args[key] = nextValue;
    index += 1;
  }

  return args;
}

export function splitList(value) {
  if (!value) {
    return [];
  }

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function quoteTag(tagId) {
  return /^[a-zA-Z_$][\w$]*$/.test(tagId) ? tagId : `'${tagId}'`;
}

function tagLabel(tagId) {
  return tagId.replaceAll("-", " ");
}

export function ensureTagsSource(tagsSource, tagIds) {
  const missingTags = tagIds.filter(
    (tagId) =>
      !new RegExp(`id:\\s*'${tagId.replaceAll("'", "\\'")}'`).test(tagsSource),
  );

  if (!missingTags.length) {
    return tagsSource;
  }

  const insertText = missingTags
    .map(
      (tagId) =>
        `  ${quoteTag(tagId)}: { id: '${tagId}', label: '${tagLabel(tagId)}' },`,
    )
    .join("\n");

  return tagsSource.replace(/\s*};\s*$/, `\n${insertText}\n};\n`);
}

function formatStringField(name, value) {
  return value ? `    ${name}: "${value}",\n` : "";
}

function formatTags(tags) {
  return `    tags: [${tags.map((tag) => `"${tag}"`).join(", ")}],\n`;
}

export function formatWorkEntry(work) {
  return `  createWork({
    slug: "${work.slug}",
    title: "${work.title}",
    year: "${work.year}",
${formatTags(work.tags)}${formatStringField("dimension", work.dimension)}${formatStringField("assetPath", work.assetPath && work.assetPath !== work.slug ? work.assetPath : null)}${formatStringField("cover", work.cover ?? "cover.jpg")}${formatStringField("coverPosition", work.coverPosition)}
  }),`;
}

export function insertWorkEntry(dataSource, work) {
  if (new RegExp(`slug:\\s*"${work.slug}"`).test(dataSource)) {
    throw new Error(`Work "${work.slug}" already exists.`);
  }

  return dataSource.replace(
    /export const works = \[\s*/,
    `export const works = [\n${formatWorkEntry(work)}\n`,
  );
}

function findWorkEntry(source, slug) {
  const pattern = /  createWork\(\{[\s\S]*?\n  \}\),/g;
  let match;

  while ((match = pattern.exec(source)) !== null) {
    if (new RegExp(`slug:\\s*"${slug}"`).test(match[0])) {
      return match;
    }
  }

  return null;
}

function readStringField(source, fieldName, fallback = null) {
  return (
    source.match(new RegExp(`${fieldName}:\\s*"([^"]+)"`))?.[1] ?? fallback
  );
}

function readTags(source) {
  return (
    source
      .match(/tags:\s*\[([^\]]*)\]/)?.[1]
      .match(/"([^"]+)"/g)
      ?.map((tag) => tag.slice(1, -1)) ?? []
  );
}

export function updateWorkEntry(dataSource, slug, updates) {
  const match = findWorkEntry(dataSource, slug);
  if (!match) {
    throw new Error(`Work "${slug}" does not exist.`);
  }

  const current = match[0];
  const nextWork = {
    slug,
    title: updates.title ?? readStringField(current, "title"),
    year: updates.year ?? readStringField(current, "year"),
    tags: updates.tags ?? readTags(current),
    dimension: updates.dimension ?? readStringField(current, "dimension"),
    assetPath: updates.assetPath ?? readStringField(current, "assetPath", slug),
    cover: updates.cover ?? readStringField(current, "cover", "cover.jpg"),
    coverPosition:
      updates.coverPosition ?? readStringField(current, "coverPosition"),
  };

  return dataSource.slice(0, match.index) +
    formatWorkEntry(nextWork) +
    dataSource.slice(match.index + current.length);
}

export async function readProjectFiles(root) {
  const dataPath = path.join(root, "src", "data.js");
  const tagsPath = path.join(root, "src", "tags.js");
  const [dataSource, tagsSource] = await Promise.all([
    fs.readFile(dataPath, "utf8"),
    fs.readFile(tagsPath, "utf8"),
  ]);

  return { dataPath, tagsPath, dataSource, tagsSource };
}

export async function writeProjectFiles({
  dataPath,
  tagsPath,
  dataSource,
  tagsSource,
}) {
  await Promise.all([
    fs.writeFile(dataPath, dataSource),
    fs.writeFile(tagsPath, tagsSource),
  ]);
}

export function requireArgs(args, names) {
  const missing = names.filter((name) => !args[name]);
  if (missing.length) {
    throw new Error(`Missing required argument(s): ${missing.join(", ")}.`);
  }
}
