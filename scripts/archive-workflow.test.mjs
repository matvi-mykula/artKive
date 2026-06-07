import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ensureTagsSource,
  insertWorkEntry,
  parseArgs,
  splitList,
  updateWorkEntry,
} from "./archive-workflow.mjs";

test("parseArgs supports spaced and inline values", () => {
  assert.deepEqual(parseArgs(["--slug", "light-steppe", "--year=2026"]), {
    slug: "light-steppe",
    year: "2026",
  });
});

test("splitList trims empty items", () => {
  assert.deepEqual(splitList("lamp, wood, , pyramid"), [
    "lamp",
    "wood",
    "pyramid",
  ]);
});

test("ensureTagsSource appends only missing tags", () => {
  const source = `export const tags = {
  lamp: { id: 'lamp', label: 'lamp' },
};`;

  const next = ensureTagsSource(source, ["lamp", "wood-dowels"]);

  assert(next.includes("lamp: { id: 'lamp'"));
  assert(next.includes("'wood-dowels': { id: 'wood-dowels', label: 'wood dowels' }"));
  assert.equal((next.match(/id: 'lamp'/g) ?? []).length, 1);
});

test("ensureTagsSource inserts before helper exports", () => {
  const source = `export const tags = {
  lamp: { id: 'lamp', label: 'lamp' },
};

export function getTag(tagId) {
  return tags[tagId] ?? null;
}`;

  const next = ensureTagsSource(source, ["shell"]);

  assert.match(
    next,
    /shell: \{ id: 'shell', label: 'shell' \},\n\};\n\nexport function getTag/,
  );
});

test("insertWorkEntry adds a new createWork block", () => {
  const source = `export const works = [
  createWork({
    slug: "existing",
    title: "Existing",
    year: "2026",
    tags: ["lamp"],
  }),
];`;

  const next = insertWorkEntry(source, {
    slug: "new-work",
    title: "NewWork",
    year: "2026",
    tags: ["lamp"],
    dimension: "10 x 10 x 10 cm",
    cover: "cover.jpg",
  });

  assert(next.includes('slug: "new-work"'));
  assert(next.includes('dimension: "10 x 10 x 10 cm"'));
});

test("updateWorkEntry replaces selected metadata fields", () => {
  const source = `export const works = [
  createWork({
    slug: "existing",
    title: "Existing",
    year: "2026",
    tags: ["lamp"],
    dimension: "10 x 10 x 10 cm",
    cover: "cover.jpg",
  }),
];`;

  const next = updateWorkEntry(source, "existing", {
    title: "Changed",
    tags: ["wood"],
  });

  assert(next.includes('title: "Changed"'));
  assert(next.includes('tags: ["wood"]'));
  assert(next.includes('dimension: "10 x 10 x 10 cm"'));
});
