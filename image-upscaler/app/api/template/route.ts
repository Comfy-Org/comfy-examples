import { NextResponse } from "next/server";
import { publicAppTemplate } from "../../../lib/app-template";

export function GET() {
  return NextResponse.json(publicAppTemplate());
}
