import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Section } from "@/components/marketing/Section";
import { PrimaryCTA } from "@/components/marketing/PrimaryCTA";
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
import { naira, site } from "@/content/site";

// Cached and refreshed every 5 minutes (ISR); enrolment state loads client-side.
export const revalidate = 300;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const result = await getProgramme(params.slug);
  if (result.status !== "ok") return { title: "Programme" };
  const { course } = result.programme;
  return {
    title: `${course.title} course in Nigeria: job-ready in 3 months`,
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
  const certificate = naira(site.programme.certificatePrice);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://skillsair.com";
  const programmeFaqs = faqs.filter((faq) => ["why-cheap", "beginner", "phone", "start", "certificate", "refunds"].includes(faq.id));
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

      <section className="relative overflow-hidden border-t border-primary-800 bg-navy text-white">
        <AdirePattern opacity={0.4} />
        <div className="container-wide relative py-12 md:py-20">
          {programme.school && (
            <Link href={`/schools/${programme.school.slug}`} className="text-sm font-semibold uppercase tracking-wider text-accent-300 hover:underline">
              {programme.school.name}
            </Link>
          )}
          <h1 className="mt-3 max-w-3xl text-[2.125rem] font-bold leading-[1.06] tracking-[-0.02em] text-white md:text-[3.5rem]">{course.title}: job-ready in {programme.durationMonths} months</h1>
          {course.excerpt && <p className="mt-4 max-w-2xl text-lg text-white/85">{course.excerpt}</p>}
          <ul className="mt-6 flex flex-wrap gap-2 text-sm">
            {[
              "Self-paced",
              `${programme.durationMonths} months to finish`,
              `~${programme.weeklyHours} hrs/week`,
              `Certificate (${certificate} when you finish)`,
              "Internship access after certification",
              ...(programme.phoneFriendly ? ["📱 Phone-friendly"] : []),
            ].map((fact) => (
              <li key={fact} className="rounded-full bg-white/10 px-3 py-1.5">{fact}</li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ProgrammeActions slug={course.slug} courseId={course.id} applyLabel={applyLabel} />
            {programme.previewLessonId && <WatchPreviewButton />}
          </div>
        </div>
      </section>

      {course.outcomes.length > 0 && (
        <Section title="What you'll be able to do">
          <ul className="grid gap-3 md:grid-cols-2">
            {course.outcomes.map((outcome) => (
              <li key={outcome} className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white p-4 text-neutral-800">
                <span className="text-success-dark" aria-hidden="true">✓</span>
                {outcome}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section id="curriculum" tone="muted" title="Curriculum">
        <div className="max-w-3xl">
          <PreviewCurriculum sections={course.curriculum} slug={course.slug} />
        </div>
      </Section>

      {programme.projects.length > 0 && (
        <Section title="Projects you'll build">
          <ul className="space-y-3">
            {programme.projects.map((project) => <li key={project} className="text-neutral-800">• {project}</li>)}
          </ul>
        </Section>
      )}

      {programme.whoFor.length > 0 ? (
        <Section title="Who it's for">
          <ul className="space-y-3 text-neutral-800">
            {programme.whoFor.map((line) => <li key={line}>{line}</li>)}
          </ul>
        </Section>
      ) : (
        showSlots && (
          <Section title="Who it's for">
            <p className="rounded-xl border-2 border-dashed border-warning p-4 text-neutral-800">
              {`{{WHO_FOR_${course.slug.toUpperCase().replace(/-/g, "_")}}}`}: add &ldquo;who it&apos;s for / not for&rdquo; to this course&apos;s description in the admin. Hidden in production.
            </p>
          </Section>
        )
      )}

      <Section tone="muted" title="What you'll need">
        <div className="max-w-2xl">
          <RequirementsList requirements={course.requirements} phoneFriendly={programme.phoneFriendly} />
        </div>
      </Section>

      <Section title="Your pathway">
        <ol className="grid gap-4 md:grid-cols-4">
          {[
            "Finish the programme at your own pace",
            `Claim your verifiable certificate (${certificate})`,
            "Get internship access and laptop-support eligibility",
            "Free CV & LinkedIn and Freelancing courses throughout",
          ].map((step, index) => (
            <li key={step} className="rounded-2xl border border-neutral-200 bg-white p-5">
              <span className="font-heading text-2xl font-bold text-primary-800">{index + 1}</span>
              <p className="mt-2 text-neutral-700">{step}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section
        tone="navy"
        title={scholarship.isOpen ? "See your Access Scholarship price" : "Get notified when the next scholarship opens"}
        intro={
          <p>
            {scholarship.isOpen
              ? `Apply in 60 seconds to see your Access Scholarship price. This window closes ${formatShortDate(scholarship.closesAt)}.`
              : "Apply in 60 seconds. We'll show your price and message you on WhatsApp when the next scholarship window opens."}
          </p>
        }
      >
        <PrimaryCTA href={`/apply?programme=${encodeURIComponent(course.slug)}`} block>See my price →</PrimaryCTA>
      </Section>

      <Section title="Questions">
        <div className="max-w-3xl"><FAQAccordion items={programmeFaqs} /></div>
      </Section>

      <SoftCapture programme={course.slug} programmeTitle={course.title} />
    </>
  );
}
