import { NextRequest, NextResponse } from "next/server";
import { backendFetch, backendPayload } from "@/lib/backend-api";

interface QuizQuestionRecord {
  id: number;
  prompt?: string;
  options?: Array<string | { text?: string }>;
}

interface QuizRecord {
  id: number;
  title?: string;
  passingScore?: number;
  isPublished?: boolean;
  questions?: QuizQuestionRecord[];
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!/^\d+$/.test(params.id)) {
    return NextResponse.json({ message: "Invalid course id." }, { status: 400 });
  }

  const query = new URLSearchParams({
    depth: "2",
    limit: "100",
    sort: "createdAt",
    "where[course][equals]": params.id,
    "where[isPublished][equals]": "true",
  });
  const response = await backendFetch(req, `quizzes?${query}`);
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: { message?: string }; message?: string } | null;
    return NextResponse.json(
      { message: body?.error?.message || body?.message || "Unable to load course quizzes." },
      { status: response.status },
    );
  }

  const payload = await backendPayload<{ docs?: QuizRecord[] }>(response);
  const quizzes = (payload.docs || []).map((quiz) => ({
    id: quiz.id,
    title: quiz.title || "Course quiz",
    passingScore: Number(quiz.passingScore ?? 70),
    questions: (quiz.questions || []).map((question) => ({
      id: question.id,
      prompt: question.prompt || "",
      options: (question.options || []).map((option) => typeof option === "string" ? option : option.text || ""),
    })),
  }));

  return NextResponse.json(quizzes);
}
