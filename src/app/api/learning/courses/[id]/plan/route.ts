import { NextRequest, NextResponse } from "next/server";
import { relayLearning, validId } from "@/lib/learning-relay";

/** One week of the learner's guided plan (the current week, or ?week=N), with their progress. */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!validId(params.id)) return NextResponse.json({ message: "Programme not found." }, { status: 404 });
  const week = req.nextUrl.searchParams.get("week");
  return relayLearning(req, `courses/${params.id}/plan${week && validId(week) ? `?week=${week}` : ""}`);
}

/** The guided plan or chapter view: { pace: "guided" | "chapters" }. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!validId(params.id)) return NextResponse.json({ message: "Programme not found." }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as { pace?: unknown };
  if (body.pace !== "guided" && body.pace !== "chapters") return NextResponse.json({ message: "Choose the guided plan or chapter view.", code: "VALIDATION_ERROR" }, { status: 400 });
  return relayLearning(req, `courses/${params.id}/plan`, { method: "PATCH", body: JSON.stringify({ pace: body.pace }) });
}
