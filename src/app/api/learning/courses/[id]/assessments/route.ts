import { NextRequest, NextResponse } from "next/server";
import { relayAssessment, validId } from "@/lib/assessment-relay";

/** The learner's chapter quizzes, knowledge checks and final exam for a programme. */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!validId(params.id)) return NextResponse.json({ message: "Programme not found." }, { status: 404 });
  return relayAssessment(req, `courses/${params.id}/assessments`);
}
