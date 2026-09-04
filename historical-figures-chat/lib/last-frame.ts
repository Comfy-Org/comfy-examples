import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

function allowedOutputHosts() {
  const baseHost = new URL(process.env.COMFY_BASE_URL ?? "https://cloud.comfy.org").hostname;
  return new Set([baseHost, "cloud.comfy.org", ...(process.env.COMFY_OUTPUT_HOSTS ?? "").split(",").map((host) => host.trim()).filter(Boolean)]);
}

function isComfyOutputHost(hostname: string) {
  return hostname.endsWith(".comfy.org") || hostname.endsWith(".run.comfy.app");
}

function assertTrustedOutput(url: string) {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || (!allowedOutputHosts().has(parsed.hostname) && !isComfyOutputHost(parsed.hostname))) {
    throw new Error("The previous video is not a trusted Comfy output URL.");
  }
  return parsed;
}

function runFfmpeg(input: string, output: string) {
  const binary = process.env.FFMPEG_PATH?.trim() || "ffmpeg";
  return new Promise<void>((resolve, reject) => {
    const child = spawn(/* turbopackIgnore: true */ binary, ["-y", "-sseof", "-0.1", "-i", input, "-frames:v", "1", "-q:v", "2", output], { stdio: "ignore" });
    child.once("error", () => reject(new Error("FFmpeg is required to continue a video. Set FFMPEG_PATH on this deployment.")));
    child.once("exit", (code) => code === 0 ? resolve() : reject(new Error("Unable to extract the final frame from the previous video.")));
  });
}

export async function extractLastFrame(videoUrl: string) {
  const url = assertTrustedOutput(videoUrl);
  const response = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!response.ok) throw new Error("Unable to download the previous Comfy video.");
  const size = Number(response.headers.get("content-length") ?? 0);
  if (size > MAX_VIDEO_BYTES) throw new Error("The previous video is too large to continue.");

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > MAX_VIDEO_BYTES) throw new Error("The previous video is too large to continue.");

  const directory = await mkdtemp(join(tmpdir(), "historical-frame-"));
  const input = join(directory, "previous.mp4");
  const output = join(directory, "last-frame.png");

  try {
    await writeFile(input, bytes);
    await runFfmpeg(input, output);
    return new Uint8Array(await readFile(output));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
