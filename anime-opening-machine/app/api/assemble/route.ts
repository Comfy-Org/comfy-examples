import { NextResponse } from "next/server";
import { assembleLoop } from "../../../lib/comfy";
import { InvalidRequest } from "../../../lib/upload-validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let jobIds: unknown;
  try {
    const body = await request.json() as { jobIds?: unknown[] };
    if (!Array.isArray(body.jobIds) || body.jobIds.length < 2 || body.jobIds.length > 4 || body.jobIds.some((id) => typeof id !== "string" || !/^[\w-]{1,128}$/.test(id))) {
      throw new InvalidRequest("Choose 2 to 4 completed animation clips to assemble.");
    }
    jobIds = body.jobIds;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Send valid animation job IDs." }, { status: 400 });
  }

  try {
    return NextResponse.json(await assembleLoop(jobIds as string[]), { status: 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to assemble the loop.";
    const unavailable = message.includes("COMFY_API_KEY") || message.includes("API key");
    return NextResponse.json({ error: message }, { status: unavailable ? 503 : 502 });
  }
}
