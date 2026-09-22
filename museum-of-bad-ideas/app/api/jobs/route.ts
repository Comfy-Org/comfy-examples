import { NextResponse } from "next/server";
import { getExhibit } from "../../../lib/exhibits";
import { submitExhibit } from "../../../lib/comfy";

export const runtime = "nodejs";

const MAX_DOODLE_BYTES = 10 * 1024 * 1024;
const acceptedTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

class InvalidRequest extends Error {}

function hasValidSignature(file: File, bytes: Uint8Array) {
  if (file.type === "image/png") {
    return bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  }
  if (file.type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (file.type === "image/webp") {
    return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  }
  return false;
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const doodle = form.get("doodle");
    const exhibitId = form.get("exhibit");

    if (!(doodle instanceof File) || doodle.size === 0) throw new InvalidRequest("Choose an image of your masterpiece first.");
    if (doodle.size > MAX_DOODLE_BYTES) throw new InvalidRequest("Your doodle must be smaller than 10 MB.");
    if (!acceptedTypes.has(doodle.type)) throw new InvalidRequest("Use a PNG, JPEG, or WebP image.");
    const bytes = new Uint8Array(await doodle.slice(0, 12).arrayBuffer());
    if (!hasValidSignature(doodle, bytes)) throw new InvalidRequest("That file does not look like a valid image.");
    if (typeof exhibitId !== "string" || !getExhibit(exhibitId)) throw new InvalidRequest("Choose an exhibit style to continue.");

    const exhibit = getExhibit(exhibitId)!;
    const prompt = `${exhibit.prompt} Show one clear subject, fully in frame. The result should look absurdly well-funded while retaining the charming amateur mistakes of the source. Avoid duplicate subjects, visible doodle strokes, and any typography.`;
    const job = await submitExhibit(doodle, prompt);
    return NextResponse.json(job, { status: 202 });
  } catch (error) {
    const invalid = error instanceof InvalidRequest;
    const message = error instanceof Error ? error.message : "Unable to submit this exhibit.";
    const unavailable = message.includes("COMFY_API_KEY") || message.includes("API key");
    return NextResponse.json(
      { error: message || "Unable to submit this exhibit." },
      { status: invalid ? 400 : unavailable ? 503 : 502 },
    );
  }
}
