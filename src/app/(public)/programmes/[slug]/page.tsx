import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Section } from "@/components/marketing/Section";
import { FAQAccordion } from "@/components/marketing/FAQAccordion";
import { RequirementsList } from "@/components/marketing/RequirementsList";
import { TrackEvent } from "@/components/analytics/TrackEvent";
import { ProgrammeActions, PreviewCurriculum, WatchPreviewButton } from "@/components/programme/ProgrammeClient";
import { SoftCapture } from "@/components/programme/SoftCapture";
import { AdirePattern } from "@/components/marketing/AdirePattern";
import { getProgramme } from "@/lib/programme";
import { getScholarshipWindow } from "@/lib/scholarship";
import { formatShortDate } from "@/lib/offer";
import { faqs } from "@/content/faq";
import { site } from "@/content/site";
import { schoolCopy } from "@/content/schools";
import { getSchools, type SchoolSummary } from "@/lib/catalog";
import { SchoolIcon } from "@/components/marketing/SchoolIcon";
import { AtAGlance, HowItWorks, ScholarshipBand, WhySkillsAir } from "@/components/marketing/Landing";

// Cached and refreshed every 5 minutes (ISR); enrolment state loads client-side.
export const revalidate = 300;

const LEVELS: Record<string, string> = { beginner: "Beginner-friendly", all: "All levels", intermediate: "Intermediate", advanced: "Advanced" };

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const result = await getProgramme(params.slug);
  if (result.status !== "ok") return { title: "Programme" };
  const { course } = result.programme;
  return {
    title: `${course.title} course in Nigeria: self-paced, with a verifiable certificate`,
    description: course.excerpt.slice(0, 155) || `Learn ${course.title} at your own pace and earn a verifiable certificate. Apply in 60 seconds.`,
    alternates: { canonical: `/programmes/${course.slug}` },
  };
}

