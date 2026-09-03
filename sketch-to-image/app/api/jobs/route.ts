import { NextResponse } from "next/server";
import { submitSketch } from "../../../lib/comfy";

export const runtime = "nodejs";

const MAX_GUIDE_BYTES = 10 * 1024 * 1024;

class InvalidRequest extends Error {}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const guide = form.get("guide");
    const prompt = form.get("prompt");
    const strength = Number(form.get("strength"));
    const primaryColor = form.get("primaryColor");
    const guideColors = form.get("guideColors");

    if (!(guide instanceof File) || guide.size === 0 || guide.type !== "image/png") {
      throw new InvalidRequest("Canvas export must be a PNG image.");
    }

    if (guide.size > MAX_GUIDE_BYTES) {
      throw new InvalidRequest("Keep the canvas export below 10 MB.");
    }

    if (typeof prompt !== "string" || !prompt.trim()) {
      throw new InvalidRequest("Add a prompt before rendering.");
    }

    if (!Number.isFinite(strength) || strength < 0 || strength > 1) {
      throw new InvalidRequest("Structure strength must be between 0 and 1.");
    }

    const subjectColor = typeof primaryColor === "string" && primaryColor ? `${primaryColor} ` : "";
    const paintedColors = typeof guideColors === "string" ? new Set(guideColors.split(",")) : new Set<string>();
    const sceneHints = [
      paintedColors.has("yellow") && "a yellow sun in the sky",
      paintedColors.has("blue") && "a blue sky",
      paintedColors.has("green") && "green ground or foliage",
    ].filter(Boolean).join(", ");
    const constrainedPrompt = `A single ${subjectColor}${prompt.trim()}, fully in frame. ${sceneHints ? `Include ${sceneHints}.` : ""} Clean composition with no text, panels, color swatches, grids, duplicate subjects, unrelated people, or visible guide strokes.`;
    const job = await submitSketch(guide, constrainedPrompt, strength);

    return NextResponse.json(job, { status: 202 });
  } catch (error) {
    const isInvalidRequest = error instanceof InvalidRequest;

    return NextResponse.json(
      { error: isInvalidRequest ? error.message : "Unable to submit canvas." },
      { status: isInvalidRequest ? 400 : 500 },
    );
  }
}
