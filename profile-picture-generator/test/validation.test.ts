import assert from "node:assert/strict";
import test from "node:test";
import { validatePortrait } from "../lib/validation.ts";

test("portrait validation accepts an image within the supported formats and size", () => {
  const file = new File([new Uint8Array([1, 2, 3])], "portrait.webp", { type: "image/webp" });
  assert.doesNotThrow(() => validatePortrait(file));
});

test("portrait validation rejects missing, empty, unsupported, and oversized uploads", () => {
  assert.throws(() => validatePortrait(null), /Choose a portrait/);
  assert.throws(() => validatePortrait(new File([], "empty.png", { type: "image/png" })), /Choose a portrait/);
  assert.throws(() => validatePortrait(new File(["x"], "portrait.gif", { type: "image/gif" })), /PNG, JPEG, or WebP/);
  const oversized = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "large.png", { type: "image/png" });
  assert.throws(() => validatePortrait(oversized), /under 10 MB/);
});
