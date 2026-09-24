import { NextResponse } from "next/server";
import { getExhibitJob } from "../../../../lib/comfy";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id)) {
      return NextResponse.json({ error: "Invalid exhibit number." }, { status: 400 });
    }
    const job = await getExhibitJob(id);
    return NextResponse.json(job);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to check exhibit status." },
      { status: 502 },
    );
  }
}
