import type { Metadata } from "next";
import { FinalExamPage } from "@/components/assessment/FinalExamPage";

interface PageProps {
  params: { slug: string };
}

export const metadata: Metadata = { title: "Final exam", robots: { index: false, follow: false } };

export default function CourseExamPage({ params }: PageProps) {
  return <FinalExamPage slug={params.slug} />;
}
