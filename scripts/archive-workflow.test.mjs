import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ensureTagsSource,
  inferTagIdsFromText,
  linkTextWithTags,
  parseArgs,
  shouldAutoLinkText,
  shouldInferTags,
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

test("ensureTagsSource ignores matching ids in tagTypes", () => {
  const source = `export const tagTypes = {
  location: { id: "location", label: "Location" },
};

export const tags = {
  lamp: { id: "lamp", label: "lamp", types: ["form"] },
};`;

  const next = ensureTagsSource(source, ["location"]);

  assert.match(
    next,
    /export const tags = \{[\s\S]*location: \{ id: "location", label: "location", types: \["uncategorized"\] \},\n\};/,
  );
});

test("inferTagIdsFromText finds existing labels, aliases, camel-case, and inline tags", () => {
  const tags = {
    lamp: { id: "lamp", label: "lamp", types: ["form"] },
    wood: { id: "wood", label: "wood", types: ["material"] },
    glow: { id: "glow", label: "glow", types: ["phenomenon"] },
    "found-material": {
      id: "found-material",
      label: "found material",
      aliases: ["found object"],
      types: ["material"],
    },
  };

  assert.deepEqual(
    inferTagIdsFromText(
      "WoodLamp study with a found object and [[glow]].",
      tags,
    ),
    ["wood", "lamp", "found-material", "glow"],
  );
});

test("linkTextWithTags links the first visible term for each tag", () => {
  const tags = {
    lamp: { id: "lamp", label: "lamp", types: ["form"] },
    wood: { id: "wood", label: "wood", types: ["material"] },
  };

  assert.equal(
    linkTextWithTags("A wood lamp with a wood base.", ["wood", "lamp"], tags),
    "A [[wood|wood]] [[lamp|lamp]] with a wood base.",
  );
});

test("linkTextWithTags leaves already linked text alone", () => {
  const tags = {
    lamp: { id: "lamp", label: "lamp", types: ["form"] },
    wood: { id: "wood", label: "wood", types: ["material"] },
  };

  assert.equal(
    linkTextWithTags("A [[lamp]] with wood.", ["lamp", "wood"], tags),
    "A [[lamp]] with wood.",
  );
});

test("auto tagging and linking options parse booleans", () => {
  assert.equal(shouldInferTags({}), true);
  assert.equal(shouldInferTags({ tags: "lamp" }), false);
  assert.equal(shouldInferTags({ tags: "lamp", "auto-tags": true }), true);
  assert.equal(shouldAutoLinkText({ "auto-link-text": "yes" }), true);
  assert.equal(shouldAutoLinkText({}), false);
});
