import { randomInt } from "node:crypto";
import { Comfy, type Job } from "@comfyorg/sdk";
import { getStyle, promptForStyle, type StyleId } from "./styles";
import { orderBundleOutputs } from "./output-order";
import bundleGraph from "../blueprints/profile-picture-bundle.compiled.json";
import singleGraph from "../blueprints/profile-picture-single.compiled.json";

const BUNDLE_SIZE = 8;

type ApiNode = {
  class_type?: string;
  inputs?: Record<string, unknown>;
  _meta?: { title?: string };
};
type BundleOutput = { id: string; name: string; type: string; url: string; index: number };

function client() {
  const apiKey = process.env.COMFY_API_KEY?.trim();
  if (!apiKey) throw new Error("Add a Comfy API key to .env.local to enable generation.");
  return new Comfy({ apiKey, clientInfo: "comfy-profile-picture-generator" });
}

export function bundleIdFor(jobId: string, styleId: StyleId, count: number) {
  return Buffer.from(JSON.stringify({ jobId, styleId, count })).toString("base64url");
}

function readBundleId(id: string) {
  if (id.length > 512) throw new Error("This generation link is invalid.");
  let parsed: { jobId?: unknown; styleId?: unknown; count?: unknown };
  try {
    parsed = JSON.parse(Buffer.from(id, "base64url").toString("utf8"));
  } catch {
    throw new Error("This generation link is invalid.");
  }
  const style = getStyle(parsed.styleId);
  if (typeof parsed.jobId !== "string" || !parsed.jobId || !style || (parsed.count !== 1 && parsed.count !== BUNDLE_SIZE)) {
    throw new Error("This generation link is invalid.");
  }
  return { jobId: parsed.jobId, styleId: style.id, requestedCount: parsed.count };
}

async function serializeOutputs(job: Job, bundleId: string): Promise<BundleOutput[]> {
  const images = orderBundleOutputs(job.outputs.filter((output) => output.type === "image"));
  return images.map((output, index) => ({
    id: output.id,
    name: output.name,
    type: output.type,
    url: `/api/bundles/${bundleId}/outputs/${output.id}`,
    index,
  }));
}

export async function submitProfilePortrait(portrait: File, styleId: StyleId, single = false) {
  const style = getStyle(styleId);
  if (!style) throw new Error("Choose one of the available styles.");

  const comfy = client();
  const graph = structuredClone(single ? singleGraph : bundleGraph) as Record<string, ApiNode>;
  // Compose metadata is provenance for the blueprint compiler, not an API node.
  delete graph._meta;

  const workflow = comfy.workflows.fromJson(graph);
  const image = comfy.assets.fromBytes(new Uint8Array(await portrait.arrayBuffer()), {
    filename: portrait.name || "portrait.png",
    contentType: portrait.type,
  });
  const imageInputs = Object.entries(graph).filter(([, node]) => node.class_type === "FluxKontextImageScale");
  const prompts = Object.entries(graph).filter(([, node]) =>
    node.class_type === "TextEncodeQwenImageEditPlus" && node._meta?.title?.includes("(Positive)"),
  );
  const samplers = Object.entries(graph).filter(([, node]) => node.class_type === "KSampler");
  const expectedCount = single ? 1 : BUNDLE_SIZE;
  if (imageInputs.length !== expectedCount || prompts.length !== expectedCount || samplers.length !== expectedCount) {
    throw new Error("The profile picture workflow is out of date. Rebuild it with npm run build:workflows.");
  }

  imageInputs.forEach(([nodeId]) => workflow.setInput(nodeId, "image", image));
  prompts.forEach(([nodeId], index) => {
    workflow.setInput(nodeId, "prompt", promptForStyle(style, index));
  });
  samplers.forEach(([nodeId]) => workflow.setInput(nodeId, "seed", randomInt(1, 2 ** 32 - 1)));

  const job = await comfy.submit(workflow);
  const requestedCount = single ? 1 : BUNDLE_SIZE;
  const id = bundleIdFor(job.id, style.id, requestedCount);
  return {
    id,
    status: job.status,
    styleId: style.id,
    requestedCount,
    completedCount: 0,
    outputs: await serializeOutputs(job, id),
    error: job.error,
  };
}

export async function getProfileBundle(id: string) {
  const meta = readBundleId(id);
  const job = await client().jobs.get(meta.jobId);
  return {
    id,
    status: job.status,
    styleId: meta.styleId,
    requestedCount: meta.requestedCount,
    completedCount: job.outputs.filter((output) => output.type === "image").length,
    outputs: await serializeOutputs(job, id),
    error: job.error,
  };
}

export async function getProfileOutput(bundleId: string, outputId: string) {
  const { jobId } = readBundleId(bundleId);
  const job = await client().jobs.get(jobId);
  const output = job.outputs.find((candidate) => candidate.id === outputId);
  if (!output || output.type !== "image") throw new Error("This portrait is no longer available.");
  return { bytes: await output.toBytes(), contentType: output.contentType };
}
