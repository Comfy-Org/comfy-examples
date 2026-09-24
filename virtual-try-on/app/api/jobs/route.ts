import { NextResponse } from "next/server";
import { submitTryOn } from "../../../lib/comfy";
import { validateImageUpload } from "../../../lib/upload-validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let person: File;
  let garment: File;
  let garmentType: string;
  try {
    const form = await request.formData();
    const personUpload = form.get("person");
    const garmentUpload = form.get("garment");
    const requestedType = form.get("garmentType");
    validateImageUpload(personUpload, "person");
    validateImageUpload(garmentUpload, "garment");
    person = personUpload;
    garment = garmentUpload;
    garmentType = typeof requestedType === "string" ? requestedType : "auto";
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Choose a person and garment image." },
      { status: 400 },
    );
  }

  try {
    const job = await submitTryOn(person, garment, typeof garmentType === "string" ? garmentType : "auto");
    return NextResponse.json(job, { status: 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit try-on.";
    const status = message.includes("COMFY_API_KEY") || message.includes("API key") ? 503 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
