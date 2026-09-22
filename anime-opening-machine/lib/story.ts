export const frames = [
  { title: "Opening title", cue: "A striking anime opening title card, the protagonist's silhouette framed by the theme's world, bold readable Japanese-inspired title treatment without legible lettering." },
  { title: "A world awakens", cue: "Wide establishing shot that reveals the strange beautiful world where the protagonist lives, a visual omen on the horizon." },
  { title: "The call", cue: "The protagonist discovers the force that will change everything, wind lifting their hair and clothes as light gathers around one hand." },
  { title: "Transformation", cue: "Dynamic transformation payoff, the same protagonist in a newly empowered outfit, luminous energy ribbons and dramatic perspective." },
  { title: "Rival reveal", cue: "The rival steps from the opposing side of the conflict, a memorable silhouette and charged eye contact with the protagonist." },
  { title: "Sunset clash", cue: "The protagonist and rival face each other across a rooftop at a blazing sunset, the conflict made visible in their opposing stances." },
  { title: "The promise", cue: "Emotional extreme close-up of the protagonist looking toward the future, reflected light in their eyes and a quiet resolve." },
  { title: "Final pose", cue: "The protagonist lands in a confident final pose against the opening world's transformed skyline, visual echoes of the title card." },
] as const;

export const defaultSelectedFrameIndexes = [3, 7] as const;

export function storyboardPrompt(theme: string, index: number, hasRival: boolean) {
  const frame = frames[index];
  if (!frame) throw new Error("Choose a valid storyboard frame.");
  return [
    "Create one finished widescreen anime opening storyboard frame, not a collage or contact sheet.",
    `Story theme: ${theme}`,
    `Opening beat ${index + 1} of 8 — ${frame.title}: ${frame.cue}`,
    "The first uploaded image is the protagonist reference. Preserve the same face, hair, age, and distinctive features. Keep the protagonist recognizable in every frame. The second reference is the rival when supplied.",
    hasRival ? "Use the second reference as the rival only; do not replace the protagonist." : "No rival reference was supplied; invent a visually distinct rival only for the rival reveal and confrontation.",
    "Unified hand-drawn 2D anime key art, expressive linework, cel shading, cinematic composition, saturated opening-sequence color design. One clear moment, polished background, no panel borders, no speech bubbles, no watermark.",
  ].join("\n\n");
}

export function animationPrompt(theme: string, index: number) {
  const frame = frames[index];
  if (!frame) throw new Error("Choose a valid storyboard frame.");
  return [
    `Animate this anime opening shot from the theme: ${theme}.`,
    `Beat ${index + 1} — ${frame.title}. Preserve the exact character design, framing, and illustrated style of the input frame.`,
    "A single continuous shot, fluid restrained movement, no morphing, no extra people, no scene cuts. Add an energetic instrumental anime opening cue with no vocals, shaped to this beat and suitable for joining into a short music-video loop.",
  ].join("\n\n");
}
