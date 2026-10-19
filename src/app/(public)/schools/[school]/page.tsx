import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Section } from "@/components/marketing/Section";
import { FAQAccordion } from "@/components/marketing/FAQAccordion";
import { TrackEvent } from "@/components/analytics/TrackEvent";
import { SchoolWaitlistForm } from "@/components/marketing/SchoolWaitlistForm";
import { SchoolIcon, shortSchoolName } from "@/components/marketing/SchoolIcon";
import { AtAGlance, FounderNote, HowItWorks, LandingHero, ScholarshipBand, WhySkillsAir } from "@/components/marketing/Landing";
import { getSchools, type SchoolSummary } from "@/lib/catalog";
import { getScholarshipWindow } from "@/lib/scholarship";
import { formatShortDate } from "@/lib/offer";
import { faqs } from "@/content/faq";
import { site } from "@/content/site";
import { schoolCopy, schoolRoles } from "@/content/schools";
import { cn } from "@/lib/utils";

export const revalidate = 300;

async function findSchool(slug: string) {
  const schools = await getSchools();
  return { school: schools.find((school) => school.slug === slug) ?? null, schools };
}

export async function generateMetadata({ params }: { params: { school: string } }): Promise<Metadata> {
  const { school } = await findSchool(params.school).catch(() => ({ school: null }));
  if (!school) return { title: "School not found" };
  const copy = schoolCopy(school.name);
  return {
    title: `${school.name}: ${copy.headline}`,
    description: `${copy.pitch} Self-paced, beginner-friendly, with a verifiable certificate and internship access. Apply in 60 seconds.`.slice(0, 300),
    alternates: { canonical: `/schools/${school.slug}` },
    openGraph: { title: `${school.name} · SkillsAir`, description: copy.headline },
  };
}

