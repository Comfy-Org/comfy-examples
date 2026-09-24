const acceptedTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const maxBytes = 10 * 1024 * 1024;

export class InvalidRequest extends Error {}

export function validateCharacterImage(value: unknown, label: string): asserts value is File {
  if (!(value instanceof File) || value.size === 0) throw new InvalidRequest(`Choose a ${label} image.`);
  if (!acceptedTypes.has(value.type)) throw new InvalidRequest(`${label} must be a PNG, JPEG, or WebP image.`);
  if (value.size > maxBytes) throw new InvalidRequest(`Keep each ${label} image below 10 MB.`);
}

export function validateTheme(value: unknown): asserts value is string {
  if (typeof value !== "string" || value.trim().length < 3) throw new InvalidRequest("Describe the opening theme in at least 3 characters.");
  if (value.length > 500) throw new InvalidRequest("Keep the theme under 500 characters.");
}

export function validateFrameIndexes(value: unknown): asserts value is number[] {
  if (!Array.isArray(value) || value.length < 2 || value.length > 4 || value.some((index) => !Number.isInteger(index) || index < 0 || index > 7) || new Set(value).size !== value.length) {
    throw new InvalidRequest("Choose 2 to 4 different storyboard frames.");
  }
}
