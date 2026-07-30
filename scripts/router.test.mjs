import assert from "node:assert/strict";
import test from "node:test";
import { parseRoute } from "../src/lib/router.js";

test("parseRoute recognizes song vignette pages", () => {
  assert.deepEqual(parseRoute("/songs/cc-call-and-response"), {
    type: "song",
    slug: "cc-call-and-response",
  });
});

test("parseRoute keeps unsupported song paths out of the song page", () => {
  assert.deepEqual(parseRoute("/songs/cc-call-and-response/details"), {
    type: "not-found",
  });
});
