import { join } from "node:path";
import { Comfy, type Job } from "@comfyorg/sdk";
import { appTemplate } from "./app-template";

type Output = { id: string; name: string; type: string; url: string };

function client() {
  const apiKey = process.env.COMFY_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("COMFY_API_KEY is not configured.");
  }

  return new Comfy({ apiKey, clientInfo: "comfy-web-app-template" });
}

const workflowPath = join(process.cwd(), "workflows", "workflow_api.json");

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

export async function submitWorkflow(image: File) {
  const comfy = client();
  const jobWorkflow = await comfy.workflows.fromFile(workflowPath);
  const bytes = new Uint8Array(await image.arrayBuffer());
  const asset = comfy.assets.fromBytes(bytes, {
    filename: image.name,
    contentType: image.type,
  });
  jobWorkflow.setInput(
    appTemplate.workflow.bindings.image.nodeId,
    appTemplate.workflow.bindings.image.input,
    asset,
  );
  const job = await comfy.submit(jobWorkflow);

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
