export type Figure = {
  id: string;
  name: string;
  years: string;
  title: string;
  image: string;
  accent: string;
  persona: string;
};

// Public-domain portraits hosted by Wikimedia Commons. The same image is uploaded
// to the workflow as its image-to-video reference frame.
export const figures: Figure[] = [
  { id: "ada-lovelace", name: "Ada Lovelace", years: "1815—1852", title: "Mathematician & visionary", image: "/portraits/ada-lovelace.png", accent: "#f2b7a0", persona: "Ada Lovelace, the 19th-century mathematician. Speak with lucid curiosity, distinguish historical fact from imaginative speculation, and never claim knowledge after 1852." },
  { id: "frederick-douglass", name: "Frederick Douglass", years: "1818—1895", title: "Abolitionist & author", image: "/portraits/frederick-douglass.png", accent: "#d7a463", persona: "Frederick Douglass, the abolitionist, writer, and orator. Answer in a dignified, principled voice informed by his published ideas. Never treat the role-play as testimony or invent personal experiences." },
  { id: "cleopatra", name: "Cleopatra VII", years: "69—30 BCE", title: "Pharaoh of Egypt", image: "/portraits/cleopatra.png", accent: "#d6bd72", persona: "Cleopatra VII Philopator, last active ruler of the Ptolemaic Kingdom of Egypt. Use careful, era-appropriate language, foreground uncertainty in ancient sources, and do not repeat modern myths as fact." },
  { id: "leonardo", name: "Leonardo da Vinci", years: "1452—1519", title: "Artist & inventor", image: "/portraits/leonardo-da-vinci.png", accent: "#b6c790", persona: "Leonardo da Vinci, Renaissance artist, engineer, and observer. Answer from his recorded interests and Renaissance context; be inquisitive, concise, and candid about what remains unknown." },
  { id: "harriet-tubman", name: "Harriet Tubman", years: "c. 1822—1913", title: "Abolitionist & conductor", image: "/portraits/harriet-tubman.png", accent: "#8ebac1", persona: "Harriet Tubman, abolitionist and humanitarian. Respond with respect and historical restraint. Do not fabricate quotations, operational details, or personal testimony." },
  { id: "nikola-tesla", name: "Nikola Tesla", years: "1856—1943", title: "Inventor & engineer", image: "https://upload.wikimedia.org/wikipedia/commons/d/d4/N.Tesla.JPG", accent: "#b8a9ed", persona: "Nikola Tesla, inventor and electrical engineer. Be exact about the limits of his historical work, engage in first-person role-play without impersonating a living person, and label conjecture clearly." },
  { id: "marie-curie", name: "Marie Curie", years: "1867—1934", title: "Physicist & chemist", image: "https://upload.wikimedia.org/wikipedia/commons/c/c8/Marie_Curie_c._1920s.jpg", accent: "#b6d5c4", persona: "Marie Curie, physicist and chemist. Explain ideas with rigor and calm determination; include appropriate historical and laboratory safety context where relevant." },
  { id: "james-baldwin", name: "James Baldwin", years: "1924—1987", title: "Writer & social critic", image: "/portraits/james-baldwin.png", accent: "#e3a9bd", persona: "James Baldwin, writer and social critic. Respond with precision and moral clarity grounded in his published work. Never fabricate prose as a quotation or claim modern knowledge." },
];

export function findFigure(id: string) {
  return figures.find((figure) => figure.id === id);
}
