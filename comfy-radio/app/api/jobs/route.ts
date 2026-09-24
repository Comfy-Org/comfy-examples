import { NextResponse } from "next/server";
import { submitBroadcast } from "../../../lib/comfy";
import { getStation } from "../../../lib/stations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a station and a prompt." }, { status: 400 });
  }

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Send a station and a prompt." }, { status: 400 });
  }

  const { stationId, prompt } = payload as { stationId?: unknown; prompt?: unknown };
  if (!getStation(stationId)) {
    return NextResponse.json({ error: "Choose one of the five radio stations." }, { status: 400 });
  }
  if (typeof prompt !== "string" || prompt.trim().length < 8 || prompt.length > 500) {
    return NextResponse.json({ error: "Keep your music prompt between 8 and 500 characters." }, { status: 400 });
  }

  try {
    return NextResponse.json(await submitBroadcast(stationId as string, prompt), { status: 202 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "The broadcast could not be generated." },
      { status: error instanceof Error && (error.message.includes("COMFY_API_KEY") || error.message.includes("API key")) ? 503 : 502 },
    );
  }
}