export default async function ProgrammePage({ params }: { params: { slug: string } }) {
  const result = await getProgramme(params.slug);
  if (result.status === "missing") notFound();
  if (result.status === "unavailable") {
    return <Section title="This programme is loading slowly" intro={<p>We couldn&apos;t load it just now. Please refresh in a minute, or message us on WhatsApp.</p>} />;
  }
  const { programme } = result;
  const { course } = programme;
  const scholarship = await getScholarshipWindow();
  const applyLabel = "Apply for this programme →";
  const applyHref = `/apply?programme=${encodeURIComponent(course.slug)}`;
  const copy = schoolCopy(programme.school?.name ?? "");
  const whoFor = programme.whoFor.length ? programme.whoFor : copy.whoFor;
  const projectsList = programme.projects;
  const schools = await getSchools().catch((): SchoolSummary[] => []);
  const siblings = (schools.find((school) => school.slug === programme.school?.slug)?.programmes ?? []).filter((item) => item.slug !== course.slug).slice(0, 3);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://skillsair.com";
  const programmeFaqs = faqs.filter((faq) => ["beginner", "phone", "start", "how-long", "certificate", "refunds"].includes(faq.id));
  const showSlots = process.env.NODE_ENV !== "production";

  const courseJsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.excerpt || course.description.slice(0, 300),
    provider: { "@type": "Organization", name: site.brand, legalName: site.legalName, sameAs: siteUrl },
    inLanguage: "en",
    hasCourseInstance: { "@type": "CourseInstance", courseMode: "online", courseWorkload: `PT${programme.weeklyHours}H` },
  };
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Schools", item: `${siteUrl}/schools` },
      ...(programme.school ? [{ "@type": "ListItem", position: 2, name: programme.school.name, item: `${siteUrl}/schools/${programme.school.slug}` }] : []),
      { "@type": "ListItem", position: programme.school ? 3 : 2, name: course.title },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([courseJsonLd, breadcrumbs]) }} />
      <TrackEvent event="view_programme" params={{ programme: course.slug }} />

      {/* Hero: the promise, the facts and the two actions, on navy over the adire pattern. */}
      <section className="relative overflow-hidden border-t border-primary-800 bg-navy text-white">
        <AdirePattern opacity={0.45} />
        <div className="container-wide relative grid gap-10 py-14 md:py-20 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center lg:gap-14">
          <div className="flex flex-col gap-5">
            {programme.school && (
              <Link href={`/schools/${programme.school.slug}`} className="w-fit text-sm font-medium text-neutral-300 hover:text-white hover:underline">
                ← {programme.school.name}
              </Link>
            )}
            <p className="eyebrow flex items-center gap-2.5 text-accent-300">
              {programme.school && (
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white">
                  <SchoolIcon name={programme.school.name} className="h-5 w-5" />
                </span>
              )}
              Programme
            </p>
            <h1 className="max-w-3xl text-[2.25rem] font-bold leading-[1.05] tracking-[-0.025em] text-white md:text-[3.5rem]">{course.title}</h1>
            <p className="max-w-2xl text-lg text-neutral-300 md:text-xl">{course.excerpt || copy.pitch}</p>
            <ul className="flex flex-wrap gap-2 text-sm">
              {[
                "Self-paced",
                `Designed to take about ${programme.durationMonths} months`,
                `~${programme.weeklyHours} hrs/week`,
                "Verifiable certificate",
                ...(programme.phoneFriendly ? ["📱 Phone-friendly"] : []),
              ].map((fact) => (
                <li key={fact} className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5">{fact}</li>
              ))}
            </ul>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <ProgrammeActions slug={course.slug} courseId={course.id} applyLabel={applyLabel} />
              {programme.previewLessonId && <WatchPreviewButton />}
            </div>
            <p className="text-sm text-neutral-300">Free to apply · Takes 60 seconds · Watch a free lesson first</p>
          </div>
          <AtAGlance
            items={[
              { label: "Format", value: "Online, self-paced" },
              { label: "Level", value: LEVELS[course.level] ?? "Beginner-friendly" },
              { label: "Time", value: `About ${programme.weeklyHours} hrs a week` },
              { label: "Designed to take", value: `About ${programme.durationMonths} months` },
              { label: "Device", value: programme.phoneFriendly ? "Phone or laptop" : "Laptop for some lessons" },
              { label: "Start", value: "Today" },
            ]}
            footer={
              scholarship.isOpen ? (
                <p><span className="font-semibold text-success-dark">● Access Scholarship open</span> until {formatShortDate(scholarship.closesAt)}. Apply to see your price.</p>
              ) : (
                <p>Apply to see your price. We&apos;ll tell you first when the next Access Scholarship window opens.</p>
              )
            }
          />
        </div>
      </section>

      {course.outcomes.length > 0 && (
        <section className="bg-white py-16 md:py-24">
          <div className="container-wide">
            <p className="eyebrow">Outcomes</p>
            <h2 className="mt-3 max-w-2xl text-[1.75rem] font-bold leading-[1.15] text-navy md:text-[2.5rem]">What you&apos;ll be able to do</h2>
            <ul className="mt-10 grid gap-4 md:grid-cols-2">
              {course.outcomes.map((outcome) => (
                <li key={outcome} className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-white p-5 text-neutral-800">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success-light text-success-dark" aria-hidden="true">✓</span>
                  {outcome}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section id="curriculum" className="scroll-mt-24 bg-neutral-50 py-16 md:py-24">
        <div className="container-wide grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div>
            <p className="eyebrow">Curriculum</p>
            <h2 className="mt-3 text-[1.75rem] font-bold leading-[1.15] text-navy md:text-[2.5rem]">Step by step, from the basics</h2>
            <p className="mt-4 text-neutral-700">
              Short lessons you can take in any order that suits you, about {programme.weeklyHours} hours a week. Open the free preview to see how the lessons work before you apply.
            </p>
            {projectsList.length > 0 && (
              <div className="mt-8 rounded-2xl bg-white p-6 ring-1 ring-neutral-200">
                <p className="font-semibold text-navy">Projects you&apos;ll build</p>
                <ul className="mt-3 space-y-2 text-neutral-700">
                  {projectsList.map((project) => (
                    <li key={project} className="flex gap-2"><span className="text-accent-700" aria-hidden="true">→</span>{project}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div>
            <PreviewCurriculum sections={course.curriculum} slug={course.slug} />
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-24">
        <div className="container-wide grid gap-12 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Who it&apos;s for</p>
            <h2 className="mt-3 text-[1.75rem] font-bold leading-[1.15] text-navy md:text-[2.25rem]">Is this programme for you?</h2>
            <ul className="mt-8 grid gap-3">
              {whoFor.map((line) => (
                <li key={line} className="rounded-xl border border-neutral-200 bg-white p-4 font-medium text-neutral-800">{line}</li>
              ))}
            </ul>
            {showSlots && programme.whoFor.length === 0 && (
              <p className="mt-4 rounded-xl border-2 border-dashed border-warning p-3 text-sm text-neutral-800">
                Using the school&apos;s default &ldquo;who it&apos;s for&rdquo;. Add programme-specific lines to this course in the admin. (Shown in development only.)
              </p>
            )}
          </div>
          <div>
            <p className="eyebrow">What you&apos;ll need</p>
            <h2 className="mt-3 text-[1.75rem] font-bold leading-[1.15] text-navy md:text-[2.25rem]">Before you start</h2>
            <div className="mt-8">
              <RequirementsList requirements={course.requirements} phoneFriendly={programme.phoneFriendly} />
            </div>
          </div>
        </div>
      </section>

      <HowItWorks applyHref={applyHref} />
      <WhySkillsAir />
      <ScholarshipBand isOpen={scholarship.isOpen} closesAt={scholarship.closesAt} applyHref={applyHref} />

      <Section title="Questions">
        <div className="max-w-3xl"><FAQAccordion items={programmeFaqs} /></div>
      </Section>

      {siblings.length > 0 && programme.school && (
        <section className="bg-neutral-50 py-16 md:py-20">
          <div className="container-wide">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="text-[1.5rem] font-bold text-navy md:text-[2rem]">More from the {programme.school.name}</h2>
              <Link href={`/schools/${programme.school.slug}`} className="font-semibold text-accent-700 hover:underline">See the school →</Link>
            </div>
            <ul className="mt-8 grid gap-4 md:grid-cols-3">
              {siblings.map((sibling) => (
                <li key={sibling.slug}>
                  <Link href={`/programmes/${sibling.slug}`} className="flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-5 transition-colors hover:border-navy">
                    <span className="font-bold text-navy">{sibling.title}</span>
                    {sibling.shortDescription && <span className="mt-2 line-clamp-3 text-sm text-neutral-600">{sibling.shortDescription}</span>}
                    {sibling.phoneFriendly && <span className="mt-3 w-fit rounded-full bg-success-light px-2.5 py-0.5 text-xs font-semibold text-success-dark">📱 Phone-friendly</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <SoftCapture programme={course.slug} programmeTitle={course.title} />
    </>
  );
}
