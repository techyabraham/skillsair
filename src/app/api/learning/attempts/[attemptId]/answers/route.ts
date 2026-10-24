import { NextRequest, NextResponse } from "next/server";
import { relayAssessment, validId } from "@/lib/assessment-relay";

/** Autosaves answers while an attempt is open. */
export async function PUT(req: NextRequest, { params }: { params: { attemptId: string } }) {
  if (!validId(params.attemptId)) return NextResponse.json({ message: "Attempt not found." }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as { answers?: Record<string, number[]> };
  return relayAssessment(req, `quiz-attempts/${params.attemptId}/answers`, { method: "PUT", body: JSON.stringify({ answers: body.answers ?? {} }) });
}
