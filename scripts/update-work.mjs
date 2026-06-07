import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  ensureTagsSource,
  parseArgs,
  readProjectFiles,
  requireArgs,
  splitList,
  updateWorkEntry,
  writeProjectFiles,
} from "./archive-workflow.mjs";
import { parseWorks, validateArchive } from "./validate-archive.mjs";

async function findWork(root, slug) {
  const dataSource = await fs.readFile(path.join(root, "src", "data.js"), "utf8");
  return parseWorks(dataSource).find((work) => work.slug === slug) ?? null;
}

export async function updateWork(root, options) {
  requireArgs(options, ["slug"]);

  const projectFiles = await readProjectFiles(root);
  const tags = options.tags ? splitList(options.tags) : null;
  const updates = {
    title: options.title,
    year: options.year,
    dimension: options.dimension,
    cover: options.cover,
    coverPosition: options["cover-position"],
    assetPath: options["asset-path"],
    tags,
  };

  projectFiles.dataSource = updateWorkEntry(
    projectFiles.dataSource,
    options.slug,
    updates,
  );
  if (tags) {
    projectFiles.tagsSource = ensureTagsSource(projectFiles.tagsSource, tags);
  }

  await writeProjectFiles(projectFiles);

  const work = await findWork(root, options.slug);
  if (!work) {
    throw new Error(`Work "${options.slug}" does not exist.`);
  }

  const workDirectory = path.join(
    root,
    "public",
    "images",
    ...work.assetPath.split("/"),
  );

  if (options.blurb !== undefined) {
    await fs.writeFile(path.join(workDirectory, work.blurb ?? "blurb.txt"), options.blurb);
  }

  if (options.description !== undefined) {
    await fs.writeFile(
      path.join(workDirectory, work.description ?? "description.txt"),
      options.description,
    );
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
