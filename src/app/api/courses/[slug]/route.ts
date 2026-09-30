import { NextRequest, NextResponse } from "next/server";
import { fetchTutorCurriculum, type TutorProductLink } from "@/lib/tutor-curriculum";
import {
  fetchTutorCourses,
  fetchPublishedProducts,
  findTutorCourseForProduct,
  mapProductToCourse,
  normalizeCourseSlug,
} from "@/lib/server-course-catalog";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const products = await fetchPublishedProducts({ slug: normalizeCourseSlug(params.slug) });
  if (!products) {
    return NextResponse.json({ message: "Course is temporarily unavailable." }, { status: 502 });
  }
  const p = products.find((product) => product.slug === normalizeCourseSlug(params.slug));

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
