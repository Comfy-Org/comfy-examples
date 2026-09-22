export const styles = [
  {
    id: "professional",
    name: "Moon Mayor",
    note: "Official portrait, lunar term one",
    prompt: "A charming lunar mayor's portrait for a retro-futurist moon colony yearbook: crisp ivory flight suit with a tiny civic pin, a paper-cut crescent moon backdrop, warm direct studio flash, and a proud but approachable expression.",
    colors: ["#d4c6a9", "#c94a35"],
    treatment: "studio",
  },
  {
    id: "editorial",
    name: "Space Cowboy",
    note: "Wanted: one interstellar outlaw",
    prompt: "A playful space-western portrait: vintage silver cowboy hat, tiny embroidered rocket on a dark denim collar, dusty orange alien horizon, hard sunset rim light, and authentic 1970s sci-fi paperback cover print texture.",
    colors: ["#a55837", "#28344b"],
    treatment: "editorial",
  },
  {
    id: "illustrated",
    name: "Alien Diplomat",
    note: "First contact, good hair day",
    prompt: "A witty hand-screen-printed alien diplomat portrait. Keep the person's recognizable face, give them a neatly tailored teal ambassador jacket and two small friendly antennae emerging from their hair, with a one-eyed moon creature waving in the corner. Limited ink colors, imperfect halftone texture, warm cream paper.",
    colors: ["#e4d45b", "#59786b"],
    treatment: "illustrated",
  },
  {
    id: "three-d",
    name: "Saturn Disco",
    note: "Ringside, after dark",
    prompt: "A joyful late-1970s space-disco portrait with a small mirrored Saturn ring orbiting behind the person's head like a halo, a sharp metallic party collar, warm flash photography, deep navy night sky and a few hand-drawn stars. Keep the face natural and recognizable.",
    colors: ["#a8d6d3", "#4259ba"],
    treatment: "three-d",
  },
  {
    id: "graphic",
    name: "Orbital Yearbook",
    note: "Class of 2099 · picture day",
    prompt: "A deadpan black-and-white school yearbook portrait from an imagined 1980s space academy: subtle film grain, simple collared uniform, clean oval studio vignette, tiny embroidered planet patch, direct flash, and a candid human expression.",
    colors: ["#d9ded6", "#526181"],
    treatment: "graphic",
  },
] as const;

export type StyleId = (typeof styles)[number]["id"];
export type Style = (typeof styles)[number];

export function getStyle(id: unknown): Style | undefined {
  return typeof id === "string" ? styles.find((style) => style.id === id) : undefined;
}

export function promptForStyle(style: Style, variation: number) {
  return [
    "Create one square profile picture of the same person shown in the reference image.",
    "Preserve their recognizable identity, facial structure, age, skin tone, hair, and overall expression. Keep the head clearly visible and centered in a head-and-shoulders crop.",
    style.prompt,
    `Variation ${variation + 1}: make this a distinct portrait take while keeping the person and chosen style consistent.`,
    "No text, letters, logos, watermarks, extra people, or face obstruction.",
  ].join(" ");
}
