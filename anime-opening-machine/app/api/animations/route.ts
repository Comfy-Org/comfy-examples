import { NextResponse } from "next/server";
import { submitAnimations } from "../../../lib/comfy";
import { InvalidRequest, validateFrameIndexes, validateTheme } from "../../../lib/upload-validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { storyboardJobIds?: unknown; frameIndexes?: unknown; theme?: unknown };
    validateFrameIndexes(body.frameIndexes);
    validateTheme(body.theme);
    if (!Array.isArray(body.storyboardJobIds) || body.storyboardJobIds.length !== 8 || body.storyboardJobIds.some((id) => typeof id !== "string" || !/^[\w-]{1,128}$/.test(id))) {
      throw new InvalidRequest("Generate a storyboard before animating frames.");
    }
    return NextResponse.json(await submitAnimations(body.storyboardJobIds as string[], body.frameIndexes, body.theme), { status: 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start animation.";
    const unavailable = message.includes("COMFY_API_KEY") || message.includes("API key");
    return NextResponse.json({ error: message }, { status: error instanceof InvalidRequest ? 400 : unavailable ? 503 : 502 });
  }
}
