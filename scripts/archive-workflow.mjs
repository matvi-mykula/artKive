import fs from "node:fs/promises";
import path from "node:path";

export const DEFAULT_NEW_TAG_TYPES = ["uncategorized"];

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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeJsString(value) {
  return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

function quoteObjectKey(key) {
  return /^[a-zA-Z_$][\w$]*$/.test(key)
    ? key
    : `"${escapeJsString(key)}"`;
}

function tagLabel(tagId) {
  return tagId.replaceAll("-", " ");
}

function formatTagEntry(tagId) {
  return `  ${quoteObjectKey(tagId)}: { id: "${escapeJsString(
    tagId,
  )}", label: "${escapeJsString(tagLabel(tagId))}", types: ${JSON.stringify(
    DEFAULT_NEW_TAG_TYPES,
  )} },`;
}

export function ensureTagsSource(tagsSource, tagIds) {
  const tagsObjectMatch = tagsSource.match(
    /export const tags = \{[\s\S]*?\n\};/,
  );

  if (!tagsObjectMatch) {
    throw new Error("Could not find exported tags object.");
  }

  const missingTags = tagIds.filter(
    (tagId) =>
      !new RegExp(`id:\\s*["']${escapeRegExp(tagId)}["']`).test(tagsSource),
  );

  if (!missingTags.length) {
    return tagsSource;
  }

  const insertText = missingTags.map((tagId) => formatTagEntry(tagId)).join("\n");
  const nextTagsObject = tagsObjectMatch[0].replace(
    /\n\};$/,
    `\n${insertText}\n};`,
  );

  return (
    tagsSource.slice(0, tagsObjectMatch.index) +
    nextTagsObject +
    tagsSource.slice(tagsObjectMatch.index + tagsObjectMatch[0].length)
  );
}

export async function readTagsFile(root) {
  const tagsPath = path.join(root, "src", "tags.js");
  const tagsSource = await fs.readFile(tagsPath, "utf8");

  return { tagsPath, tagsSource };
}

export async function writeTagsFile({ tagsPath, tagsSource }) {
  await fs.writeFile(tagsPath, tagsSource);
}

export async function writeJsonFile(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export function requireArgs(args, names) {
  const missing = names.filter((name) => !args[name]);
  if (missing.length) {
    throw new Error(`Missing required argument(s): ${missing.join(", ")}.`);
  }
}
