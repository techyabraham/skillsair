import type { Metadata } from "next";
import { CoursePlayer } from "@/components/dashboard/CoursePlayer";

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return { title: `Learning: ${params.slug.replace(/-/g, " ")}` };
}

export default function CourseLearnPage({ params }: PageProps) {
  return <CoursePlayer slug={params.slug} />;
}
