import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  ensureTagsSource,
  linkTextWithTags,
  parseArgs,
  readTagRegistry,
  readTagsFile,
  requireArgs,
  shouldAutoLinkText,
  splitList,
  writeJsonFile,
  writeTagsFile,
} from "./archive-workflow.mjs";
import { readWorkManifests, validateArchive } from "./validate-archive.mjs";

async function findWorkManifest(root, slug) {
  const manifests = await readWorkManifests(root);
  return manifests.find((entry) => entry.manifest?.slug === slug) ?? null;
}

function applyStringUpdate(target, fieldName, value) {
  if (value !== undefined) {
    target[fieldName] = value;
  }
}

async function readExistingText(filePath) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      return undefined;
    }

    throw error;
  }
}

export async function updateWork(root, options) {
  requireArgs(options, ["slug"]);

  const manifestEntry = await findWorkManifest(root, options.slug);
  if (!manifestEntry) {
    throw new Error(`Work "${options.slug}" does not exist.`);
  }

  if (options["asset-path"] && options["asset-path"] !== manifestEntry.assetPath) {
    throw new Error(
      "--asset-path is derived from the work folder. Move the folder instead.",
    );
  }

  const tags = options.tags ? splitList(options.tags) : null;
  const nextManifest = { ...manifestEntry.manifest };

  applyStringUpdate(nextManifest, "title", options.title);
  applyStringUpdate(nextManifest, "year", options.year);
  applyStringUpdate(nextManifest, "dimension", options.dimension);
  applyStringUpdate(nextManifest, "cover", options.cover);
  applyStringUpdate(nextManifest, "coverPosition", options["cover-position"]);

  if (options.order !== undefined) {
    const order = Number(options.order);
    if (!Number.isFinite(order)) {
      throw new Error("--order must be a number.");
    }

    nextManifest.order = order;
  }

  if (tags) {
    nextManifest.tags = tags;
  }

  if (options.blurb !== undefined && nextManifest.blurb === null) {
    nextManifest.blurb = "blurb.txt";
  }

  if (options.description !== undefined && nextManifest.description === null) {
    nextManifest.description = "description.txt";
  }

  if (tags) {
    const tagsFile = await readTagsFile(root);
    tagsFile.tagsSource = ensureTagsSource(tagsFile.tagsSource, tags);
    await writeTagsFile(tagsFile);
  }

  const autoLinkText = shouldAutoLinkText(options);
  const tagRegistry = autoLinkText ? await readTagRegistry(root) : null;
  const effectiveTags = Array.isArray(nextManifest.tags) ? nextManifest.tags : [];

  await writeJsonFile(manifestEntry.manifestPath, nextManifest);

  const blurbPath =
    nextManifest.blurb === null
      ? null
      : path.join(manifestEntry.directory, nextManifest.blurb ?? "blurb.txt");
  const descriptionPath =
    nextManifest.description === null
      ? null
      : path.join(
          manifestEntry.directory,
          nextManifest.description ?? "description.txt",
        );

  if (blurbPath && (options.blurb !== undefined || autoLinkText)) {
    const rawBlurb =
      options.blurb ?? (await readExistingText(blurbPath));

    if (rawBlurb !== undefined) {
      const blurb = autoLinkText
        ? linkTextWithTags(rawBlurb, effectiveTags, tagRegistry.tags)
        : rawBlurb;
      await fs.writeFile(blurbPath, blurb);
    }
  }

  if (descriptionPath && (options.description !== undefined || autoLinkText)) {
    const rawDescription =
      options.description ?? (await readExistingText(descriptionPath));

    if (rawDescription !== undefined) {
      const description = autoLinkText
        ? linkTextWithTags(rawDescription, effectiveTags, tagRegistry.tags)
        : rawDescription;
      await fs.writeFile(descriptionPath, description);
    }
  }

  const findings = await validateArchive(root);
  if (findings.some((result) => result.level === "error")) {
    throw new Error("Archive validation failed after update.");
  }

  return { slug: options.slug };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = args.root ? path.resolve(args.root) : process.cwd();
  const result = await updateWork(root, args);
  console.log(`Updated ${result.slug}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
