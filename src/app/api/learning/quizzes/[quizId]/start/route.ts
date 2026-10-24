import { NextRequest, NextResponse } from "next/server";
import { relayAssessment, validId } from "@/lib/assessment-relay";

/** Starts (or resumes) a quiz or exam attempt; questions come without answers. */
export async function POST(req: NextRequest, { params }: { params: { quizId: string } }) {
  if (!validId(params.quizId)) return NextResponse.json({ message: "Quiz not found." }, { status: 404 });
  return relayAssessment(req, `quizzes/${params.quizId}/start`, { method: "POST", body: "{}" });
}
