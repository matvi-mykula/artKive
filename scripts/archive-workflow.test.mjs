import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ensureTagsSource,
  parseArgs,
  splitList,
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

test("ensureTagsSource appends missing rich tags", () => {
  const source = `export const tagTypes = {
  uncategorized: { id: "uncategorized", label: "Uncategorized" },
};

export const tags = {
  lamp: { id: "lamp", label: "lamp", types: ["form"] },
};`;

  const next = ensureTagsSource(source, ["lamp", "wood-dowels"]);

  assert(next.includes('lamp: { id: "lamp"'));
  assert(
    next.includes(
      '"wood-dowels": { id: "wood-dowels", label: "wood dowels", types: ["uncategorized"] }',
    ),
  );
  assert.equal((next.match(/id: "lamp"/g) ?? []).length, 1);
});

test("ensureTagsSource inserts before helper exports", () => {
  const source = `export const tags = {
  lamp: { id: "lamp", label: "lamp", types: ["form"] },
};

export function getTag(tagId) {
  return tags[tagId] ?? null;
}`;

  const next = ensureTagsSource(source, ["shell"]);

  assert.match(
    next,
    /shell: \{ id: "shell", label: "shell", types: \["uncategorized"\] \},\n\};\n\nexport function getTag/,
  );
});
