import { NextResponse } from "next/server";
import { submitProfilePortrait } from "../../../lib/comfy";
import { validatePortrait } from "../../../lib/validation";
import { getStyle } from "../../../lib/styles";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let portrait: File;
  let styleId: string;
  let single: boolean;
  try {
    const form = await request.formData();
    const portraitUpload = form.get("portrait");
    const selectedStyle = form.get("styleId");
    const mode = form.get("mode");
    validatePortrait(portraitUpload);
    if (!getStyle(selectedStyle)) throw new Error("Choose one of the available styles.");
    if (mode !== "single" && mode !== "bundle") throw new Error("Choose a valid generation type.");
    portrait = portraitUpload;
    styleId = selectedStyle as string;
    single = mode === "single";
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Choose a portrait, style, and generation type." },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(
      await submitProfilePortrait(portrait, styleId as Parameters<typeof submitProfilePortrait>[1], single),
      { status: 202 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start your portraits.";
    const status = message.includes("COMFY_API_KEY") || message.includes("API key") ? 503 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
