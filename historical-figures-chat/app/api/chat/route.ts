import { NextResponse } from "next/server";
import { submitConversation } from "../../../lib/comfy";
import { findFigure } from "../../../lib/figures";

export const runtime = "nodejs";

type Message = { role: "user"; content: string };

function validateMessages(value: unknown): asserts value is Message[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 12) throw new Error("Send between 1 and 12 messages.");
  for (const message of value) {
    if (!message || message.role !== "user" || typeof message.content !== "string" || !message.content.trim() || message.content.length > 1_000) {
      throw new Error("Each message must be a short user message.");
    }
  }
}

export async function POST(request: Request) {
  let body: { figureId?: unknown; messages?: unknown };
  try {
    body = await request.json() as typeof body;
  } catch {
    return NextResponse.json({ error: "Send a valid JSON request." }, { status: 400 });
  }

  let figure;
  try {
    if (typeof body.figureId !== "string") throw new Error("Choose a historical figure.");
    figure = findFigure(body.figureId);
    if (!figure) throw new Error("That historical figure is unavailable.");
    validateMessages(body.messages);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to submit conversation." }, { status: 400 });
  }

  try {
    const job = await submitConversation(figure, body.messages);
    return NextResponse.json(job, { status: 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit conversation.";
    return NextResponse.json({ error: message }, { status: message.includes("COMFY_API_KEY") || message.includes("API key") ? 503 : 502 });
  }
}
