import { NextResponse } from "next/server";
import { getProfileBundle } from "../../../../lib/comfy";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return NextResponse.json(await getProfileBundle(id), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to check your portraits.";
    return NextResponse.json({ error: message }, { status: message.includes("link is invalid") ? 400 : 502 });
  }
}
