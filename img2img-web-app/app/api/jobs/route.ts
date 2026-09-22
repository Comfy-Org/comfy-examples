import { NextResponse } from "next/server";
import { submitWorkflow } from "../../../lib/comfy";

export const runtime = "nodejs";

const ACCEPTED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

class InvalidRequest extends Error {}

export function validateImageUpload(image: unknown): asserts image is File {
  if (!(image instanceof File)) {
    throw new InvalidRequest("Choose an image to process.");
  }

  if (image.size === 0) {
    throw new InvalidRequest("Choose an image to process.");
  }

  if (!ACCEPTED_IMAGE_TYPES.has(image.type)) {
    throw new InvalidRequest("Upload a PNG, JPEG, or WebP image.");
  }

  if (image.size > MAX_IMAGE_BYTES) {
    throw new InvalidRequest("Keep uploads below 10 MB for this sample.");
  }
}

export async function POST(request: Request) {
  let image: File;
  try {
    const form = await request.formData();
    const upload = form.get("image");
    validateImageUpload(upload);
    image = upload;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Choose an image to process." },
      { status: 400 },
    );
  }

  try {
    const job = await submitWorkflow(image);

    return NextResponse.json(job, { status: 202 });
  } catch (error) {
    const missingApiKey = error instanceof Error && error.message.includes("COMFY_API_KEY");
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to submit job." },
      { status: missingApiKey ? 503 : 502 },
    );
  }
}
