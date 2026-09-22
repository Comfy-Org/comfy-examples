import { NextResponse } from "next/server";
import { getRoomRemixJob } from "../../../../lib/comfy";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!/^[a-zA-Z0-9_-]{6,160}$/.test(id)) {
      return NextResponse.json({ error: "That room makeover job could not be found." }, { status: 400 });
    }
    return NextResponse.json(await getRoomRemixJob(id));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to check the room makeover." },
      { status: 502 },
    );
  }
}
