import { NextResponse } from "next/server";
import { getJob } from "../../../../lib/comfy";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    return NextResponse.json(await getJob((await params).id));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to check the video." }, { status: 400 });
  }
}
