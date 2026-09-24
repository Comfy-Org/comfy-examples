import { NextResponse } from "next/server";
import { submitFoodEdit } from "../../../lib/comfy";
import { InvalidFoodRequest, validateFoodRequest } from "../../../lib/upload-validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const { image, preset } = validateFoodRequest(form.get("image"), form.get("preset"));
    return NextResponse.json(await submitFoodEdit(image, preset), { status: 202 });
  } catch (error) {
    const invalid = error instanceof InvalidFoodRequest;
    const message = error instanceof Error ? error.message : "Unable to start the food transformation.";
    const unavailable = message.includes("COMFY_API_KEY") || message.includes("API key");
    return NextResponse.json({ error: message }, { status: invalid ? 400 : unavailable ? 503 : 502 });
  }
}
