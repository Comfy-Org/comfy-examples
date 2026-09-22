import { join } from "node:path";
import { Comfy, type Job } from "@comfyorg/sdk";
import { buildRoomPrompt, type PlacedFurniture, type StyleName } from "./room-design";

type SerializedOutput = { id: string; name: string; type: string; url: string };

const workflowPath = join(process.cwd(), "workflows", "workflow_open_api.json");

function client() {
  const apiKey = process.env.COMFY_API_KEY?.trim();
  if (!apiKey) throw new Error("COMFY_API_KEY is not configured. Copy .env.example to .env.local and add a Comfy API key.");
  return { apiKey, comfy: new Comfy({ apiKey, clientInfo: "comfy-room-remix" }) };
}

async function serializeOutputs(job: Job): Promise<SerializedOutput[]> {
  return Promise.all(job.outputs.map(async (output) => {
    const { url } = await output.getDownloadUrl();
    return { id: output.id, name: output.name, type: output.type, url };
  }));
}

function randomSeed() {
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}

function findNodeId(workflow: Awaited<ReturnType<Comfy["workflows"]["fromFile"]>>, classType: string, title?: string) {
  const matches = Object.entries(workflow.json).filter(([, value]) =>
    value !== null && typeof value === "object" && "class_type" in value && value.class_type === classType
    && (!title || ("_meta" in value && value._meta && typeof value._meta === "object" && "title" in value._meta && value._meta.title === title)),
  );
  if (matches.length !== 1) throw new Error(`Expected one ${classType} node in the room makeover workflow.`);
  return matches[0]![0];
}

export async function submitRoomRemix(image: File, style: StyleName, items: PlacedFurniture[]) {
  const { comfy } = client();
  const workflow = await comfy.workflows.fromFile(workflowPath);
  const imageAsset = comfy.assets.fromBytes(new Uint8Array(await image.arrayBuffer()), {
    filename: image.name || "room.jpg",
    contentType: image.type,
  });

  const imageNodeId = findNodeId(workflow, "LoadImage");
  const editNodeId = findNodeId(workflow, "TextEncodeQwenImageEditPlus", "TextEncodeQwenImageEditPlus (Positive)");
  const samplerNodeId = findNodeId(workflow, "KSampler");
  workflow.setInput(imageNodeId, "image", imageAsset);
  workflow.setInput(editNodeId, "prompt", buildRoomPrompt(style, items));
  workflow.setInput(samplerNodeId, "seed", randomSeed());

  const job = await comfy.submit(workflow);
  return { id: job.id, status: job.status, outputs: await serializeOutputs(job), error: job.error };
}

export async function getRoomRemixJob(id: string) {
  const { comfy } = client();
  const job = await comfy.jobs.get(id);
  return { id: job.id, status: job.status, outputs: await serializeOutputs(job), error: job.error };
}
