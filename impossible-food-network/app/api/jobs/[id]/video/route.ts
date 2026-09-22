import { NextResponse } from "next/server";
import { findFoodPreset } from "../../../../../lib/food-presets";
import { defaultVideoAspectRatio, isVideoAspectRatio } from "../../../../../lib/food-settings";
import { submitFoodVideo } from "../../../../../lib/comfy";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json() as { preset?: unknown; aspectRatio?: unknown };
    const preset = findFoodPreset(body.preset);
    if (!preset) return NextResponse.json({ error: "Choose one of the surreal food concepts." }, { status: 400 });
    const aspectRatio = body.aspectRatio === undefined ? defaultVideoAspectRatio : body.aspectRatio;
    if (!isVideoAspectRatio(aspectRatio)) return NextResponse.json({ error: "Choose a supported video aspect ratio." }, { status: 400 });
    return NextResponse.json(await submitFoodVideo(id, preset, aspectRatio), { status: 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start the commercial video.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
