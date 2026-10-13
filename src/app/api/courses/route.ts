import { NextRequest, NextResponse } from "next/server";
import { backendFetch, backendPayload } from "@/lib/backend-api";
import { mapBackendCourse } from "@/lib/backend-course-mapper";
import type { Course } from "@/types/course";

interface PayloadList {
  docs?: unknown[];
}

export async function GET(req: NextRequest) {
  const params = new URLSearchParams({ limit: "100", depth: "2", "where[status][equals]": "published" });
  const response = await backendFetch(req, `courses?${params}`);
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: { message?: string } } | null;
    return NextResponse.json(
      { message: body?.error?.message || "Courses are temporarily unavailable." },
      { status: response.status },
    );
  }

  const payload = await backendPayload<PayloadList>(response);
  const search = req.nextUrl.searchParams.get("search")?.toLowerCase().trim() || "";
  const category = req.nextUrl.searchParams.get("category") || "";
  const sort = req.nextUrl.searchParams.get("sort") || "newest";
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page")) || 1);
  const perPage = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get("per_page")) || 12));

  const allCourses = (payload.docs || []).map(mapBackendCourse).filter((course) => {
    const matchesSearch = !search || `${course.title} ${course.excerpt} ${course.description}`.toLowerCase().includes(search);
    const matchesCategory = !category || course.categories.some((item) => item.slug === category);
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sort === "price-asc") return a.price - b.price;
    if (sort === "price-desc") return b.price - a.price;
    if (sort === "popular") return b.totalStudents - a.totalStudents;
    if (sort === "rating") return b.rating.average - a.rating.average;
    return b.createdAt.localeCompare(a.createdAt);
  });

  const start = (page - 1) * perPage;
  const courses: Course[] = allCourses.slice(start, start + perPage);
  return NextResponse.json({
    courses,
    total: allCourses.length,
    totalPages: Math.max(1, Math.ceil(allCourses.length / perPage)),
    currentPage: page,
    perPage,
  });
}
