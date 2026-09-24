import { join } from "node:path";
import { Comfy, type Job } from "@comfyorg/sdk";
import type { FoodPreset } from "./food-presets";
import { commercialDurationSeconds, type VideoAspectRatio } from "./food-settings";

type Output = { id: string; name: string; type: string; url: string };
type JobResponse = { id: string; status: string; outputs: Output[]; error: { message?: string } | null };

function client() {
  const apiKey = process.env.COMFY_API_KEY?.trim();
  if (!apiKey) throw new Error("COMFY_API_KEY is not configured.");
  return new Comfy({ apiKey, clientInfo: "impossible-food-network" });
}

async function serializeOutputs(job: Job): Promise<Output[]> {
  return Promise.all(job.outputs.map(async (output) => {
    const { url } = await output.getDownloadUrl();
    const extension = output.name.split(".").pop()?.toLowerCase();
    const type = ["mp4", "mkv", "webm", "mov"].includes(extension ?? "")
      ? "video"
      : ["png", "jpg", "jpeg", "webp", "gif"].includes(extension ?? "")
        ? "image"
        : output.type;
    return { id: output.id, name: output.name, type, url };
  }));
}

function response(job: Job, outputs: Output[]): JobResponse {
  return { id: job.id, status: job.status, outputs, error: job.error };
}

export async function submitFoodEdit(image: File, preset: FoodPreset) {
  const comfy = client();
  const workflow = await comfy.workflows.fromFile(join(process.cwd(), "workflows", "food-edit_api.json"));
  const asset = comfy.assets.fromBytes(new Uint8Array(await image.arrayBuffer()), {
    filename: image.name || "meal-photo.png",
    contentType: image.type,
  });
  workflow.setInput("32", "image", asset);
  workflow.setInput("45:36", "prompt", preset.imagePrompt);
  const job = await comfy.submit(workflow);
  return response(job, await serializeOutputs(job));
}

export async function getJob(id: string) {
  const job = await client().jobs.get(id);
  return response(job, await serializeOutputs(job));
}

export async function submitFoodVideo(imageJobId: string, preset: FoodPreset, aspectRatio: VideoAspectRatio) {
  const comfy = client();
  const imageJob = await comfy.jobs.get(imageJobId);
  if (imageJob.status !== "succeeded") throw new Error("The hero image is not ready for its video pass.");
  const imageOutput = imageJob.outputs.find((output) => output.type.toLowerCase().includes("image"));
  if (!imageOutput) throw new Error("The image pass finished without an image output.");

  const { url } = await imageOutput.getDownloadUrl();
  const download = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  const contentType = download.headers.get("content-type")?.split(";")[0] ?? "";
  if (!download.ok || !contentType.startsWith("image/")) throw new Error("The generated hero image could not be prepared for video.");
  const bytes = new Uint8Array(await download.arrayBuffer());
  const asset = comfy.assets.fromBytes(bytes, { filename: "impossible-food-hero.png", contentType });

  const workflow = await comfy.workflows.fromFile(join(process.cwd(), "workflows", "food-video_api.json"));
  workflow.setInput("395", "image", asset);
  workflow.setInput("398:376", "value", preset.motionPrompt);
  workflow.setInput("398:362", "value", commercialDurationSeconds);
  workflow.setInput("403", "aspect_ratio", aspectRatio);
  const job = await comfy.submit(workflow);
  return response(job, await serializeOutputs(job));
}
