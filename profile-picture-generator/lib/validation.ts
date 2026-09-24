export const ACCEPTED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export function validatePortrait(value: unknown): asserts value is File {
  if (!(value instanceof File) || value.size === 0) {
    throw new Error("Choose a portrait image to get started.");
  }
  if (!ACCEPTED_IMAGE_TYPES.has(value.type)) {
    throw new Error("Use a PNG, JPEG, or WebP image.");
  }
  if (value.size > MAX_IMAGE_BYTES) {
    throw new Error("Keep your image under 10 MB.");
  }
}
