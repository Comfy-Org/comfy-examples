import { join } from "node:path";
import { Comfy, type Job } from "@comfyorg/sdk";
import { smilePrompt, type SmileLevel } from "./smile";

type Output = { id: string; name: string; type: string; url: string };

const workflowPath = join(process.cwd(), "workflows", "workflow_api.json");

function client() {
  const apiKey = process.env.COMFY_API_KEY?.trim();
  if (!apiKey) throw new Error("COMFY_API_KEY is not configured.");
  return { apiKey, comfy: new Comfy({ apiKey, clientInfo: "comfy-smile-compliance" }) };
}

async function serializeOutputs(job: Job): Promise<Output[]> {
  return Promise.all(job.outputs.map(async (output) => {
    const { url } = await output.getDownloadUrl();
    return { id: output.id, name: output.name, type: output.type, url };
  }));
}

export async function submitSmile(image: File, level: SmileLevel) {
  const { apiKey, comfy } = client();
  const workflow = await comfy.workflows.fromFile(workflowPath);
  const asset = comfy.assets.fromBytes(new Uint8Array(await image.arrayBuffer()), {
    filename: image.name || "subject.png",
    contentType: image.type,
  });

  workflow.setInput("16", "image", asset);
  workflow.setInput("24", "prompt", smilePrompt(level));
  workflow.setInput("24", "seed", Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));

  const job = await comfy.submit(workflow, { apiKey });
  return { id: job.id, status: job.status, outputs: await serializeOutputs(job), error: job.error };
}

export async function getJob(id: string) {
  const { comfy } = client();
  const job = await comfy.jobs.get(id);
  return { id: job.id, status: job.status, outputs: await serializeOutputs(job), error: job.error };
}
