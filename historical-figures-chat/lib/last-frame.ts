import { stat, mkdtemp, open, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import type { Output } from "@comfyorg/sdk";

const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const MAX_FRAME_BYTES = 20 * 1024 * 1024;
const DOWNLOAD_TIMEOUT_MS = 60_000;
const FFMPEG_TIMEOUT_MS = 30_000;
const MAX_REDIRECTS = 3;

function allowedRedirectHosts() {
  return new Set((process.env.COMFY_OUTPUT_HOSTS ?? "").split(",").map((host) => host.trim()).filter(Boolean));
}

function redirectTarget(current: URL, location: string) {
  const target = new URL(location, current);
  const configured = allowedRedirectHosts();
  if (target.protocol !== "https:" || (target.hostname !== current.hostname && !configured.has(target.hostname))) {
    throw new Error("The previous video's download redirected to an untrusted host.");
  }
  return target;
}

async function downloadVideo(video: Output, path: string) {
  const { url } = await video.getDownloadUrl();
  let current = new URL(url);
  const initialIsLocal = current.hostname === "localhost" || current.hostname === "127.0.0.1" || current.hostname === "::1";
  if (current.protocol !== "https:" && !(initialIsLocal && current.protocol === "http:")) {
    throw new Error("The previous video's download URL is not secure.");
  }

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    const response = await fetch(current, {
      redirect: "manual",
      headers: { range: `bytes=0-${MAX_VIDEO_BYTES}` },
      signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      await response.body?.cancel();
      if (!location || redirects === MAX_REDIRECTS) throw new Error("Unable to follow the previous video's download redirect.");
      current = redirectTarget(current, location);
      continue;
    }
    if (!response.ok || !response.body) throw new Error("Unable to download the previous Comfy video.");

    const file = await open(path, "wx");
    const reader = response.body.getReader();
    let received = 0;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value.byteLength;
        if (received > MAX_VIDEO_BYTES) {
          await reader.cancel();
          throw new Error("The previous video is too large to continue.");
        }
        await file.writeFile(value);
      }
    } finally {
      await file.close();
    }
    return;
  }
}

function runFfmpeg(input: string, output: string) {
  const binary = process.env.FFMPEG_PATH?.trim() || "ffmpeg";
  return new Promise<void>((resolve, reject) => {
    const child = spawn(
      /* turbopackIgnore: true */ binary,
      ["-nostdin", "-y", "-sseof", "-0.1", "-i", input, "-frames:v", "1", "-q:v", "2", output],
      { stdio: "ignore" },
    );
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      error ? reject(error) : resolve();
    };
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      finish(new Error("Extracting the previous video's final frame timed out."));
    }, FFMPEG_TIMEOUT_MS);

    child.once("error", () => finish(new Error("FFmpeg is required to continue a video. Set FFMPEG_PATH on this deployment.")));
    child.once("exit", (code) => finish(code === 0 ? undefined : new Error("Unable to extract the final frame from the previous video.")));
  });
}

function isPng(bytes: Uint8Array) {
  return bytes.length >= 8
    && bytes[0] === 0x89
    && bytes[1] === 0x50
    && bytes[2] === 0x4e
    && bytes[3] === 0x47
    && bytes[4] === 0x0d
    && bytes[5] === 0x0a
    && bytes[6] === 0x1a
    && bytes[7] === 0x0a;
}

export async function extractLastFrame(video: Output) {
  if (video.sizeBytes > MAX_VIDEO_BYTES) throw new Error("The previous video is too large to continue.");

  const directory = await mkdtemp(join(tmpdir(), "historical-frame-"));
  const input = join(directory, "previous-video");
  const output = join(directory, "last-frame.png");

  try {
    await downloadVideo(video, input);

    await runFfmpeg(input, output);
    const frameSize = (await stat(output)).size;
    if (frameSize === 0 || frameSize > MAX_FRAME_BYTES) throw new Error("The extracted final frame is invalid.");
    const bytes = new Uint8Array(await readFile(output));
    if (!isPng(bytes)) throw new Error("The extracted final frame is not a PNG image.");
    return bytes;
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
