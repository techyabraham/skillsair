import { NextRequest, NextResponse } from "next/server";
import { relayLearning, validId } from "@/lib/learning-relay";

/** "Move my plan": the first unfinished step's week becomes this week (once every 14 days). */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!validId(params.id)) return NextResponse.json({ message: "Programme not found." }, { status: 404 });
  return relayLearning(req, `courses/${params.id}/plan/reset`, { method: "POST", body: "{}" });
}
