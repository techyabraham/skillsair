import { Suspense } from "react";
import type { Metadata } from "next";
import { PlanPage } from "@/components/dashboard/PlanPage";

interface PageProps {
  params: { slug: string };
}

export const metadata: Metadata = { title: "This week's plan", robots: { index: false, follow: false } };

export default function CoursePlanPage({ params }: PageProps) {
  // PlanPage reads ?week=N (the week arrows).
  return (
    <Suspense>
      <PlanPage slug={params.slug} />
    </Suspense>
  );
}
