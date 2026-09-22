export type FoodPreset = {
  id: string;
  name: string;
  short: string;
  description: string;
  imagePrompt: string;
  motionPrompt: string;
};

export const foodPresets: FoodPreset[] = [
  {
    id: "ramen-volcano",
    name: "Molten ramen volcano",
    short: "A little heat, a lot of drama",
    description: "Chili oil becomes lava. Noodles become the main event.",
    imagePrompt: "Turn the uploaded ramen or meal into a miniature volcanic food landscape: the recognizable bowl and noodles remain the hero, a dramatic central mound releases a ribbon of glowing chili-oil lava, red-orange broth glows like molten rock, scallions and sesame read as crisp natural details. High-end macro food advertising, tactile appetizing texture, dark volcanic stone backdrop, controlled ember-like highlights, photorealistic, no typography, no logos, no people, no extra bowls.",
    motionPrompt: "A slow, elegant macro push toward the ramen volcano. The broth gives off a few gentle bubbles, a glossy ribbon of chili-oil lava flows slowly around the noodles, and a soft plume of aromatic steam rises. A few sesame seeds drift through warm ember light. Keep the same recognizable bowl and food composition throughout; appetizing luxury food commercial, smooth controlled motion, no cuts, no text, no logos, no black frames.",
  },
  {
    id: "crystal-croissant",
    name: "Crystal croissant",
    short: "Patisserie with a prism problem",
    description: "Buttery layers refract light like cut glass.",
    imagePrompt: "Transform the uploaded croissant or pastry into a surreal crystal patisserie hero while preserving its recognizable shape and flaky buttery layers. Its golden laminated ridges are translucent honey-amber crystal with tiny refracted rainbow glints; place it on a refined pale stone plinth with a few delicate crumbs. Premium macro bakery campaign, soft cream studio backdrop, crisp tactile detail, glossy but delicious, photorealistic, no typography, no logos, no people, no extra pastries.",
    motionPrompt: "A slow macro camera orbit around the crystal croissant. Warm highlights travel across the flaky translucent layers and cast tiny prismatic glints onto the pale stone; one or two buttery crumbs tumble gently. Preserve the pastry's shape and position. Refined glossy bakery commercial, graceful controlled motion, no cuts, no text, no logos, no black frames.",
  },
  {
    id: "cloud-pizza",
    name: "Cloud pizza",
    short: "A slice somewhere above dinner",
    description: "A golden slice floats through a soft sky of cream.",
    imagePrompt: "Turn the uploaded pizza or meal into a surreal cloud-pizza product photograph while preserving the recognizable dish and toppings. The pizza sits on a sculptural cloud of soft meringue-like vapor above a pale blue sky studio, cheese stretches into delicate cloud wisps, toppings stay distinct and appetizing. Sunlit premium food campaign, airy negative space, crisp golden crust, soft volumetric light, photorealistic, no typography, no logos, no people, no extra plates.",
    motionPrompt: "The camera makes a gentle upward glide toward the hero pizza as soft clouds drift below it. Wisps of steam curl from the golden crust, a ribbon of melted cheese lifts and settles slightly, and the daylight shifts across the toppings. Keep the same slice, toppings, and composition recognizable. Dreamy premium food commercial, slow floaty motion, no cuts, no text, no logos, no black frames.",
  },
  {
    id: "neon-sushi",
    name: "Neon sushi",
    short: "Tokyo after the last train",
    description: "Fresh color, lacquered light, midnight mood.",
    imagePrompt: "Transform the uploaded sushi or meal into a surreal neon-night food commercial while preserving the recognizable fish, rice, and arrangement. Glossy magenta and electric-cyan reflections trace the edges of the dish like tasteful neon signage; a midnight lacquer tabletop reflects the food, with subtle atmospheric haze and tiny droplets. Fresh, appetizing ingredients under dramatic premium studio lighting, cinematic macro detail, photorealistic, no readable text, no logos, no people, no extra pieces.",
    motionPrompt: "A smooth lateral macro camera slide past the neon sushi. Electric-cyan and magenta reflections travel softly over the lacquered surface, a thin ribbon of cool mist drifts behind the food, and tiny highlights shimmer on the fresh ingredients. Preserve the same arrangement and keep the fish and rice appetizing. Polished night-market luxury commercial, measured controlled movement, no cuts, no text, no logos, no black frames.",
  },
  {
    id: "tiny-chef-world",
    name: "Tiny chef-world",
    short: "A whole kitchen, one delicious plate",
    description: "Miniature cooks bring the finishing touches.",
    imagePrompt: "Reimagine the uploaded dish as a tiny chef-world built around the recognizable food. Keep the meal large, central, and appetizing; a few miniature chefs in simple white uniforms stand on the plate adding herbs with tiny tools, with little ladders or a miniature prep station integrated into the dish. Whimsical but photorealistic macro food advertising, warm miniature-scale lighting, rich edible textures, no text, no logos, no crowd, no distorted hands, no extra plates.",
    motionPrompt: "A gentle macro dolly toward the recognizable hero dish as a few tiny chefs carefully finish it: one places a herb leaf, another brushes a glossy sauce accent, and a wisp of steam curls upward. Keep the miniature world sparse and the food composition stable. Charming high-end commercial, shallow depth of field, smooth intentional movement, no cuts, no text, no logos, no black frames.",
  },
];

export function findFoodPreset(value: unknown): FoodPreset | undefined {
  return typeof value === "string" ? foodPresets.find((preset) => preset.id === value) : undefined;
}
