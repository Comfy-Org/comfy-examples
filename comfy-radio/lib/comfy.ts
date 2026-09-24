import { join } from "node:path";
import { Comfy, type Job } from "@comfyorg/sdk";
import { getStation } from "./stations";

type Track = { id: string; name: string; type: string; url: string };

const workflowPath = join(process.cwd(), "workflows", "workflow_api.json");

function client() {
  const apiKey = process.env.COMFY_API_KEY?.trim();
  if (!apiKey) throw new Error("Add COMFY_API_KEY to .env.local to generate a broadcast.");
  return new Comfy({ apiKey, clientInfo: "comfy-radio" });
}

async function audioOutputs(job: Job): Promise<Track[]> {
  return Promise.all(job.outputs.filter((output) => output.type === "audio").map(async (output) => {
    const { url } = await output.getDownloadUrl();
    return { id: output.id, name: output.name, type: output.type, url };
  }));
}

export async function submitBroadcast(stationId: string, prompt: string) {
  const station = getStation(stationId);
  if (!station) throw new Error("Tune to one of the five stations first.");

  const comfy = client();
  const workflow = await comfy.workflows.fromFile(workflowPath);
  const musicPrompt = `${station.prompt}\nListener's variation: ${prompt.trim()}`;
  workflow.setInput("94", "tags", musicPrompt);
  workflow.setInput("94", "lyrics", "");
  workflow.setInput("94", "duration", 60);
  workflow.setInput("98", "seconds", 60);
  workflow.setInput("3", "seed", Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));

  const job = await comfy.submit(workflow);
  return { id: job.id, status: job.status, outputs: await audioOutputs(job), error: job.error };
}

export async function getBroadcast(id: string) {
  const comfy = client();
  const job = await comfy.jobs.get(id);
  return { id: job.id, status: job.status, outputs: await audioOutputs(job), error: job.error };
}
