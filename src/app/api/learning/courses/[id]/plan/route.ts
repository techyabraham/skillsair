import { NextRequest, NextResponse } from "next/server";
import { relayLearning, validId } from "@/lib/learning-relay";

/** The learner's guided 12-week plan for a programme, with their progress. */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!validId(params.id)) return NextResponse.json({ message: "Programme not found." }, { status: 404 });
  return relayLearning(req, `courses/${params.id}/plan`);
}

/** Guided plan or self-paced: { pace: "guided" | "self_paced" }. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!validId(params.id)) return NextResponse.json({ message: "Programme not found." }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as { pace?: unknown };
  if (body.pace !== "guided" && body.pace !== "self_paced") return NextResponse.json({ message: "Choose the guided plan or self-paced.", code: "VALIDATION_ERROR" }, { status: 400 });
  return relayLearning(req, `courses/${params.id}/plan`, { method: "PATCH", body: JSON.stringify({ pace: body.pace }) });
}
