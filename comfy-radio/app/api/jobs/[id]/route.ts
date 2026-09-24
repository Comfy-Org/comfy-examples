import { NextResponse } from "next/server";
import { getBroadcast } from "../../../../lib/comfy";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return NextResponse.json(await getBroadcast(id));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "The broadcast status is unavailable." },
      { status: 502 },
    );
  }
}
