import { NextResponse } from "next/server";
import { submitRemoval } from "../../../lib/comfy";

export const runtime = "nodejs";

const ACCEPTED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

class InvalidRequest extends Error {}

function validateImage(value: FormDataEntryValue | null, label: string): asserts value is File {
  if (!(value instanceof File) || value.size === 0) {
    throw new InvalidRequest(`Choose a ${label} before submitting the correction.`);
  }

  if (!ACCEPTED_IMAGE_TYPES.has(value.type)) {
    throw new InvalidRequest(`${label} must be a PNG, JPEG, or WebP image.`);
  }

  if (value.size > MAX_IMAGE_BYTES) {
    throw new InvalidRequest("Keep each image below 15 MB.");
  }
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const image = form.get("image");
    const mask = form.get("mask");
    const edgeExpansion = Number(form.get("edgeExpansion"));

    validateImage(image, "source image");

    if (!(mask instanceof File) || mask.size === 0 || mask.type !== "image/png") {
      throw new InvalidRequest("The removal mask could not be read. Please mark the object again.");
    }

    if (mask.size > MAX_IMAGE_BYTES) {
      throw new InvalidRequest("The removal mask exceeds the 15 MB limit.");
    }

    if (!Number.isInteger(edgeExpansion) || edgeExpansion < 0 || edgeExpansion > 25) {
      throw new InvalidRequest("Mask edge expansion must be between 0 and 25 pixels.");
    }

    const job = await submitRemoval(image, mask, edgeExpansion);

    return NextResponse.json(job, { status: 202 });
  } catch (error) {
    const invalid = error instanceof InvalidRequest;
    const unavailable = error instanceof Error && (error.message.includes("COMFY_API_KEY") || error.message.includes("API key"));

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to submit the correction." },
      { status: invalid ? 400 : unavailable ? 503 : 502 },
    );
  }
}
