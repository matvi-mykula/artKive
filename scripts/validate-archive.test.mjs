import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { validateArchive } from "./validate-archive.mjs";

async function createFixture({ tagsSource, files }) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "artkive-validate-"));
  await fs.mkdir(path.join(root, "src"), { recursive: true });
  await fs.writeFile(path.join(root, "src", "tags.js"), tagsSource);

  for (const [filePath, content] of Object.entries(files)) {
    const absolutePath = path.join(root, filePath);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(
      absolutePath,
      typeof content === "string" ? content : JSON.stringify(content, null, 2),
    );
  }

  return root;
}

const validTags = `export const tagTypes = {
  material: { id: "material", label: "Material", order: 10 },
  form: { id: "form", label: "Form", order: 20 },
};

export const tags = {
  lamp: { id: "lamp", label: "lamp", types: ["form"] },
  wood: { id: "wood", label: "wood", types: ["material"] },
};`;

const validManifest = {
  slug: "night-lamp",
  title: "NightLamp",
  year: "2026",
  dimension: "10 x 10 x 10 cm",
  cover: "cover.jpg",
  tags: ["lamp", "wood"],
};

test("valid archive fixture passes", async () => {
  const root = await createFixture({
    tagsSource: validTags,
    files: {
      "public/images/night-lamp/work.json": validManifest,
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
    tagsSource: validTags,
    files: {
      "public/images/night-lamp/work.json": {
        slug: "night-lamp",
        title: "NightLamp",
        year: "2026",
        tags: ["lamp", "missing-tag"],
        cover: "cover.jpg",
      },
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
    tagsSource: validTags,
    files: {
      "public/images/one/work.json": {
        slug: "same",
        title: "One",
        year: "2026",
        tags: ["lamp"],
      },
      "public/images/one/cover.jpg": "fake image",
      "public/images/one/blurb.txt": "[[lamp]]",
      "public/images/one/description.txt": "[[lamp]]",
      "public/images/two/work.json": {
        slug: "same",
        title: "Two",
        year: "2026",
        tags: ["lamp"],
      },
      "public/images/two/cover.jpg": "fake image",
      "public/images/two/blurb.txt": "[[lamp]]",
      "public/images/two/description.txt": "[[lamp]]",
    },
  });

  const messages = (await validateArchive(root)).map(
    (result) => result.message,
  );

  assert(messages.includes('Duplicate work slug "same".'));
});

test("invalid tag types are reported", async () => {
  const root = await createFixture({
    tagsSource: `export const tagTypes = {
  form: { id: "form", label: "Form" },
};

export const tags = {
  lamp: { id: "lamp", label: "lamp", types: ["missing-type"] },
};`,
    files: {
      "public/images/night-lamp/work.json": {
        slug: "night-lamp",
        title: "NightLamp",
        year: "2026",
        tags: ["lamp"],
      },
      "public/images/night-lamp/cover.jpg": "fake image",
      "public/images/night-lamp/blurb.txt": "[[lamp]]",
      "public/images/night-lamp/description.txt": "[[lamp]]",
    },
  });

  const messages = (await validateArchive(root)).map(
    (result) => result.message,
  );

  assert(messages.includes('Tag "lamp" uses unknown type "missing-type".'));
});

test("unknown tag fields are reported", async () => {
  const root = await createFixture({
    tagsSource: `export const tagTypes = {
  form: { id: "form", label: "Form" },
};

export const tags = {
  lamp: { id: "lamp", label: "lamp", types: ["form"], visible: true },
};`,
    files: {
      "public/images/night-lamp/work.json": {
        slug: "night-lamp",
        title: "NightLamp",
        year: "2026",
        tags: ["lamp"],
      },
      "public/images/night-lamp/cover.jpg": "fake image",
      "public/images/night-lamp/blurb.txt": "[[lamp]]",
      "public/images/night-lamp/description.txt": "[[lamp]]",
    },
  });

  const messages = (await validateArchive(root)).map(
    (result) => result.message,
  );

  assert(messages.includes('Tag "lamp" has unknown field "visible".'));
});
