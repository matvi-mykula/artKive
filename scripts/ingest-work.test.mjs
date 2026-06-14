import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import sharp from "sharp";
import { ingestWork } from "./ingest-work.mjs";

async function createFixtureRoot() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "artkive-ingest-"));
  await fs.mkdir(path.join(root, "src"), { recursive: true });
  await fs.mkdir(path.join(root, "public", "images"), { recursive: true });

  await fs.writeFile(
    path.join(root, "src", "tags.js"),
    `export const tagTypes = {
  material: { id: "material", label: "Material", order: 10 },
  form: { id: "form", label: "Form", order: 20 },
  uncategorized: { id: "uncategorized", label: "Uncategorized", order: 999 },
};

export const tags = {
  lamp: { id: "lamp", label: "lamp", types: ["form"] },
  wood: { id: "wood", label: "wood", types: ["material"] },
};`,
  );

  await sharp({
    create: {
      width: 2,
      height: 2,
      channels: 3,
      background: "#ffffff",
    },
  })
    .jpeg()
    .toFile(path.join(root, "source.jpg"));

  return root;
}

test("ingestWork infers tags and links plain copy", async () => {
  const root = await createFixtureRoot();

  await ingestWork(root, {
    slug: "wood-lamp",
    title: "WoodLamp",
    year: "2026",
    images: "source.jpg",
    blurb: "A wood lamp.",
    description: "A small wood lamp.",
    "auto-link-text": true,
  });

  const workDirectory = path.join(root, "public", "images", "wood-lamp");
  const manifest = JSON.parse(
    await fs.readFile(path.join(workDirectory, "work.json"), "utf8"),
  );
  const blurb = await fs.readFile(path.join(workDirectory, "blurb.txt"), "utf8");
  const description = await fs.readFile(
    path.join(workDirectory, "description.txt"),
    "utf8",
  );

  assert.deepEqual(manifest.tags, ["wood", "lamp"]);
  assert.equal(blurb, "A [[wood|wood]] [[lamp|lamp]].");
  assert.equal(description, "A small [[wood|wood]] [[lamp|lamp]].");
});
