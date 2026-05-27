import { NextRequest, NextResponse } from "next/server";
import {
  fetchTutorCourses,
  findTutorCourseForProduct,
  isHiddenProduct,
  mapProductToCourse,
  wcHeaders,
  wcUrl,
  type WcProduct,
} from "@/lib/server-course-catalog";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const page = sp.get("page") || "1";
  const perPage = sp.get("per_page") || "12";
  const search = sp.get("search") || "";
  const sort = sp.get("sort") || "newest";
  const category = sp.get("category") || "";

  let orderby = "date";
  let order = "desc";
  if (sort === "popular") { orderby = "popularity"; order = "desc"; }
  else if (sort === "rating") { orderby = "rating"; order = "desc"; }
  else if (sort === "price-asc") { orderby = "price"; order = "asc"; }
  else if (sort === "price-desc") { orderby = "price"; order = "desc"; }

  const params: Record<string, string> = {
    status: "publish",
    page: "1",
    per_page: "100",
    orderby,
    order,
    search,
  };

  const res = await fetch(wcUrl("/products", params), {
    headers: wcHeaders(),
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    return NextResponse.json({ courses: [], total: 0, totalPages: 0, currentPage: 1 }, { status: 200 });
  }

  const products: WcProduct[] = await res.json();
  const tutorCourses = await fetchTutorCourses();
  const allCourses = products
    .filter((product) => !isHiddenProduct(product))
    .map((product) => mapProductToCourse(product, findTutorCourseForProduct(product, tutorCourses)))
    .filter((course) => !category || course.categories.some((cat) => cat.slug === category));

  const pageNumber = Math.max(1, parseInt(page));
  const pageSize = Math.max(1, parseInt(perPage));
  const start = (pageNumber - 1) * pageSize;
  const courses = allCourses.slice(start, start + pageSize);
  const total = allCourses.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return NextResponse.json({
    courses,
    total,
    totalPages,
    currentPage: pageNumber,
    perPage: pageSize,
  });
}
