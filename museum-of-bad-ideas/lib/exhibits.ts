export const exhibits = [
  {
    id: "luxury-poster",
    name: "Luxury poster",
    medium: "Archival pigment print, unreasonable confidence",
    era: "Contemporary, allegedly",
    note: "A daring study in line, ambition, and the cost of framing.",
    description: "Gallery-grade polish. Gallery-grade price tag.",
    icon: "✳",
    tone: "rose",
    prompt: "Reimagine this intentionally crude doodle as a sophisticated luxury art poster: exquisite editorial art direction, elegant dramatic lighting, tactile archival print texture, a restrained premium palette, impeccable composition. Preserve the doodle's main subject, silhouette, pose, and distinctive awkward proportions. No text, letters, logos, borders, or layout panels.",
  },
  {
    id: "storybook",
    name: "Children's book",
    medium: "Gouache, paper, several questionable decisions",
    era: "A very long bedtime ago",
    note: "The creature is friendly. The illustrator has been assured.",
    description: "A page from a story no one remembers writing.",
    icon: "☼",
    tone: "yellow",
    prompt: "Reimagine this intentionally crude doodle as a charming illustration from a beloved children's picture book: hand-painted gouache, soft paper grain, gentle storybook lighting, playful expressive shapes, warm color, whimsical but clear composition. Keep the doodle's subject, silhouette, pose, and awkward proportions recognizable. No text, letters, logos, frames, or panels.",
  },
  {
    id: "artifact",
    name: "Ancient artifact",
    medium: "Weathered stone, ochre, disputed provenance",
    era: "Before anyone kept receipts",
    note: "Scholars disagree on whether it depicts a beast or a chair.",
    description: "Recently excavated from beneath the gift shop.",
    icon: "⌘",
    tone: "stone",
    prompt: "Transform this intentionally crude doodle into a beautifully crafted, free-standing three-dimensional ancient stone creature idol. Turn the doodle's uneven outline into a complete sculpted body with rounded volume, short awkward legs, and the same unmistakable lumpy silhouette; show the whole small figurine standing on a weathered plinth. Carved sandstone, traces of ochre and mineral pigment, chipped age-worn surface, dramatic museum conservation lighting. This must be a volumetric sculpture, not a flat drawing, tablet, engraving, or image painted on stone. No text, runes, lettering, logos, labels, or panels.",
  },
  {
    id: "game-boss",
    name: "Video-game boss",
    medium: "Digital paint, boss health bar not included",
    era: "The final level, somehow",
    note: "Its attack pattern remains under peer review.",
    description: "A formidable presence with an unclear hitbox.",
    icon: "⚔",
    tone: "blue",
    prompt: "Reimagine this intentionally crude doodle as an imposing video-game boss character in polished fantasy concept art: dramatic cinematic rim lighting, richly detailed materials, powerful atmosphere, dynamic but readable pose. Preserve the doodle's main subject, silhouette, pose, and oddly specific proportions so the original remains recognizable. Single character, no UI, health bars, words, logos, borders, or panels.",
  },
  {
    id: "fashion",
    name: "Fashion editorial",
    medium: "Haute couture, doubtful measurements",
    era: "Next season, according to the label",
    note: "The silhouette is described as 'deliberately challenging.'",
    description: "An avant-garde look with no known return policy.",
    icon: "◇",
    tone: "violet",
    prompt: "Reimagine this intentionally crude doodle as a high-fashion editorial photograph: avant-garde couture styling inspired by the doodle's silhouette, bold art direction, sculptural lighting, tactile fabric, confident editorial composition, luxury magazine quality. Keep the doodle's subject and unusual proportions recognizable as the central figure. No text, letters, logos, watermarks, borders, or panels.",
  },
  {
    id: "cinematic",
    name: "Concept frame",
    medium: "35mm still, plot details withheld",
    era: "A film that may never be made",
    note: "The director calls this moment 'essential.'",
    description: "One frame from a very serious imaginary film.",
    icon: "◉",
    tone: "green",
    prompt: "Reimagine this intentionally crude doodle as a cinematic concept-art frame from an ambitious feature film: atmospheric production design, dramatic natural light, painterly realism, rich filmic color grading, strong foreground and background depth, compelling cinematic composition. Preserve the doodle's main subject, recognizable silhouette, pose, and quirky proportions. No words, titles, subtitles, logos, borders, or panels.",
  },
] as const;

export type ExhibitId = (typeof exhibits)[number]["id"];

export function getExhibit(id: string) {
  return exhibits.find((exhibit) => exhibit.id === id);
}
