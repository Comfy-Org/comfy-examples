import { NextResponse } from "next/server";
import { submitWorkflow } from "../../../lib/comfy";

export const runtime = "nodejs";

const ACCEPTED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export function validateImageUpload(image: unknown): asserts image is File {
  if (!(image instanceof File)) {
    throw new Error("Choose an image to process.");
  }

  if (image.size === 0) {
    throw new Error("Choose an image to process.");
  }

  if (!ACCEPTED_IMAGE_TYPES.has(image.type)) {
    throw new Error("Upload a PNG, JPEG, or WebP image.");
  }

  if (image.size > MAX_IMAGE_BYTES) {
    throw new Error("Keep uploads below 10 MB for this sample.");
  }
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const image = form.get("image");
    validateImageUpload(image);

    const job = await submitWorkflow(image);

    return NextResponse.json(job, { status: 202 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to submit job." },
      { status: 400 },
    );
  }
}
