import { NextResponse } from "next/server";
import { submitStoryboard } from "../../../lib/comfy";
import { InvalidRequest, validateCharacterImage, validateTheme } from "../../../lib/upload-validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const protagonist = form.get("protagonist");
    const rival = form.get("rival");
    const theme = form.get("theme");
    validateCharacterImage(protagonist, "protagonist");
    if (rival !== null && rival !== "") validateCharacterImage(rival, "rival");
    validateTheme(theme);
    return NextResponse.json(await submitStoryboard(protagonist, rival instanceof File ? rival : null, theme), { status: 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start the storyboard.";
    const unavailable = message.includes("COMFY_API_KEY") || message.includes("API key");
    return NextResponse.json({ error: message }, { status: error instanceof InvalidRequest ? 400 : unavailable ? 503 : 502 });
  }
}
