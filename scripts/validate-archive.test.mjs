import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { validateArchive } from "./validate-archive.mjs";

async function createFixture({ dataSource, tagsSource, files }) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "artkive-validate-"));
  await fs.mkdir(path.join(root, "src"), { recursive: true });
  await fs.writeFile(path.join(root, "src", "data.js"), dataSource);
  await fs.writeFile(path.join(root, "src", "tags.js"), tagsSource);

  for (const [filePath, content] of Object.entries(files)) {
    const absolutePath = path.join(root, filePath);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, content);
  }

  return root;
}

const validTags = `export const tags = {
  lamp: { id: 'lamp', label: 'lamp' },
  wood: { id: 'wood', label: 'wood' },
};`;

const validData = `export const works = [
  createWork({
    slug: "night-lamp",
    title: "NightLamp",
    year: "2026",
    tags: ["lamp", "wood"],
    dimension: "10 x 10 x 10 cm",
    cover: "cover.jpg",
  }),
];`;

test("valid archive fixture passes", async () => {
  const root = await createFixture({
    dataSource: validData,
    tagsSource: validTags,
    files: {
      "public/images/night-lamp/cover.jpg": "fake image",
      "public/images/night-lamp/01.jpg": "fake image",
      "public/images/night-lamp/blurb.txt": "Small [[lamp]] with [[wood]].",
      "public/images/night-lamp/description.txt": "A longer [[lamp|lamp text]].",
    },
  });

  assert.deepEqual(await validateArchive(root), []);
});

test("missing cover and unknown tags are reported", async () => {
  const root = await createFixture({
    dataSource: `export const works = [
      createWork({
        slug: "night-lamp",
        title: "NightLamp",
        year: "2026",
        tags: ["lamp", "missing-tag"],
        cover: "cover.jpg",
      }),
    ];`,
    tagsSource: validTags,
    files: {
      "public/images/night-lamp/01.jpg": "fake image",
      "public/images/night-lamp/blurb.txt": "Small [[unknown-inline]].",
      "public/images/night-lamp/description.txt": "A longer [[lamp]].",
    },
  });

  const messages = (await validateArchive(root)).map(
    (result) => result.message,
  );

  assert(messages.includes('Metadata uses unknown tag "missing-tag".'));
  assert(messages.includes('Missing cover file "cover.jpg".'));
  assert(messages.includes('blurb.txt uses unknown tag "unknown-inline".'));
});

test("duplicate slugs are reported", async () => {
  const root = await createFixture({
    dataSource: `export const works = [
      createWork({ slug: "same", title: "One", year: "2026", tags: ["lamp"] }),
      createWork({ slug: "same", title: "Two", year: "2026", tags: ["lamp"] }),
    ];`,
    tagsSource: validTags,
    files: {
      "public/images/same/cover.jpg": "fake image",
      "public/images/same/blurb.txt": "[[lamp]]",
      "public/images/same/description.txt": "[[lamp]]",
    },
  });

  const messages = (await validateArchive(root)).map(
    (result) => result.message,
  );

  assert(messages.includes('Duplicate work slug "same".'));
});
