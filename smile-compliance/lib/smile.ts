export const smileLevels = {
  polite: {
    label: "Barely compliant",
    description: "A small, professionally acceptable lift.",
    instruction: "Give the subject a subtle, closed-mouth smile: just enough to satisfy a routine workplace wellness check.",
  },
  enthusiastic: {
    label: "Professionally cheerful",
    description: "The quarterly review is going well.",
    instruction: "Give the subject a warm, clearly visible, natural smile with bright, upbeat energy, as if posing for the company values poster.",
  },
  mandatory: {
    label: "Aggressively delighted",
    description: "Joy levels have been escalated to management.",
    instruction: "Give the subject an exuberant, comically huge grin and unmistakably overjoyed expression, like it has just learned about mandatory fun day.",
  },
} as const;

export type SmileLevel = keyof typeof smileLevels;

export const supportedImageTypes = ["image/png", "image/jpeg", "image/webp"] as const;
export const maxImageBytes = 10 * 1024 * 1024;

export function isSmileLevel(value: unknown): value is SmileLevel {
  return typeof value === "string" && Object.hasOwn(smileLevels, value);
}

export function validateImageUpload(value: unknown): { image: File } | { error: string } {
  if (!(value instanceof File) || value.size === 0) {
    return { error: "Submit a subject for review first." };
  }
  if (!supportedImageTypes.some((type) => type === value.type)) {
    return { error: "Upload a PNG, JPEG, or WebP image." };
  }
  if (value.size > maxImageBytes) {
    return { error: "Keep uploads under 10 MB for processing." };
  }
  return { image: value };
}

export function smilePrompt(level: SmileLevel) {
  return [
    "Perform one precise, cheerful image edit.",
    smileLevels[level].instruction,
    "If the image shows a person or animal, adjust only the mouth and nearby expression while preserving identity, face shape, pose, clothing, lighting, background, and composition.",
    "If the subject is an object, give it a simple expressive smile integrated into its existing surface or design; keep the object recognizable and do not add a separate face or extra character.",
    "Do not change anything else. No text, captions, logos, watermarks, extra objects, or duplicate subjects.",
  ].join(" ");
}
