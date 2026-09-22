import { join } from "node:path";
import { Comfy, type Job } from "@comfyorg/sdk";

type Output = { id: string; name: string; type: string; url: string };
type Binding = readonly [nodeId: string, inputName: string];

const workflow = {
  path: join(process.cwd(), "workflows", "workflow_api.json"),
  image: ["1", "image"] as Binding,
  mask: ["2", "image"] as Binding,
  edgeExpansion: ["3", "dilate_pixels"] as Binding,
  seed: ["3", "seed"] as Binding,
};

function apiKey() {
  const apiKey = process.env.COMFY_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("COMFY_API_KEY is not configured.");
  }

  return apiKey;
}

function client(key: string) {
  return new Comfy({ apiKey: key, clientInfo: "comfy-bureau-visual-corrections" });
}

function randomSeed() {
  return Math.floor(Math.random() * 2_147_483_648);
}

async function serializeOutputs(job: Job): Promise<Output[]> {
  return Promise.all(job.outputs.map(async (output) => {
    const { url } = await output.getDownloadUrl();

    return {
      id: output.id,
      name: output.name,
      type: output.type,
      url,
    };
  }));
}

export async function submitRemoval(image: File, mask: File, edgeExpansion: number) {
  const partnerApiKey = apiKey();
  const comfy = client(partnerApiKey);
  const request = await comfy.workflows.fromFile(workflow.path);
  const imageAsset = comfy.assets.fromBytes(new Uint8Array(await image.arrayBuffer()), {
    filename: image.name,
    contentType: image.type,
  });
  const maskAsset = comfy.assets.fromBytes(new Uint8Array(await mask.arrayBuffer()), {
    filename: "removal-mask.png",
    contentType: "image/png",
  });

  request.setInput(...workflow.image, imageAsset);
  request.setInput(...workflow.mask, maskAsset);
  request.setInput(...workflow.edgeExpansion, edgeExpansion);
  request.setInput(...workflow.seed, randomSeed());

  const job = await comfy.submit(request, { apiKey: partnerApiKey });

  return {
    id: job.id,
    status: job.status,
    outputs: await serializeOutputs(job),
    error: job.error,
  };
}

export async function getJob(id: string) {
  const job = await client(apiKey()).jobs.get(id);

  return {
    id: job.id,
    status: job.status,
    outputs: await serializeOutputs(job),
    error: job.error,
  };
}
