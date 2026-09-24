import { join } from "node:path";
import { Comfy, type Job } from "@comfyorg/sdk";

type Output = { id: string; name: string; type: string; url: string };
type Binding = readonly [nodeId: string, inputName: string];

const workflowPath = join(process.cwd(), "workflows", "workflow_api.json");
const guideBinding: Binding = ["121", "image"];
const promptBinding: Binding = ["86:81", "text"];
const seedBinding: Binding = ["86:3", "seed"];
const strengthBinding: Binding = ["86:129", "strength"];

function client() {
  const apiKey = process.env.COMFY_API_KEY?.trim();
  if (!apiKey) throw new Error("COMFY_API_KEY is not configured.");
  return new Comfy({ apiKey, clientInfo: "comfy-museum-of-bad-ideas" });
}

async function outputs(job: Job): Promise<Output[]> {
  return Promise.all(job.outputs.map(async (output) => {
    const { url } = await output.getDownloadUrl();
    return { id: output.id, name: output.name, type: output.type, url };
  }));
}

export async function submitExhibit(doodle: File, prompt: string) {
  const comfy = client();
  const request = await comfy.workflows.fromFile(workflowPath);
  const asset = comfy.assets.fromBytes(new Uint8Array(await doodle.arrayBuffer()), {
    filename: doodle.name || "museum-doodle.png",
    contentType: doodle.type,
  });

  request.setInput(...guideBinding, asset);
  request.setInput(...promptBinding, prompt);
  request.setInput(...seedBinding, Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));
  request.setInput(...strengthBinding, 0.43);

  const job = await comfy.submit(request);
  return { id: job.id, status: job.status, outputs: await outputs(job), error: job.error };
}

export async function getExhibitJob(id: string) {
  const job = await client().jobs.get(id);
  return { id: job.id, status: job.status, outputs: await outputs(job), error: job.error };
}
