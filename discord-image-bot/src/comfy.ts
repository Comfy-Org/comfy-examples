import { join } from "node:path";
import { Comfy } from "@comfyorg/sdk";
import { comfyConfig } from "./config.js";

const workflowPath = join(process.cwd(), "workflows", "workflow_api.json");

export async function generateImage(prompt: string, signal: AbortSignal) {
  const config = comfyConfig();
  const client = new Comfy({ apiKey: config.apiKey, clientInfo: "comfy-discord-image-bot" });
  const workflow = await client.workflows.fromFile(workflowPath);
  workflow.setInput(config.promptNodeId, config.promptInput, prompt);

  const job = await client.submit(workflow, { signal });
  await job.result(signal);
  const output = job.outputs.find((item) => item.type === "image");

  if (!output) {
    throw new Error("The workflow completed without an image output.");
  }

  const { url } = await output.getDownloadUrl();

  return { jobId: job.id, url };
}
