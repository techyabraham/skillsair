import { NextResponse } from "next/server";
import {
  categoriesFromTutorCourses,
  fetchTutorCourses,
} from "@/lib/server-course-catalog";

export async function GET() {
  const categories = categoriesFromTutorCourses(await fetchTutorCourses());

  return NextResponse.json({
    categories,
    total: categories.length,
  });
}
