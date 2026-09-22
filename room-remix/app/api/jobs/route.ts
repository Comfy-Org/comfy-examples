import { NextResponse } from "next/server";
import { submitRoomRemix } from "../../../lib/comfy";
import { isStyleName, parseFurniture } from "../../../lib/room-design";

export const runtime = "nodejs";

const acceptedTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const maxImageBytes = 10 * 1024 * 1024;

class InvalidRequest extends Error {}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const image = form.get("image");
    const style = form.get("style");
    const rawFurniture = form.get("furniture");

    if (!(image instanceof File) || image.size === 0) throw new InvalidRequest("Choose a room photo first.");
    if (!acceptedTypes.has(image.type)) throw new InvalidRequest("Use a PNG, JPEG, or WebP room photo.");
    if (image.size > maxImageBytes) throw new InvalidRequest("Keep room photos under 10 MB.");
    if (!isStyleName(style)) throw new InvalidRequest("Choose one of the available room styles.");
    if (typeof rawFurniture !== "string" || rawFurniture.length > 4_000) throw new InvalidRequest("The furniture layout could not be read.");

    let furniture;
    try {
      furniture = parseFurniture(JSON.parse(rawFurniture));
    } catch {
      throw new InvalidRequest("The furniture layout could not be read.");
    }
    if (!furniture) throw new InvalidRequest("The furniture layout contains an unsupported item or position.");

    return NextResponse.json(await submitRoomRemix(image, style, furniture), { status: 202 });
  } catch (error) {
    const invalid = error instanceof InvalidRequest;
    const message = error instanceof Error ? error.message : "Unable to submit this room makeover.";
    const unavailable = message.includes("COMFY_API_KEY") || message.includes("API key");
    return NextResponse.json({ error: message }, { status: invalid ? 400 : unavailable ? 503 : 502 });
  }
}
