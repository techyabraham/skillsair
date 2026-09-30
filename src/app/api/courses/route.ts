import { NextRequest, NextResponse } from "next/server";
import {
  fetchTutorCourses,
  fetchPublishedProducts,
  findTutorCourseForProduct,
  isHiddenProduct,
  mapProductToCourse,
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

  const products = await fetchPublishedProducts({ orderby, order, search });
  if (!products) {
    return NextResponse.json({ message: "Courses are temporarily unavailable." }, { status: 502 });
  }
  const tutorCourses = await fetchTutorCourses();
  const allCourses = products
    .filter((product) => !isHiddenProduct(product))
    .map((product) => mapProductToCourse(product, findTutorCourseForProduct(product, tutorCourses)))
    .filter((course) => !category || course.categories.some((cat) => cat.slug === category))
    .sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "popular") return b.totalStudents - a.totalStudents;
      if (sort === "rating") return b.rating.average - a.rating.average;
      return b.createdAt.localeCompare(a.createdAt);
    });

  const pageNumber = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(perPage) || 12));
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
