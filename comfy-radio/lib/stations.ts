export const stations = [
  {
    id: "lofi-workdesk",
    name: "Lofi Workdesk",
    dialLabel: "LOFI",
    frequency: "88.1",
    frequencyUnit: "MHz",
    mood: "Soft focus, warm light",
    color: "#e9a95d",
    prompt: "Instrumental lo-fi hip-hop for a quiet work desk at golden hour, warm felt piano chords, mellow upright bass, brushed dusty drums, soft vinyl texture, gentle tape wobble, unhurried and focused, no vocals.",
    examples: ["Rain on the studio window", "Sunday morning coffee", "Last train home"],
  },
  {
    id: "late-night-synthwave",
    name: "Late Night Synthwave",
    dialLabel: "NIGHT",
    frequency: "95.7",
    frequencyUnit: "MHz",
    mood: "Neon after midnight",
    color: "#ef7860",
    prompt: "Instrumental late-night synthwave, analog arpeggiators, wide Juno-style pads, rounded electric bass, gated snare and steady electronic kick, nostalgic neon glow, cinematic but relaxed, no vocals.",
    examples: ["Rain-slick boulevard", "Arcade closing time", "Coast road at 2 AM"],
  },
  {
    id: "cinematic-score",
    name: "Cinematic Score",
    dialLabel: "SCORE",
    frequency: "101.3",
    frequencyUnit: "MHz",
    mood: "A little more possibility",
    color: "#d9bf78",
    prompt: "Instrumental intimate cinematic score, expressive piano motif, warm legato strings, restrained French horn, soft low percussion and a gradual hopeful rise, like the first light over a distant coastline, no vocals.",
    examples: ["A door left open", "The long way back", "A small victory"],
  },
  {
    id: "ambient-drift",
    name: "Ambient Drift",
    dialLabel: "DRIFT",
    frequency: "104.5",
    frequencyUnit: "MHz",
    mood: "Slow tides, open space",
    color: "#92b2a5",
    prompt: "Instrumental spacious ambient drift, slowly evolving analog synth pads, soft glassy harmonics, distant piano overtones and a gentle low drone, calm ocean-air atmosphere, minimal movement, no vocals or percussion.",
    examples: ["Fog over the harbor", "Floating through blue", "Wind in the pines"],
  },
  {
    id: "comfy-am",
    name: "Comfy AM",
    dialLabel: "COVE",
    frequency: "107.9",
    frequencyUnit: "MHz",
    mood: "Chestnut Cove, all night",
    color: "#d18750",
    prompt: "An instrumental small-town late-night radio soundtrack from fictional Chestnut Cove, mellow brushed jazz drums, upright bass, wistful electric piano, soft saxophone phrases and subtle coastal night ambience, warm and human, no vocals.",
    examples: ["The diner is still open", "Fog bell at the point", "Postcard from Chestnut Cove"],
  },
] as const;

export type Station = (typeof stations)[number];

export function getStation(id: unknown): Station | undefined {
  return typeof id === "string" ? stations.find((station) => station.id === id) : undefined;
}
