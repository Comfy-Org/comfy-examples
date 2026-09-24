export const styles = {
  "Moss arcade": "mossy forest thrift store meets underground noise show, acid green, bruised violet, tomato red, carved wood, patchwork upholstery, oddball vintage finds, playful and lived-in",
  "Space motel": "retro roadside motel on the moon, chrome and teal, ultraviolet velvet, coral neon, starburst shapes, kitschy cosmic souvenirs, cinematic but cozy",
  "Disco fruit": "juicy 1970s disco lounge, citrus yellow, hot pink, electric cobalt, mirror-finish chrome, glossy fruit sculptures, curved furniture, joyful and loud",
  "Night greenhouse": "friendly haunted greenhouse at midnight, deep botanical greens, ember orange, ink purple, oversized plants, crooked vintage frames, velvet textures, whimsical not scary",
} as const;

export const furniture = {
  sofa: "a comfortable upholstered sofa",
  plant: "a leafy potted indoor plant",
  lamp: "a warm sculptural paper lantern floor lamp",
  rug: "a soft patterned area rug",
  art: "a small colorful framed artwork",
  table: "a sculptural wood side table",
  "mushroom-stool": "a red spotted mushroom-shaped stool with a short cream stem",
  "disco-ball": "a small mirrored disco ball lamp casting tiny reflected light flecks",
  "snail-planter": "a whimsical snail-shaped ceramic planter with a leafy sprout",
} as const;

export type StyleName = keyof typeof styles;
export type FurnitureKind = keyof typeof furniture;

export type PlacedFurniture = {
  kind: FurnitureKind;
  x: number;
  y: number;
};

export function isStyleName(value: unknown): value is StyleName {
  return typeof value === "string" && Object.hasOwn(styles, value);
}

export function parseFurniture(value: unknown): PlacedFurniture[] | null {
  if (!Array.isArray(value) || value.length > 18) return null;

  const result: PlacedFurniture[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") return null;
    const candidate = item as Record<string, unknown>;
    if (typeof candidate.kind !== "string" || !Object.hasOwn(furniture, candidate.kind)) return null;
    if (typeof candidate.x !== "number" || !Number.isFinite(candidate.x) || candidate.x < 0 || candidate.x > 100) return null;
    if (typeof candidate.y !== "number" || !Number.isFinite(candidate.y) || candidate.y < 0 || candidate.y > 100) return null;
    result.push({ kind: candidate.kind as FurnitureKind, x: candidate.x, y: candidate.y });
  }

  return result;
}

function positionName(item: PlacedFurniture) {
  const horizontal = item.x < 35 ? "left side" : item.x > 65 ? "right side" : "center";
  const vertical = item.y < 35 ? "toward the back" : item.y > 70 ? "in the foreground" : "mid-room";
  return `${horizontal}, ${vertical}`;
}

export function buildRoomPrompt(styleName: StyleName, items: PlacedFurniture[]) {
  const chosenFurniture = items.length
    ? items.map((item) => `- ${furniture[item.kind]} placed on the ${positionName(item)}`).join("\n")
    : "- Keep the existing furniture and add a few cohesive finishing touches";

  return [
    `Redesign the supplied room photo as a photorealistic interior in this style: ${styles[styleName]}.`,
    "Preserve the room's architecture, windows, doors, floor plan, camera angle, and perspective. Keep the same room recognizable. Make the furnishings physically plausible and correctly scaled, with natural shadows, coherent materials, and realistic daylight.",
    "Include these specific pieces and honor their approximate positions in the room:",
    chosenFurniture,
    "Create a polished but lived-in home, not a showroom. Do not add text, labels, collages, people, or extra rooms.",
  ].join("\n\n");
}
