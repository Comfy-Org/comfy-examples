const ACCEPTED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export function validateImageUpload(value: unknown, label: string): asserts value is File {
  if (!(value instanceof File) || value.size === 0) {
    throw new Error(`Choose a ${label} image.`);
  }
  if (!ACCEPTED_IMAGE_TYPES.has(value.type)) {
    throw new Error(`${label} must be a PNG, JPEG, or WebP image.`);
  }
  if (value.size > MAX_IMAGE_BYTES) {
    throw new Error(`Keep each ${label} image below 10 MB.`);
  }
}
