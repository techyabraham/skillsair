import type { Metadata } from "next";
import { Section } from "@/components/marketing/Section";
import { SchoolCard } from "@/components/marketing/SchoolCard";
import { PrimaryCTA } from "@/components/marketing/PrimaryCTA";
import { getSchools, type SchoolSummary } from "@/lib/catalog";
import { getScholarshipWindow } from "@/lib/scholarship";

export const metadata: Metadata = {
  title: "Tech schools: AI, data, design, engineering, security and more",
  description: "Pick the tech career you want to build. Every SkillsAir school is beginner-friendly and self-paced, and ends with a verifiable certificate and internship access.",
  alternates: { canonical: "/schools" },
};

export const revalidate = 300;

export default async function SchoolsPage() {
  const [schools, scholarship] = await Promise.all([getSchools().catch((): SchoolSummary[] => []), getScholarshipWindow()]);
  return (
    <Section
      level={1}
        title={<>Pick the career you want to build</>}
      intro={<p>Every school is beginner-friendly and self-paced, and ends with a verifiable certificate and internship access.</p>}
    >
      {schools.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {schools.map((school) => (
            <SchoolCard key={school.slug} slug={school.slug} name={school.name} oneLiner={school.oneLiner} programmeCount={school.programmes.length} scholarshipOpen={scholarship.isOpen} />
          ))}
        </div>
      ) : (
        <p className="text-neutral-600">Our schools are loading slowly right now. Please refresh in a minute.</p>
      )}
      <div className="mt-10">
        <PrimaryCTA href="/apply" block>Apply for a scholarship seat →</PrimaryCTA>
      </div>
    </Section>
  );
}
