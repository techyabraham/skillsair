import { NextRequest, NextResponse } from "next/server";
import { backendFetch, backendPayload } from "@/lib/backend-api";
import { mapBackendCourse } from "@/lib/backend-course-mapper";

interface PayloadList {
  docs?: unknown[];
}

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const query = new URLSearchParams({ limit: "1", depth: "2", "where[slug][equals]": params.slug });
  const response = await backendFetch(req, `courses?${query}`);
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: { message?: string } } | null;
    return NextResponse.json({ message: body?.error?.message || "Course service is unavailable." }, { status: response.status });
  }
  const payload = await backendPayload<PayloadList>(response);
  const course = payload.docs?.[0];
  if (!course) return NextResponse.json({ message: "Course not found" }, { status: 404 });

  const courseId = Number((course as { id?: number }).id);
  const curriculumResponse = await backendFetch(req, `courses/${encodeURIComponent(String(courseId))}/curriculum`);
  if (!curriculumResponse.ok) {
    // Keep course details available while an older backend is waiting for the
    // custom curriculum endpoint deployment. Its embedded sections may still
    // be populated by Payload's normal relationship depth.
    if (curriculumResponse.status === 404) {
      return NextResponse.json(mapBackendCourse(course));
    }
    const body = await curriculumResponse.json().catch(() => null) as { error?: { message?: string }; message?: string } | null;
    return NextResponse.json(
      { message: body?.error?.message || body?.message || "Unable to load course curriculum." },
      { status: curriculumResponse.status },
    );
  }
  const curriculumPayload = await backendPayload<{ sections?: unknown[] }>(curriculumResponse);
  return NextResponse.json(mapBackendCourse({
    ...(course as Record<string, unknown>),
    sections: curriculumPayload.sections || [],
  }));
}
