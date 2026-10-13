import { NextRequest, NextResponse } from "next/server";
import { backendFetch, backendPayload } from "@/lib/backend-api";
import { mapBackendCourse } from "@/lib/backend-course-mapper";

interface PayloadList {
  docs?: unknown[];
}

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const query = new URLSearchParams({ limit: "1", depth: "3", "where[slug][equals]": params.slug });
  const response = await backendFetch(req, `courses?${query}`);
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: { message?: string } } | null;
    return NextResponse.json({ message: body?.error?.message || "Course service is unavailable." }, { status: response.status });
  }
  const payload = await backendPayload<PayloadList>(response);
  const course = payload.docs?.[0];
  if (!course) return NextResponse.json({ message: "Course not found" }, { status: 404 });
  return NextResponse.json(mapBackendCourse(course));
}
