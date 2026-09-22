import { NextResponse } from "next/server";
import { getJob } from "../../../../lib/comfy";
import { isJobId } from "../../../../lib/job-state";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isJobId(id)) return NextResponse.json({ error: "Invalid job ID." }, { status: 400 });

  try {
    return NextResponse.json(await getJob(id));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "The review status is unavailable." },
      { status: 502 },
    );
  }
}
