import { NextRequest, NextResponse } from "next/server";
import { backendFetch, backendPayload } from "@/lib/backend-api";

interface PayloadCourse { id: number }
interface PayloadReview {
  id: number;
  rating?: number;
  body?: string;
  createdAt?: string;
  student?: { id?: number; firstName?: string; lastName?: string; name?: string; avatar?: { url?: string } };
}

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const courseQuery = new URLSearchParams({ limit: "1", depth: "0", "where[slug][equals]": params.slug });
  const courseResponse = await backendFetch(req, `courses?${courseQuery}`);
  if (!courseResponse.ok) return NextResponse.json({ message: "Unable to find course reviews." }, { status: courseResponse.status });
  const coursePayload = await backendPayload<{ docs?: PayloadCourse[] }>(courseResponse);
  const course = coursePayload.docs?.[0];
  if (!course) return NextResponse.json({ message: "Course not found." }, { status: 404 });

  const reviewQuery = new URLSearchParams({
    limit: "100",
    depth: "1",
    sort: "-createdAt",
    "where[course][equals]": String(course.id),
  });
  const reviewResponse = await backendFetch(req, `reviews?${reviewQuery}`);
  if (!reviewResponse.ok) {
    const body = await reviewResponse.json().catch(() => null) as { error?: { message?: string }; message?: string } | null;
    return NextResponse.json({ message: body?.error?.message || body?.message || "Unable to load reviews." }, { status: reviewResponse.status });
  }

  const reviewPayload = await backendPayload<{ docs?: PayloadReview[] }>(reviewResponse);
  return NextResponse.json((reviewPayload.docs || []).map((review) => {
    const student = review.student || {};
    return {
      id: review.id,
      rating: Number(review.rating || 0),
      content: review.body || "",
      createdAt: review.createdAt || "",
      author: {
        id: Number(student.id || 0),
        name: `${student.firstName || ""} ${student.lastName || ""}`.trim() || student.name || "Student",
        avatar: student.avatar?.url || "",
      },
    };
  }));
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const courseQuery = new URLSearchParams({ limit: "1", depth: "0", "where[slug][equals]": params.slug });
  const courseResponse = await backendFetch(req, `courses?${courseQuery}`);
  if (!courseResponse.ok) return NextResponse.json({ message: "Unable to find course." }, { status: courseResponse.status });
  const coursePayload = await backendPayload<{ docs?: PayloadCourse[] }>(courseResponse);
  const course = coursePayload.docs?.[0];
  if (!course) return NextResponse.json({ message: "Course not found." }, { status: 404 });

  const body = await req.json().catch(() => null) as { rating?: number; body?: string } | null;
  const response = await backendFetch(req, `courses/${course.id}/reviews`, {
    method: "POST",
    body: JSON.stringify(body || {}),
  });
  const payload = await response.json().catch(() => ({}));
  return NextResponse.json(payload, { status: response.status });
}
