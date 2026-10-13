import { NextRequest, NextResponse } from "next/server";
import { backendFetch, backendPayload } from "@/lib/backend-api";
import { mapBackendCourse } from "@/lib/backend-course-mapper";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const response = await backendFetch(req, `courses/${encodeURIComponent(params.id)}?depth=3`);
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: { message?: string } } | null;
    return NextResponse.json({ message: body?.error?.message || "Unable to load course outline." }, { status: response.status });
  }
  const course = await backendPayload<unknown>(response);
  return NextResponse.json(mapBackendCourse(course).curriculum);
}
