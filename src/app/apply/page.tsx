import type { Metadata } from "next";
import { getSchools, type SchoolSummary } from "@/lib/catalog";
import { ApplyFlow } from "@/components/apply/ApplyFlow";
import { WhatsAppTextLink } from "@/components/marketing/WhatsAppButton";

export const metadata: Metadata = {
  title: "Apply for a scholarship seat",
  description: "Apply in 60 seconds to see your SkillsAir Access Scholarship offer.",
};

export const revalidate = 300;

export default async function ApplyPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  let schools: SchoolSummary[] = [];
  try {
    schools = await getSchools();
  } catch {
    schools = [];
  }
  const param = (key: string) => (typeof searchParams[key] === "string" ? (searchParams[key] as string) : "");

  if (!schools.length) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-heading font-bold text-neutral-900">Applications are briefly unavailable</h1>
        <p className="mt-3 text-neutral-600">We couldn&apos;t load our schools just now. Please try again in a minute, or message us and we&apos;ll help you apply.</p>
        <div className="mt-6 flex justify-center">
          <WhatsAppTextLink />
        </div>
      </div>
    );
  }

  return <ApplyFlow schools={schools} initialSchool={param("school")} initialProgramme={param("programme")} />;
}
