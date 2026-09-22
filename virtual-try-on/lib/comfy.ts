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

const workflowPath = join(process.cwd(), "workflows", "virtual_try_on_api.json");

async function serializeOutputs(job: Job): Promise<Output[]> {
  return Promise.all(job.outputs.map(async (output) => {
    const { url } = await output.getDownloadUrl();
    return { id: output.id, name: output.name, type: output.type, url };
  }));
}

export async function submitTryOn(person: File, garment: File, garmentType: string) {
  const key = apiKey();
  const comfy = client(key);
  const workflow = await comfy.workflows.fromFile(workflowPath);
  const personAsset = comfy.assets.fromBytes(new Uint8Array(await person.arrayBuffer()), {
    filename: person.name,
    contentType: person.type,
  });
  const garmentAsset = comfy.assets.fromBytes(new Uint8Array(await garment.arrayBuffer()), {
    filename: garment.name,
    contentType: garment.type,
  });

  workflow.setInput("1", "image", personAsset);
  workflow.setInput("2", "image", garmentAsset);
  workflow.setInput("3", "prompt", promptFor(garmentType));

  const job = await comfy.submit(workflow, { apiKey: key });
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