function OtherSchools({ schools, current }: { schools: SchoolSummary[]; current: string }) {
  const others = schools.filter((school) => school.slug !== current && school.programmes.length > 0).slice(0, 3);
  if (!others.length) return null;
  return (
    <section className="bg-neutral-50 py-16 md:py-20">
      <div className="container-wide">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-[1.5rem] font-bold text-navy md:text-[2rem]">Explore other schools</h2>
          <Link href="/schools" className="font-semibold text-accent-700 hover:underline">See all schools →</Link>
        </div>
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {others.map((school) => (
            <li key={school.slug}>
              <Link href={`/schools/${school.slug}`} className="flex h-full items-start gap-4 rounded-2xl border border-neutral-200 bg-white p-5 transition-colors hover:border-navy">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-navy">
                  <SchoolIcon name={school.name} className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-bold text-navy">{school.name}</span>
                  <span className="mt-1 block text-sm text-neutral-600">{school.oneLiner}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default async function SchoolPage({ params }: { params: { school: string } }) {
  let found: Awaited<ReturnType<typeof findSchool>>;
  try {
    found = await findSchool(params.school);
  } catch {
    return <Section title="This school is loading slowly" intro={<p>We couldn&apos;t load it just now. Please refresh in a minute.</p>} />;
  }
  const { school, schools } = found;
  if (!school) notFound();
  const scholarship = await getScholarshipWindow();
  const copy = schoolCopy(school.name);
  const roles = schoolRoles(school.name);
  const hasProgrammes = school.programmes.length > 0;
  const phoneFriendly = school.programmes.filter((programme) => programme.phoneFriendly).length;
  const applyHref = `/apply?school=${encodeURIComponent(school.slug)}`;
  const schoolFaqs = faqs.filter((faq) => ["beginner", "phone", "how-long", "job", "certificate", "refunds"].includes(faq.id));

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

      <LandingHero
        breadcrumb={{ href: "/schools", label: "All schools" }}
        eyebrow={school.name}
        icon={<SchoolIcon name={school.name} className="h-5 w-5" />}
        title={copy.headline}
        intro={<p>{copy.pitch}</p>}
        primary={hasProgrammes ? { href: applyHref, label: "Apply for a scholarship seat →" } : { href: "#waitlist", label: "Join the waitlist →" }}
        secondary={hasProgrammes ? { href: "#programmes", label: school.programmes.length === 1 ? "See the programme" : `See the ${school.programmes.length} programmes` } : undefined}
        note={hasProgrammes ? "Free to apply · Takes 60 seconds · Beginners welcome" : "Programmes for this school are being finalised."}
        aside={
          <AtAGlance
            items={[
              { label: "Programmes", value: hasProgrammes ? `${school.programmes.length} open now` : "Opening soon" },
              { label: "Format", value: "Online, self-paced" },
              { label: "Time", value: `About ${site.programme.weeklyHours} hrs a week` },
              { label: "Designed to take", value: `About ${site.programme.durationMonths} months` },
              { label: "On your phone", value: phoneFriendly ? `${phoneFriendly} programme${phoneFriendly === 1 ? "" : "s"}` : "Some lessons need a laptop" },
              { label: "When you finish", value: "Verifiable certificate" },
            ]}
            footer={
              scholarship.isOpen ? (
                <p><span className="font-semibold text-success-dark">● Access Scholarship open</span> until {formatShortDate(scholarship.closesAt)}. Apply to see your price.</p>
              ) : (
                <p>The next Access Scholarship window opens soon. Apply and we&apos;ll tell you first.</p>
              )
            }
          />
        }
      />

      {hasProgrammes ? (
        <section id="programmes" className="scroll-mt-24 bg-white py-16 md:py-24">
          <div className="container-wide">
            <p className="eyebrow">Programmes</p>
            <h2 className="mt-3 text-[1.75rem] font-bold leading-[1.15] text-navy md:text-[2.5rem]">Choose where you start</h2>
            <ul className={cn("mt-10 grid gap-5", school.programmes.length > 1 && "md:grid-cols-2")}>
              {school.programmes.map((programme) => (
                <li key={programme.slug} className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 transition-colors hover:border-navy md:p-7">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-neutral-700">Self-paced</span>
                    <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-neutral-700">~{site.programme.weeklyHours} hrs/week</span>
                    {programme.phoneFriendly && <span className="rounded-full bg-success-light px-2.5 py-1 text-success-dark">📱 Phone-friendly</span>}
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-navy">{programme.title}</h3>
                  {programme.shortDescription && <p className="mt-2 flex-1 text-neutral-700">{programme.shortDescription}</p>}
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Link href={`/programmes/${programme.slug}`} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border-2 border-navy px-5 font-semibold text-navy hover:bg-navy hover:text-white">
                      See the programme
                    </Link>
                    <Link href={`/apply?programme=${encodeURIComponent(programme.slug)}`} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-accent-700 px-5 font-semibold text-white hover:bg-accent-800">
                      Apply →
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
            {school.upcoming.length > 0 && (
              <div className="mt-8 rounded-2xl border border-dashed border-neutral-300 p-5">
                <p className="text-sm font-semibold text-neutral-700">Coming soon to the {school.name}</p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {school.upcoming.map((title) => (
                    <li key={title} className="rounded-full bg-neutral-100 px-3.5 py-1.5 text-sm text-neutral-700">{title}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      ) : (
        <section id="waitlist" className="scroll-mt-24 bg-white py-16 md:py-24">
          <div className="container-wide grid gap-10 md:grid-cols-2 md:items-start">
            <div>
              <p className="eyebrow">Opening soon</p>
              <h2 className="mt-3 text-[1.75rem] font-bold leading-[1.15] text-navy md:text-[2.5rem]">Be first in when the {shortSchoolName(school.name)} school opens</h2>
              <p className="mt-4 text-lg text-neutral-700">
                Programmes for this school are being finalised. Leave your details and {site.advisor.name} will message you on WhatsApp as soon as you can apply.
              </p>
              {school.upcoming.length > 0 && (
                <ul className="mt-6 flex flex-wrap gap-2">
                  {school.upcoming.map((title) => (
                    <li key={title} className="rounded-full bg-neutral-100 px-3.5 py-1.5 text-sm text-neutral-700">{title}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-card md:p-8">
              <SchoolWaitlistForm school={school.slug} schoolName={school.name} />
            </div>
          </div>
        </section>
      )}

      <section className="bg-neutral-50 py-16 md:py-24">
        <div className="container-wide grid gap-12 lg:grid-cols-2">
          <div>
            <p className="eyebrow">What you&apos;ll learn</p>
            <h2 className="mt-3 text-[1.75rem] font-bold leading-[1.15] text-navy md:text-[2.25rem]">Skills you can show, not just talk about</h2>
            <ul className="mt-8 grid gap-3">
              {copy.skills.map((skill) => (
                <li key={skill} className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white p-4 text-neutral-800">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success-light text-success-dark" aria-hidden="true">✓</span>
                  {skill}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="eyebrow">Who it&apos;s for</p>
            <h2 className="mt-3 text-[1.75rem] font-bold leading-[1.15] text-navy md:text-[2.25rem]">Built for beginners with ambition</h2>
            <ul className="mt-8 grid gap-3">
              {copy.whoFor.map((line) => (
                <li key={line} className="rounded-xl border border-neutral-200 bg-white p-4 font-medium text-neutral-800">{line}</li>
              ))}
            </ul>
            {roles.length > 0 && (
              <div className="mt-8 rounded-2xl bg-white p-6 ring-1 ring-neutral-200">
                <p className="font-semibold text-navy">Where it can lead</p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {roles.map((role) => (
                    <li key={role} className="rounded-full bg-accent-50 px-3 py-1.5 text-sm font-medium text-accent-800">{role}</li>
                  ))}
                </ul>
                <p className="mt-4 text-sm text-neutral-600">
                  Typical entry-level roles. We don&apos;t promise jobs; certified graduates get access to internship openings from our partner firms.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <HowItWorks applyHref={hasProgrammes ? applyHref : "#waitlist"} />
      <WhySkillsAir />
      <FounderNote />
      <ScholarshipBand isOpen={scholarship.isOpen} closesAt={scholarship.closesAt} applyHref={hasProgrammes ? applyHref : "#waitlist"} waitlist={!hasProgrammes} />

      <Section title={`Questions about the ${school.name}`}>
        <div className="max-w-3xl"><FAQAccordion items={schoolFaqs} /></div>
      </Section>

      <OtherSchools schools={schools} current={school.slug} />
    </>
  );
}
