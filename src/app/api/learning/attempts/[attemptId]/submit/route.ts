import { NextRequest, NextResponse } from "next/server";
import { relayAssessment, validId } from "@/lib/assessment-relay";

/** Submits an attempt; the backend scores it (calling it twice returns the same result). */
export async function POST(req: NextRequest, { params }: { params: { attemptId: string } }) {
  if (!validId(params.attemptId)) return NextResponse.json({ message: "Attempt not found." }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as { answers?: Record<string, number[]> };
  return relayAssessment(req, `quiz-attempts/${params.attemptId}/submit`, { method: "POST", body: JSON.stringify(body.answers ? { answers: body.answers } : {}) });
}
