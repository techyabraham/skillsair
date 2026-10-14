import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-api";

export async function POST(req: NextRequest, { params }: { params: { quizId: string } }) {
  const body = await req.json().catch(() => null) as { answers?: Array<{ questionId: number; optionIndex: number }> } | null;
  if (!/^\d+$/.test(params.quizId) || !Array.isArray(body?.answers)) {
    return NextResponse.json({ message: "Invalid quiz submission." }, { status: 400 });
  }

  const response = await backendFetch(req, `quizzes/${encodeURIComponent(params.quizId)}/submit`, {
    method: "POST",
    body: JSON.stringify({ answers: body.answers }),
  });
  const payload = await response.json().catch(() => ({}));
  return NextResponse.json(payload, { status: response.status });
}
