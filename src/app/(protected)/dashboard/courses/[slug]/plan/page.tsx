import type { Metadata } from "next";
import { PlanPage } from "@/components/dashboard/PlanPage";

interface PageProps {
  params: { slug: string };
}

export const metadata: Metadata = { title: "My weekly plan", robots: { index: false, follow: false } };

export default function CoursePlanPage({ params }: PageProps) {
  return <PlanPage slug={params.slug} />;
}
