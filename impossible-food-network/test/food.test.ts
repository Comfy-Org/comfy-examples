import assert from "node:assert/strict";
import test from "node:test";
import { findFoodPreset, foodPresets } from "../lib/food-presets.ts";
import { InvalidFoodRequest, maxImageBytes, validateFoodRequest } from "../lib/upload-validation.ts";
import { commercialDurationSeconds, defaultVideoAspectRatio, isVideoAspectRatio, videoAspectRatios } from "../lib/food-settings.ts";

test("all five food concepts provide distinct still and motion prompts", () => {
  assert.equal(foodPresets.length, 5);
  assert.equal(new Set(foodPresets.map((preset) => preset.id)).size, 5);
  assert.ok(foodPresets.every((preset) => preset.imagePrompt.length > 100 && preset.motionPrompt.length > 100));
  assert.equal(findFoodPreset("ramen-volcano")?.name, "Molten ramen volcano");
  assert.equal(findFoodPreset("unknown"), undefined);
});

test("accepts a supported food photo and preset", () => {
  const image = new File([new Uint8Array([1, 2, 3])], "ramen.webp", { type: "image/webp" });
  assert.deepEqual(validateFoodRequest(image, "ramen-volcano"), { image, preset: foodPresets[0] });
});

test("rejects missing, unsupported, oversized photos and unknown concepts", () => {
  assert.throws(() => validateFoodRequest(null, "ramen-volcano"), InvalidFoodRequest);
  assert.throws(() => validateFoodRequest(new File(["text"], "meal.txt", { type: "text/plain" }), "ramen-volcano"), InvalidFoodRequest);
  assert.throws(() => validateFoodRequest(new File([new Uint8Array(maxImageBytes + 1)], "large.png", { type: "image/png" }), "ramen-volcano"), InvalidFoodRequest);
  assert.throws(() => validateFoodRequest(new File(["ok"], "meal.png", { type: "image/png" }), "unknown"), InvalidFoodRequest);
});

test("offers supported video aspect ratios and keeps the commercial at six seconds", () => {
  assert.equal(defaultVideoAspectRatio, "16:9 (Widescreen)");
  assert.equal(commercialDurationSeconds, 6);
  assert.equal(videoAspectRatios.length, 3);
  assert.ok(videoAspectRatios.every(({ value }) => isVideoAspectRatio(value)));
  assert.equal(isVideoAspectRatio("4:3"), false);
});
