import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Comfy, type Job, type Output as ComfyOutput } from "@comfyorg/sdk";
import { type Figure } from "./figures";
import { extractLastFrame } from "./last-frame";

type Message = { role: "user"; content: string };
type Output = { id: string; name: string; type: string; url: string };

const workflowPath = join(process.cwd(), "workflows", "workflow_api.json");

function client() {
  const apiKey = process.env.COMFY_API_KEY?.trim();
  if (!apiKey) throw new Error("COMFY_API_KEY is not configured.");
  if (!process.env.COMFY_BASE_URL?.trim()) throw new Error("COMFY_BASE_URL is not configured.");
  return new Comfy({ apiKey, clientInfo: "historical-figures-chat" });
}

async function portraitAsset(comfy: Comfy, figure: Figure) {
  if (figure.image.startsWith("/portraits/")) {
    const bytes = new Uint8Array(await readFile(join(process.cwd(), "public", figure.image.slice(1))));
    return comfy.assets.fromBytes(bytes, { filename: `${figure.id}.png`, contentType: "image/png" });
  }
  const response = await fetch(figure.image, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok || !response.headers.get("content-type")?.startsWith("image/")) {
    throw new Error(`Unable to fetch the portrait for ${figure.name}.`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  return comfy.assets.fromBytes(bytes, { filename: `${figure.id}.jpg`, contentType: "image/jpeg" });
}

function continuationOutput(job: Job): ComfyOutput {
  if (job.status !== "succeeded") throw new Error("The previous video job has not succeeded.");
  const output = job.getOutputs("92").find((candidate) => candidate.type.toLowerCase().includes("video"));
  if (!output || !output.contentType.toLowerCase().startsWith("video/")) {
    throw new Error("The previous job does not contain the expected video output.");
  }
  return output;
}

async function sourceAsset(comfy: Comfy, figure: Figure, previousJobId?: string) {
  if (!previousJobId) return portraitAsset(comfy, figure);
  const previousJob = await comfy.jobs.get(previousJobId);
  const bytes = await extractLastFrame(continuationOutput(previousJob));
  return comfy.assets.fromBytes(bytes, { filename: `${figure.id}-continuation.png`, contentType: "image/png" });
}

async function serializeOutputs(job: Job): Promise<Output[]> {
  return Promise.all(job.outputs.map(async (output) => {
    const { url } = await output.getDownloadUrl();
    return { id: output.id, name: output.name, type: output.type, url };
  }));
}

function dialogueRequest(figure: Figure, messages: Message[]) {
  const transcript = messages.map((message) => `Visitor: ${message.content}`).join("\n");
  return [
    `Write ${figure.name}'s direct answer to the latest visitor question in 8 to 12 English words.`,
    "Return only the words that will be spoken: no quotation marks, speaker names, stage direction, markdown, or music instructions.",
    "Visitor question history (the prior generated replies are video-only and are not transcribed):",
    transcript,
  ].join("\n\n");
}

export async function submitConversation(figure: Figure, messages: Message[], previousJobId?: string) {
  const comfy = client();
  const workflow = await comfy.workflows.fromFile(workflowPath);
  const asset = await sourceAsset(comfy, figure, previousJobId);

  // These bindings map to the validated API export in workflows/workflow_api.json.
  workflow.setInput("114", "image", asset);
  workflow.setInput("2585308530609103", "system_prompt", `${figure.persona} Return only a concise spoken reply, never directions, music, or formatting.`);
  workflow.setInput("2585308530609103", "user_prompt", dialogueRequest(figure, messages));
  const job = await comfy.submit(workflow);

  return { id: job.id, status: job.status, outputs: await serializeOutputs(job), error: job.error };
}

export async function getJob(id: string) {
  const job = await client().jobs.get(id);
  return { id: job.id, status: job.status, outputs: await serializeOutputs(job), error: job.error };
}
