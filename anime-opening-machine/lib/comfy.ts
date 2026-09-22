import { join } from "node:path";
import { Comfy, type Job } from "@comfyorg/sdk";
import { normalizeOutputType } from "./output-types";
import { animationPrompt, storyboardPrompt } from "./story";

type Output = { id: string; name: string; type: string; url: string };
const root = process.cwd();
const storyboardPath = join(root, "workflows", "storyboard_api.json");
const animationPath = join(root, "workflows", "animation_api.json");
const assemblePath = join(root, "workflows", "assemble_api.json");

function client() {
  const apiKey = process.env.COMFY_API_KEY?.trim();
  if (!apiKey) throw new Error("Add a Comfy API key to .env.local to generate your opening.");
  return { apiKey, comfy: new Comfy({ apiKey, clientInfo: "comfy-anime-opening-machine" }) };
}

async function serializeOutputs(job: Job): Promise<Output[]> {
  return Promise.all(job.outputs.map(async (output) => {
    const { url } = await output.getDownloadUrl();
    return { id: output.id, name: output.name, type: normalizeOutputType(output), url };
  }));
}

function jobSummary(job: Job) {
  return { id: job.id, status: job.status, error: job.error };
}

async function createAsset(comfy: Comfy, file: File, fallbackName: string) {
  return comfy.assets.fromBytes(new Uint8Array(await file.arrayBuffer()), {
    filename: file.name || fallbackName,
    contentType: file.type,
  });
}

export async function submitStoryboard(protagonist: File, rival: File | null, theme: string) {
  const { apiKey, comfy } = client();
  const [heroAsset, rivalAsset] = await Promise.all([
    createAsset(comfy, protagonist, "protagonist.png"),
    rival ? createAsset(comfy, rival, "rival.png") : Promise.resolve(null),
  ]);

  // Eight independent image jobs keep one frame's prompt and failure isolated.
  const jobs = await Promise.all(Array.from({ length: 8 }, async (_, index) => {
    const workflow = await comfy.workflows.fromFile(storyboardPath);
    workflow.setInput("1", "image", heroAsset);
    if (rivalAsset) workflow.setInput("2", "image", rivalAsset);
    else {
      const batchNode = workflow.json["3"];
      if (batchNode && typeof batchNode === "object" && "inputs" in batchNode && batchNode.inputs && typeof batchNode.inputs === "object") {
        delete (batchNode.inputs as Record<string, unknown>)["images.image1"];
      }
      delete workflow.json["2"];
    }
    workflow.setInput("4", "prompt", storyboardPrompt(theme, index, Boolean(rivalAsset)));
    workflow.setInput("4", "seed", Math.floor(Math.random() * 2_147_483_647));
    const job = await comfy.submit(workflow, { apiKey });
    return { ...jobSummary(job), frameIndex: index };
  }));
  return { jobs };
}

export async function submitAnimations(storyboardJobIds: string[], frameIndexes: number[], theme: string) {
  const { apiKey, comfy } = client();
  const selected = await Promise.all(frameIndexes.map(async (frameIndex) => {
    const jobId = storyboardJobIds[frameIndex];
    if (!jobId) throw new Error("The storyboard is missing a selected frame.");
    const sourceJob = await comfy.jobs.get(jobId);
    if (sourceJob.status !== "succeeded") throw new Error(`Frame ${frameIndex + 1} is not ready to animate.`);
    const image = sourceJob.outputs.find((output) => normalizeOutputType(output) === "image");
    if (!image) throw new Error(`Frame ${frameIndex + 1} has no image output.`);
    const { url } = await image.getDownloadUrl();
    const asset = await comfy.assets.fromUrl(url);
    const workflow = await comfy.workflows.fromFile(animationPath);
    workflow.setInput("1", "image", asset);
    workflow.setInput("2", "model.prompt", animationPrompt(theme, frameIndex));
    workflow.setInput("2", "seed", Math.floor(Math.random() * 2_147_483_647));
    const job = await comfy.submit(workflow, { apiKey });
    return { ...jobSummary(job), frameIndex };
  }));
  return { jobs: selected };
}

export async function assembleLoop(jobIds: string[]) {
  const { apiKey, comfy } = client();
  const clips = await Promise.all(jobIds.map(async (id) => {
    const job = await comfy.jobs.get(id);
    if (job.status !== "succeeded") throw new Error("Wait for every selected shot to finish before assembling the loop.");
    const video = job.outputs.find((output) => normalizeOutputType(output) === "video");
    if (!video) throw new Error("A selected shot finished without a video output.");
    const { url } = await video.getDownloadUrl();
    return comfy.assets.fromUrl(url);
  }));

  const workflow = await comfy.workflows.fromFile(assemblePath);
  const fourSlots = Array.from({ length: 4 }, (_, index) => clips[index % clips.length]);
  for (const [index, asset] of fourSlots.entries()) workflow.setInput(String(index + 1), "file", asset);
  const job = await comfy.submit(workflow, { apiKey });
  return jobSummary(job);
}

export async function getJob(id: string) {
  const { comfy } = client();
  const job = await comfy.jobs.get(id);
  return { ...jobSummary(job), outputs: await serializeOutputs(job) };
}
