import { NextRequest, NextResponse } from "next/server";
import { fetchTutorCurriculum, type TutorProductLink } from "@/lib/tutor-curriculum";
import {
  fetchTutorCourses,
  findTutorCourseForProduct,
  mapProductToCourse,
  normalizeCourseSlug,
  wcHeaders,
  wcUrl,
  type WcProduct,
} from "@/lib/server-course-catalog";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const res = await fetch(
    wcUrl("/products", { slug: normalizeCourseSlug(params.slug), status: "publish" }),
    {
      headers: wcHeaders(),
      next: { revalidate: 60 },
    }
  );

  if (!res.ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const products = (await res.json()) as WcProduct[];
  const p = Array.isArray(products) ? products[0] : products;

  if (!p) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const tutorCourses = await fetchTutorCourses();
  const tutorCourse = findTutorCourseForProduct(p, tutorCourses);
  const curriculum = await fetchTutorCurriculum(p as TutorProductLink);
  const course = mapProductToCourse(p, tutorCourse);

  return NextResponse.json({
    ...course,
    duration: curriculum.reduce((sum, section) => sum + section.totalDuration, 0),
    totalLessons: curriculum.reduce((sum, section) => sum + section.lessons.length, 0),
    totalSections: curriculum.length,
    instructor: {
      ...course.instructor,
      name: "SkillsAir Instructor",
      totalStudents: p.total_sales || 0,
    },
    curriculum,
    requirements: ["Basic computer literacy", "Internet connection", "Willingness to learn"],
    outcomes: ["Practical, job-ready skills", "Industry-recognized certificate", "Project portfolio"],
    targetAudience: ["Beginners and career changers", "Professionals upskilling", "Entrepreneurs"],
    includes: {
      videoHours: 20,
      articles: 5,
      downloadableResources: 10,
      fullLifetimeAccess: true,
      certificate: true,
      mobileAccess: true,
    },
  });
}
