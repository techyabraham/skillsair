import type { Metadata } from "next";
import { SingleCoursePage } from "@/components/course/SingleCoursePage";

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: `Course | ${params.slug.replace(/-/g, " ")} | SkillsAir`,
    description: "Learn from expert instructors with hands-on projects and earn a certificate.",
    openGraph: {
      type: "website",
      title: `${params.slug.replace(/-/g, " ")} — SkillsAir`,
    },
  };
}

export default function CourseDetailPage({ params }: PageProps) {
  return <SingleCoursePage slug={params.slug} />;
}
