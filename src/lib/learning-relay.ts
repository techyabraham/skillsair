import { NextRequest, NextResponse } from "next/server";
import { relayAssessment, validId } from "@/lib/assessment-relay";
import { guidedPlanOn } from "@/content/site";

/**
 * Relays a learning-plan call to the backend (same auth and error handling as assessments).
 * With NEXT_PUBLIC_GUIDED_PLAN=false it answers 404 FEATURE_DISABLED without calling the backend.
 */
export async function relayLearning(req: NextRequest, path: string, init: RequestInit = {}) {
  if (!guidedPlanOn) return NextResponse.json({ message: "The learning plan is not available.", code: "FEATURE_DISABLED" }, { status: 404 });
  return relayAssessment(req, path, init);
}

export { validId };
