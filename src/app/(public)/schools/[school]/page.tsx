import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Section } from "@/components/marketing/Section";
import { PrimaryCTA } from "@/components/marketing/PrimaryCTA";
import { FAQAccordion } from "@/components/marketing/FAQAccordion";
import { TrackEvent } from "@/components/analytics/TrackEvent";
import { getSchools } from "@/lib/catalog";
import { getScholarshipWindow } from "@/lib/scholarship";
import { formatShortDate } from "@/lib/offer";
import { faqs } from "@/content/faq";
import { site } from "@/content/site";
import { schoolRoles } from "@/content/schools";
import { SchoolWaitlistForm } from "@/components/marketing/SchoolWaitlistForm";

export const revalidate = 300;

async function findSchool(slug: string) {
  const schools = await getSchools();
  return schools.find((school) => school.slug === slug) ?? null;
}

export async function generateMetadata({ params }: { params: { school: string } }): Promise<Metadata> {
  const school = await findSchool(params.school).catch(() => null);
  if (!school) return { title: "School not found" };
  return {
    title: `${school.name}: affordable, job-ready training in Nigeria`,
    description: `${school.oneLiner} Self-paced, ${site.programme.durationMonths} months, verifiable certificate and internship access. Apply in 60 seconds.`,
    alternates: { canonical: `/schools/${school.slug}` },
  };
}

export default async function SchoolPage({ params }: { params: { school: string } }) {
  let school;
  try {
    school = await findSchool(params.school);
  } catch {
    return (
      <Section title="This school is loading slowly" intro={<p>We couldn&apos;t load it just now. Please refresh in a minute.</p>} />
    );
  }
  if (!school) notFound();
  const scholarship = await getScholarshipWindow();
  const roles = schoolRoles(school.name);
  const hasProgrammes = school.programmes.length > 0;
  const schoolFaqs = faqs.filter((faq) => ["beginner", "phone", "how-long", "job", "certificate"].includes(faq.id));

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Schools", item: `${process.env.NEXT_PUBLIC_SITE_URL || "https://skillsair.com"}/schools` },
      { "@type": "ListItem", position: 2, name: school.name },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      <TrackEvent event="view_school" params={{ school: school.slug }} />
      <Section
        eyebrow="School"
        level={1}
        title={school.name}
        intro={<p>{school.oneLiner}</p>}
      >
        {hasProgrammes ? (
          <PrimaryCTA href={`/apply?school=${encodeURIComponent(school.slug)}`} block>Apply for a scholarship seat →</PrimaryCTA>
        ) : (
          <p className="inline-flex rounded-full bg-accent-50 px-4 py-2 font-semibold text-accent-800">Programmes coming soon</p>
        )}
      </Section>

      {roles.length > 0 && (
        <Section tone="muted" title="What you could do next">
          <ul className="grid gap-3 sm:grid-cols-2">
            {roles.map((role) => (
              <li key={role} className="rounded-xl border border-neutral-200 bg-white p-4 font-medium text-neutral-800">{role}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-neutral-600">Typical entry-level roles this school prepares you for. We don&apos;t promise jobs; certified graduates get access to internship openings from our partner firms.</p>
        </Section>
      )}

      {!hasProgrammes && (
        <Section
          title={`Be first in when the ${school.name} opens`}
          intro={<p>Programmes for this school are being finalised. Leave your details and {site.advisor.name} will message you on WhatsApp as soon as you can apply.</p>}
        >
          {school.upcoming.length > 0 && <UpcomingProgrammes titles={school.upcoming} />}
          <div className="max-w-xl rounded-2xl border border-neutral-200 bg-white p-6">
            <SchoolWaitlistForm school={school.slug} schoolName={school.name} />
          </div>
        </Section>
      )}

      {hasProgrammes && (
      <Section title={`Programmes in the ${school.name}`}>
        <ul className="grid gap-4 md:grid-cols-2">
          {school.programmes.map((programme) => (
            <li key={programme.slug}>
              <Link href={`/programmes/${programme.slug}`} className="flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-5 hover:border-primary-800">
                <span className="text-lg font-heading font-bold text-neutral-900">{programme.title}</span>
                {programme.shortDescription && <span className="mt-2 flex-1 text-neutral-600">{programme.shortDescription}</span>}
                <span className="mt-4 flex flex-wrap items-center gap-2 text-sm text-neutral-600">
                  <span>{site.programme.durationMonths} months · ~{site.programme.weeklyHours} hrs/week</span>
                  {programme.phoneFriendly && <span className="rounded-full bg-success-light px-2 py-0.5 font-semibold text-success-dark">📱 Phone-friendly</span>}
                </span>
                <span className="mt-3 font-semibold text-primary-800">View programme →</span>
              </Link>
            </li>
          ))}
        </ul>
        {school.upcoming.length > 0 && <UpcomingProgrammes titles={school.upcoming} />}
      </Section>
      )}

      {hasProgrammes && (
      <Section
        tone="navy"
        title={scholarship.isOpen ? "The Access Scholarship is open" : "Scholarship windows open regularly"}
        intro={
          <p>
            {scholarship.isOpen
              ? `Apply in 60 seconds to see your Access Scholarship price. This window closes ${formatShortDate(scholarship.closesAt)}.`
              : "Apply now and we'll message you on WhatsApp when the next Access Scholarship window opens."}
          </p>
        }
      >
        <PrimaryCTA href={`/apply?school=${encodeURIComponent(school.slug)}`} block>See my price →</PrimaryCTA>
      </Section>
      )}

      <Section title="Questions about this school">
        <div className="max-w-3xl"><FAQAccordion items={schoolFaqs} /></div>
      </Section>
    </>
  );
}

function UpcomingProgrammes({ titles }: { titles: string[] }) {
  return (
    <div className="mb-6 mt-6">
      <h3 className="text-base font-bold text-navy">Coming soon</h3>
      <ul className="mt-3 flex flex-wrap gap-2">
        {titles.map((title) => (
          <li key={title} className="rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-sm font-medium text-neutral-700">{title}</li>
        ))}
      </ul>
    </div>
  );
}
