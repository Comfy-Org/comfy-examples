import { join } from "node:path";
import { Comfy, type Job } from "@comfyorg/sdk";

type Output = {
  id: string;
  name: string;
  type: string;
  url: string;
};

type Binding = readonly [nodeId: string, inputName: string];
type WorkflowConfig = {
  path: string;
  guide: Binding;
  prompt: Binding;
  seed: Binding;
  strength: Binding;
};

const workflow: WorkflowConfig = {
  path: join(process.cwd(), "workflows", "workflow_api.json"),
  guide: ["121", "image"],
  prompt: ["86:81", "text"],
  strength: ["86:129", "strength"],
  seed: ["86:3", "seed"],
};

function randomSeed() {
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}

function client() {
  const apiKey = process.env.COMFY_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("COMFY_API_KEY is not configured.");
  }

  return new Comfy({ apiKey, clientInfo: "comfy-sketch-to-image" });
}

async function outputs(job: Job): Promise<Output[]> {
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

export async function submitSketch(guide: File, prompt: string, strength: number) {
  const comfy = client();
  const request = await comfy.workflows.fromFile(workflow.path);
  const bytes = new Uint8Array(await guide.arrayBuffer());
  const asset = comfy.assets.fromBytes(bytes, {
    filename: "canvas-guide.png",
    contentType: "image/png",
  });

  request.setInput(...workflow.guide, asset);
  request.setInput(...workflow.prompt, prompt);
  request.setInput(...workflow.seed, randomSeed());

  request.setInput(...workflow.strength, strength);

  const job = await comfy.submit(request);

  return {
    id: job.id,
    status: job.status,
    outputs: await outputs(job),
    error: job.error,
  };
}

export async function getJob(id: string) {
  const job = await client().jobs.get(id);

  return {
    id: job.id,
    status: job.status,
    outputs: await outputs(job),
    error: job.error,
  };
}
