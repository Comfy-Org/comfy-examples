import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { animationPrompt, defaultSelectedFrameIndexes, frames, storyboardPrompt } from "../lib/story.ts";
import { normalizeOutputType } from "../lib/output-types.ts";
import { validateCharacterImage, validateFrameIndexes, validateTheme } from "../lib/upload-validation.ts";

const readWorkflow = (name) => JSON.parse(readFileSync(fileURLToPath(new URL(`../workflows/${name}`, import.meta.url)), "utf8"));

test("the opening has eight ordered beats and frame prompts preserve character continuity", () => {
  assert.equal(frames.length, 8);
  assert.match(frames[0].title, /title/i);
  assert.match(frames[3].title, /transformation/i);
  assert.match(frames[4].title, /rival/i);
  assert.match(frames[5].title, /sunset/i);
  assert.match(frames[6].title, /promise/i);
  assert.match(frames[7].title, /final/i);

  const prompt = storyboardPrompt("A courier saves a falling moon", 4, true);
  assert.match(prompt, /second reference is the rival/i);
  assert.match(prompt, /preserve the same face/i);
  assert.match(prompt, /one clear moment/i);
  assert.match(animationPrompt("A courier saves a falling moon", 3), /instrumental anime opening cue/i);
});

test("the demo starts with two fast-to-preview opening beats", () => {
  assert.deepEqual(defaultSelectedFrameIndexes, [3, 7]);
  assert.ok(defaultSelectedFrameIndexes.every((index) => index >= 0 && index < frames.length));
});

test("image, theme, and selected-frame inputs enforce app limits", () => {
  const valid = new File([new Uint8Array([1, 2, 3])], "hero.png", { type: "image/png" });
  assert.doesNotThrow(() => validateCharacterImage(valid, "protagonist"));
  assert.throws(() => validateCharacterImage(null, "protagonist"), /Choose a protagonist image/);
  assert.throws(() => validateCharacterImage(new File(["x"], "bad.svg", { type: "image/svg+xml" }), "rival"), /PNG, JPEG, or WebP/);
  assert.doesNotThrow(() => validateTheme("A courier saves a falling moon"));
  assert.throws(() => validateTheme("  "), /at least 3 characters/);
  assert.throws(() => validateTheme("a".repeat(501)), /under 500 characters/);
  assert.doesNotThrow(() => validateFrameIndexes([0, 3, 5, 7]));
  assert.throws(() => validateFrameIndexes([0]), /2 to 4/);
  assert.throws(() => validateFrameIndexes([1, 1]), /different storyboard frames/);
  assert.throws(() => validateFrameIndexes([0, 1, 2, 3, 4]), /2 to 4/);
});

test("Cloud workflow graphs keep the storyboard, animation, and loop wiring connected", () => {
  const storyboard = readWorkflow("storyboard_api.json");
  assert.equal(storyboard["3"].class_type, "BatchImagesNode");
  assert.deepEqual(storyboard["3"].inputs["images.image0"], ["1", 0]);
  assert.deepEqual(storyboard["3"].inputs["images.image1"], ["2", 0]);
  assert.deepEqual(storyboard["4"].inputs.images, ["3", 0]);
  assert.deepEqual(storyboard["5"].inputs.images, ["4", 0]);

  const animation = readWorkflow("animation_api.json");
  assert.equal(animation["2"].class_type, "ByteDance2ReferenceNodeV2");
  assert.equal(animation["2"].inputs["model.generate_audio"], true);
  assert.deepEqual(animation["2"].inputs["model.reference_images.image_1"], ["1", 0]);
  assert.deepEqual(animation["3"].inputs.video, ["2", 0]);

  const assembly = readWorkflow("assemble_api.json");
  assert.equal(assembly["5"].class_type, "ConcatenateVideo");
  assert.deepEqual(Object.keys(assembly["5"].inputs).filter((key) => key.startsWith("videos.video")), [
    "videos.video0", "videos.video1", "videos.video2", "videos.video3",
  ]);
  assert.deepEqual(assembly["6"].inputs.video, ["5", 0]);
});

test("video extensions override misclassified Cloud output metadata", () => {
  assert.equal(normalizeOutputType({ name: "AnimeOpening/Shot_00001_.mp4", type: "image" }), "video");
  assert.equal(normalizeOutputType({ name: "opening.mp4", type: "video" }), "video");
  assert.equal(normalizeOutputType({ name: "Storyboard_01.png", type: "image" }), "image");
});
