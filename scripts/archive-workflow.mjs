import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const DEFAULT_NEW_TAG_TYPES = ["uncategorized"];
const INLINE_TAG_PATTERN = /\[\[([^|\]]+)(?:\|[^\]]+)?\]\]/g;

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

function uniqueList(items) {
  return [...new Set(items.filter(Boolean))];
}

function optionEnabled(value) {
  return (
    value === true ||
    value === "" ||
    String(value).toLowerCase() === "true" ||
    String(value).toLowerCase() === "yes" ||
    String(value) === "1"
  );
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

function normalizeSearchText(value) {
  return String(value)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/['’]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .toLowerCase()
    .trim();
}

function tagSearchTerms(tagId, tag) {
  return uniqueList([
    tagId,
    tag?.label,
    ...(Array.isArray(tag?.aliases) ? tag.aliases : []),
  ]);
}

function findNormalizedTermIndex(normalizedSource, term) {
  const normalizedTerm = normalizeSearchText(term);
  if (!normalizedTerm) {
    return -1;
  }

  return ` ${normalizedSource} `.indexOf(` ${normalizedTerm} `);
}

function findInlineTagIds(source) {
  return [...String(source ?? "").matchAll(INLINE_TAG_PATTERN)].map((match) => ({
    tagId: match[1].trim(),
    index: match.index,
  }));
}

function formatTagEntry(tagId) {
  return `  ${quoteObjectKey(tagId)}: { id: "${escapeJsString(
    tagId,
  )}", label: "${escapeJsString(tagLabel(tagId))}", types: ${JSON.stringify(
    DEFAULT_NEW_TAG_TYPES,
  )} },`;
}

export async function readTagRegistry(root) {
  const tagsPath = path.join(root, "src", "tags.js");
  const tagsUrl = `${pathToFileURL(tagsPath).href}?cache=${Date.now()}-${Math.random()}`;
  const tagModule = await import(tagsUrl);

  return {
    tags: tagModule.tags ?? {},
    tagTypes: tagModule.tagTypes ?? {},
  };
}

export function inferTagIdsFromText(source, tags) {
  const normalizedSource = normalizeSearchText(source);
  const matches = new Map();

  for (const inlineTag of findInlineTagIds(source)) {
    matches.set(inlineTag.tagId, {
      tagId: inlineTag.tagId,
      index: inlineTag.index,
    });
  }

  Object.entries(tags).forEach(([tagId, tag], order) => {
    const termIndex = tagSearchTerms(tagId, tag).reduce((lowestIndex, term) => {
      const nextIndex = findNormalizedTermIndex(normalizedSource, term);
      if (nextIndex === -1) {
        return lowestIndex;
      }

      return lowestIndex === -1 ? nextIndex : Math.min(lowestIndex, nextIndex);
    }, -1);

    if (termIndex === -1) {
      return;
    }

    const existing = matches.get(tagId);
    if (!existing || termIndex < existing.index) {
      matches.set(tagId, { tagId, index: termIndex, order });
    }
  });

  return [...matches.values()]
    .sort((left, right) => {
      if (left.index !== right.index) {
        return left.index - right.index;
      }

      return (left.order ?? 0) - (right.order ?? 0);
    })
    .map((match) => match.tagId);
}

export function linkTextWithTags(source, tagIds, tags) {
  if (!source || source.includes("[[")) {
    return source ?? "";
  }

  let nextSource = source;
  const linkedTags = new Set();
  const candidates = tagIds
    .flatMap((tagId) => {
      const tag = tags[tagId];
      if (!tag) {
        return [];
      }

      return tagSearchTerms(tagId, tag).map((term) => ({
        tagId,
        term,
        normalizedLength: normalizeSearchText(term).length,
      }));
    })
    .filter((candidate) => candidate.normalizedLength > 1)
    .sort((left, right) => right.normalizedLength - left.normalizedLength);

  for (const candidate of candidates) {
    if (linkedTags.has(candidate.tagId)) {
      continue;
    }

    const termPattern = escapeRegExp(candidate.term).replace(/\s+/g, "\\s+");
    const pattern = new RegExp(
      `(^|[^A-Za-z0-9])(${termPattern})(?=$|[^A-Za-z0-9])`,
      "i",
    );
    let linked = false;

    nextSource = nextSource.replace(pattern, (match, prefix, phrase) => {
      linked = true;
      return `${prefix}[[${candidate.tagId}|${phrase}]]`;
    });

    if (linked) {
      linkedTags.add(candidate.tagId);
    }
  }

  return nextSource;
}

export function shouldInferTags(options) {
  return !options.tags || optionEnabled(options["auto-tags"]);
}

export function shouldAutoLinkText(options) {
  return optionEnabled(options["auto-link-text"]);
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
      !new RegExp(`id:\\s*["']${escapeRegExp(tagId)}["']`).test(
        tagsObjectMatch[0],
      ),
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
