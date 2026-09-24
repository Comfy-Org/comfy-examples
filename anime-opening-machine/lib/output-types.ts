export function normalizeOutputType(output: { name: string; type: string }) {
  const type = output.type.toLowerCase();
  const name = output.name.toLowerCase();

  if (type.includes("video") || /\.(mp4|mkv|webm|mov)$/.test(name)) return "video";
  if (type.includes("audio") || /\.(mp3|wav|flac|ogg|m4a)$/.test(name)) return "audio";
  if (type.includes("image") || /\.(png|jpe?g|webp|gif)$/.test(name)) return "image";
  return output.type;
}
