export const videoAspectRatios = [
  { value: "16:9 (Widescreen)", label: "16:9 · LANDSCAPE" },
  { value: "9:16 (Portrait Widescreen)", label: "9:16 · VERTICAL" },
  { value: "1:1 (Square)", label: "1:1 · SQUARE" },
] as const;

export type VideoAspectRatio = typeof videoAspectRatios[number]["value"];

export const defaultVideoAspectRatio: VideoAspectRatio = "16:9 (Widescreen)";
export const commercialDurationSeconds = 6 as const;

export function isVideoAspectRatio(value: unknown): value is VideoAspectRatio {
  return videoAspectRatios.some((ratio) => ratio.value === value);
}
