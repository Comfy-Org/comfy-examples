import { findFoodPreset, type FoodPreset } from "./food-presets.ts";

export const maxImageBytes = 10 * 1024 * 1024;
const acceptedImageTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

export class InvalidFoodRequest extends Error {}

export function validateFoodRequest(image: unknown, presetValue: unknown): { image: File; preset: FoodPreset } {
  if (!(image instanceof File) || image.size === 0) throw new InvalidFoodRequest("Choose a meal or snack photo first.");
  if (!acceptedImageTypes.has(image.type)) throw new InvalidFoodRequest("Use a PNG, JPEG, or WebP image.");
  if (image.size > maxImageBytes) throw new InvalidFoodRequest("Keep the photo under 10 MB.");
  const preset = findFoodPreset(presetValue);
  if (!preset) throw new InvalidFoodRequest("Choose one of the surreal food concepts.");
  return { image, preset };
}
