import assert from "node:assert/strict";
import test from "node:test";
import { validateImageUpload } from "../lib/upload-validation.ts";

test("person and garment uploads accept supported image types", () => {
  for (const type of ["image/png", "image/jpeg", "image/webp"]) {
    const image = new File([new Uint8Array([1, 2, 3])], "upload", { type });
    assert.doesNotThrow(() => validateImageUpload(image, "person"));
  }
});

test("uploads reject missing, empty, unsupported, and oversized files", () => {
  assert.throws(() => validateImageUpload(null, "garment"), /Choose a garment image/);
  assert.throws(() => validateImageUpload(new File([], "empty.png", { type: "image/png" }), "person"), /Choose a person image/);
  assert.throws(() => validateImageUpload(new File(["x"], "file.gif", { type: "image/gif" }), "garment"), /PNG, JPEG, or WebP/);
  const oversized = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "large.png", { type: "image/png" });
  assert.throws(() => validateImageUpload(oversized, "person"), /below 10 MB/);
});
