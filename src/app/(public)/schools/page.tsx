import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/marketing/Section";
import { FAQAccordion } from "@/components/marketing/FAQAccordion";
import { SchoolIcon, shortSchoolName } from "@/components/marketing/SchoolIcon";
import { FounderNote, HowItWorks, LandingHero, ScholarshipBand, WhySkillsAir } from "@/components/marketing/Landing";
import { getSchools, type SchoolSummary } from "@/lib/catalog";
import { getScholarshipWindow } from "@/lib/scholarship";
import { formatShortDate } from "@/lib/offer";
import { faqs } from "@/content/faq";
import { schoolCopy } from "@/content/schools";

export const metadata: Metadata = {
  title: "Tech schools: AI, data, design, engineering, security and more",
  description:
    "Ten schools, one goal: get you working in tech. Beginner-friendly, self-paced programmes that end with a verifiable certificate and internship access. Apply in 60 seconds.",
  alternates: { canonical: "/schools" },
};

export const revalidate = 300;

export default async function SchoolsPage() {
  const [schools, scholarship] = await Promise.all([getSchools().catch((): SchoolSummary[] => []), getScholarshipWindow()]);
  const open = schools.filter((school) => school.programmes.length > 0);
  const soon = schools.filter((school) => school.programmes.length === 0);
  // A programme can sit in two schools (UI/UX in Design and Products); count it once.
  const programmeCount = new Set(open.flatMap((school) => school.programmes.map((programme) => programme.slug))).size;
  const schoolsFaqs = faqs.filter((faq) => ["beginner", "phone", "how-long", "certificate"].includes(faq.id));

  return (
    <>
      <LandingHero
        eyebrow="SkillsAir schools"
        title={
          <>
            {schools.length === 10 ? "Ten schools." : "Our schools."} <span className="text-accent">One goal: get you working in tech.</span>
          </>
        }
        intro={
          <p>
            Pick the career you want to build. Every programme is beginner-friendly and self-paced, and ends with a certificate employers can verify and access to internship openings.
          </p>
        }
        primary={{ href: "/apply", label: "Apply for a scholarship seat →" }}
        secondary={{ href: "/quiz", label: "Not sure? Take the 2-minute quiz" }}
        note={
          scholarship.isOpen
            ? `Access Scholarship open until ${formatShortDate(scholarship.closesAt)} · Free to apply · Takes 60 seconds`
            : "Free to apply · Takes 60 seconds · Beginners welcome"
        }
      />

      <section className="bg-white py-16 md:py-24">
        <div className="container-wide">
          {schools.length === 0 ? (
            <p className="text-neutral-600">Our schools are loading slowly right now. Please refresh in a minute.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="eyebrow">Open now</p>
                  <h2 className="mt-3 text-[1.75rem] font-bold leading-[1.15] text-navy md:text-[2.5rem]">Start learning this week</h2>
                </div>
                {programmeCount > 0 && <p className="text-neutral-600">{programmeCount} programmes across {open.length} schools</p>}
              </div>
              <ul className="mt-10 grid gap-5 md:grid-cols-2">
                {open.map((school) => {
                  const copy = schoolCopy(school.name);
                  return (
                    <li key={school.slug}>
                      <Link
                        href={`/schools/${school.slug}`}
                        className="group flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-navy hover:shadow-card md:p-7"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy text-white">
                            <SchoolIcon name={school.name} className="h-6 w-6" />
                          </span>
                          {scholarship.isOpen && <span className="rounded-full bg-success-light px-2.5 py-1 text-xs font-semibold text-success-dark">Scholarship open</span>}
                        </div>
                        <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-neutral-500">School of</p>
                        <h3 className="text-2xl font-bold text-navy">{shortSchoolName(school.name)}</h3>
                        <p className="mt-2 text-neutral-700">{copy.headline}.</p>
                        <ul className="mt-5 flex flex-wrap gap-2">
                          {school.programmes.slice(0, 4).map((programme) => (
                            <li key={programme.slug} className="rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-700">
                              {programme.title}
                            </li>
                          ))}
                          {school.programmes.length > 4 && <li className="rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-700">+{school.programmes.length - 4} more</li>}
                        </ul>
                        <span className="mt-6 font-semibold text-accent-700">Explore the school →</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {soon.length > 0 && (
                <div className="mt-14">
                  <p className="eyebrow">Opening soon</p>
                  <h2 className="mt-3 text-[1.5rem] font-bold text-navy md:text-[2rem]">Join the waitlist and hear first</h2>
                  <ul className="mt-8 grid gap-4 sm:grid-cols-3">
                    {soon.map((school) => (
                      <li key={school.slug}>
                        <Link href={`/schools/${school.slug}`} className="flex h-full items-start gap-4 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-5 transition-colors hover:border-navy">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-navy ring-1 ring-neutral-200">
                            <SchoolIcon name={school.name} className="h-5 w-5" />
                          </span>
                          <span>
                            <span className="block font-bold text-navy">{school.name}</span>
                            <span className="mt-1 block text-sm text-neutral-600">{school.oneLiner}</span>
                            <span className="mt-2 block text-sm font-semibold text-accent-700">Join the waitlist →</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <section className="bg-neutral-50 py-14">
        <div className="container-wide flex flex-col items-start gap-5 rounded-2xl bg-white p-6 ring-1 ring-neutral-200 md:flex-row md:items-center md:justify-between md:p-8">
          <div>
            <h2 className="text-xl font-bold text-navy md:text-2xl">Not sure which school fits you?</h2>
            <p className="mt-1 text-neutral-700">Answer 8 quick questions and we&apos;ll suggest where to start. It takes about 2 minutes.</p>
          </div>
          <Link href="/quiz" className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl border-2 border-navy px-6 font-semibold text-navy hover:bg-navy hover:text-white">
            Take the Career Match quiz →
          </Link>
        </div>
      </section>

      <HowItWorks applyHref="/apply" />
      <WhySkillsAir tone="muted" />
      <FounderNote />
      <ScholarshipBand isOpen={scholarship.isOpen} closesAt={scholarship.closesAt} applyHref="/apply" />

      <Section title="Questions">
        <div className="max-w-3xl"><FAQAccordion items={schoolsFaqs} /></div>
      </Section>
    </>
  );
}
