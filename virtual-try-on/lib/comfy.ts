import { join } from "node:path";
import { Comfy, type Job } from "@comfyorg/sdk";

type Output = { id: string; name: string; type: string; url: string };

function apiKey() {
  const apiKey = process.env.COMFY_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("Add a Comfy API key to .env.local to enable try-on generation.");
  }

  return apiKey;
}

function client(key = apiKey()) {
  return new Comfy({ apiKey: key, clientInfo: "thread-and-form-virtual-try-on" });
}

const workflowPath = join(process.cwd(), "workflows", "workflow_open_api.json");

async function serializeOutputs(job: Job): Promise<Output[]> {
  return Promise.all(job.outputs.map(async (output) => {
    const { url } = await output.getDownloadUrl();
    return { id: output.id, name: output.name, type: output.type, url };
  }));
}

export async function submitTryOn(person: File, garment: File, garmentType: string) {
  const comfy = client();
  const workflow = await comfy.workflows.fromFile(workflowPath);
  const personAsset = comfy.assets.fromBytes(new Uint8Array(await person.arrayBuffer()), {
    filename: person.name,
    contentType: person.type,
  });
  const garmentAsset = comfy.assets.fromBytes(new Uint8Array(await garment.arrayBuffer()), {
    filename: garment.name,
    contentType: garment.type,
  });

  workflow.setInput("173", "image", personAsset);
  workflow.setInput("174", "image", garmentAsset);
  workflow.setInput("107", "prompt", promptFor(garmentType));
  workflow.setInput("121", "seed", Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));
  delete workflow.json._meta;

  const job = await comfy.submit(workflow);
  return {
    id: job.id,
    status: job.status,
    outputs: await serializeOutputs(job),
    error: job.error,
  };
}

export async function getJob(id: string) {
  const job = await client().jobs.get(id);
  return {
    id: job.id,
    status: job.status,
    outputs: await serializeOutputs(job),
    error: job.error,
  };
}

function promptFor(garmentType: string) {
  const category = {
    upper: "upper-body garment",
    lower: "lower-body garment",
    dress: "dress",
    outerwear: "outerwear garment",
    auto: "garment",
  }[garmentType] ?? "garment";

  return `Dress the person in the reference ${category}. Preserve the person's identity, face, pose, and photo background. Match the garment's color, cut, fabric, and visible details as closely as possible.`;
}
