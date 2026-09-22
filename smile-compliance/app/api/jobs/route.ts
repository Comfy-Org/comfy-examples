import { NextResponse } from "next/server";
import { submitSmile } from "../../../lib/comfy";
import { isSmileLevel, validateImageUpload } from "../../../lib/smile";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Send a valid image upload." }, { status: 400 });
  }

  const upload = validateImageUpload(form.get("image"));
  if ("error" in upload) return NextResponse.json({ error: upload.error }, { status: 400 });

  const level = form.get("level");
  if (!isSmileLevel(level)) {
    return NextResponse.json({ error: "Choose an approved joy level." }, { status: 400 });
  }

  try {
    return NextResponse.json(await submitSmile(upload.image, level), { status: 202 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "The smile review could not be submitted." },
      { status: error instanceof Error && (error.message.includes("COMFY_API_KEY") || error.message.includes("API key")) ? 503 : 502 },
    );
  }
}
