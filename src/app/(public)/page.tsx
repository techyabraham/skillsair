import Link from "next/link";
import type { Metadata } from "next";
import Image from "next/image";
import { cookies } from "next/headers";
import { Section } from "@/components/marketing/Section";
import { GhostLink, PrimaryCTA } from "@/components/marketing/PrimaryCTA";
import { TrustStrip } from "@/components/marketing/TrustStrip";
import { StepPathway } from "@/components/marketing/StepPathway";
import { SchoolCard } from "@/components/marketing/SchoolCard";
import { FAQAccordion } from "@/components/marketing/FAQAccordion";
import { StoryCard } from "@/components/marketing/StoryCard";
import { AdirePattern } from "@/components/marketing/AdirePattern";
import { TrackEvent } from "@/components/analytics/TrackEvent";
import { images, unsplashUrl } from "@/content/images";
import { faqs, homeFaqIds } from "@/content/faq";
import { proof, verifiedOnly } from "@/content/proof";
import { guidedPlanOn, planSentence, site, whatsappLink } from "@/content/site";
import { getSchools, type SchoolSummary } from "@/lib/catalog";
import { getScholarshipWindow } from "@/lib/scholarship";
import { formatShortDate } from "@/lib/offer";
import { CTA_LABELS, EXPERIMENT_COOKIE, parseAssignments } from "@/lib/experiments";

export const metadata: Metadata = {
  title: { absolute: "SkillsAir: Affordable, job-ready tech training for young Africans" },
  alternates: { canonical: "/" },
};

const HERO_HEADLINES = {
  A: (
    <>
      Learn a tech skill employers pay for. <span className="text-accent">Then get access to internships.</span>
    </>
  ),
  B: (
    <>
      From zero to job-ready in 3 months, <span className="text-accent">for less than your data subscription.</span>
    </>
  ),
  C: (
    <>
      Learn a tech skill employers pay for. <span className="text-accent">Then get access to internships.</span>
    </>
  ),
} as const;

const PATHWAY = ["1 · Learn", "2 · Certify", "3 · Get internship access"];

const laptopSupportOn = process.env.NEXT_PUBLIC_FEATURE_LAPTOP_SUPPORT !== "false";

/** The four schools shown on the home page; the rest are one tap away on /schools. */
const FEATURED_SCHOOLS = ["School of Security", "School of Data", "School of Engineering", "School of Smartphone Creators"];

function featuredSchools(schools: SchoolSummary[]): SchoolSummary[] {
  const featured = FEATURED_SCHOOLS.map((name) => schools.find((school) => school.name === name)).filter((school): school is SchoolSummary => Boolean(school));
  return featured.length ? featured : schools.slice(0, 4);
}

export default async function HomePage({ searchParams }: { searchParams: { utm_content?: string } }) {
  const [schools, scholarship] = await Promise.all([getSchools().catch((): SchoolSummary[] => []), getScholarshipWindow()]);
  const experiments = parseAssignments(cookies().get(EXPERIMENT_COOKIE)?.value);
  const ctaLabel = CTA_LABELS[experiments.cta];
  const closesOn = formatShortDate(scholarship.closesAt);
  const stories = verifiedOnly(proof.stories);
  const teaser = faqs.filter((faq) => homeFaqIds.includes(faq.id));

  // Message match: an ad for a specific school swaps in that school's promise.
  const adSchool = typeof searchParams.utm_content === "string" ? schools.find((school) => school.slug === searchParams.utm_content) : undefined;
  const subLine = adSchool?.oneLiner
    ? `${adSchool.name}: ${adSchool.oneLiner} ${planSentence()}, ending with a verifiable certificate and internship access.`
    : `Job-ready training in Cyber Security, AI, data, design, engineering, ethical hacking, marketing and more. ${guidedPlanOn ? `Follow a guided ${site.programme.planWeeks}-week plan` : `Finish in about ${site.programme.planWeeks} weeks`} at about ${site.programme.weeklyHours} hours a week, earn a verifiable certificate, and unlock internship openings from our partner firms.`;

  const organisationJsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: site.brand,
    legalName: site.legalName,
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://skillsair.com",
    email: site.supportEmail,
    telephone: site.whatsapp.e164,
    sameAs: site.social.map((link) => link.href),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organisationJsonLd) }} />
      <TrackEvent event="experiment_variant" params={{ hero: experiments.hero, cta: experiments.cta }} />

      {/* Hero: centred on navy over the adire pattern. */}
      <section className="relative overflow-hidden border-t border-primary-800 bg-navy">
        <AdirePattern />
        <div className="container-wide relative flex max-w-[920px] flex-col items-center gap-6 pb-20 pt-20 text-center md:gap-[26px] md:pb-[104px] md:pt-28">
          <p className="eyebrow text-accent-300">For young Africans ready to start a tech career</p>
          <h1 className="text-[2.125rem] font-bold leading-[1.06] tracking-[-0.025em] text-white md:text-[4rem]">{HERO_HEADLINES[experiments.hero]}</h1>
          <p className="max-w-[660px] text-lg text-neutral-300 md:text-xl">{subLine}</p>
          <div className="mt-2 flex w-full flex-col items-center justify-center gap-6 sm:w-auto sm:flex-row sm:flex-wrap">
            <PrimaryCTA href="/apply" size="lg" block>
              {ctaLabel}
            </PrimaryCTA>
            <GhostLink href="/quiz" onDark>
              Not sure? Take the 2-minute quiz
            </GhostLink>
          </div>
          <p className="text-sm text-neutral-300">Free to apply · Takes 60 seconds · Beginners welcome</p>
          <ol className="mt-5 flex flex-wrap items-center justify-center gap-3 text-sm font-semibold text-neutral-200" aria-label="Your pathway">
            {PATHWAY.map((step, index) => (
              <li key={step} className="flex items-center gap-3">
                {index > 0 && (
                  <span aria-hidden="true" className="text-accent">
                    →
                  </span>
                )}
                <span className="rounded-full border border-[#334a8f] px-4 py-2">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <TrustStrip />

      <Section
        align="center"
        narrow
        title="You're ready to work. The market wants skills you haven't had the chance to get."
        intro={
          <p>
            Bootcamps cost hundreds of thousands. Free tutorials leave you with half-skills and nobody to vouch for you. Meanwhile, companies are short of the tech talent they need. SkillsAir exists to close that gap: quality, job-ready training at a price you can afford, ending with a certificate employers can verify.
          </p>
        }
      />

      <Section id="how-it-works" tone="muted" eyebrow="How it works" title="Four steps from where you are to where you want to be">
        <StepPathway />
        <div className="mt-12">
          <PrimaryCTA href="/apply" block>
            Start step 1: Apply now →
          </PrimaryCTA>
        </div>
      </Section>

      {schools.length > 0 && (
        <section className="bg-white py-16 md:py-24">
          <div className="container-wide flex flex-col gap-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex flex-col gap-3">
                <p className="eyebrow">Choose your school</p>
                <h2 className="text-[1.75rem] font-bold leading-[1.15] text-navy md:text-[2.5rem]">
                  {schools.length === 10 ? "Ten schools" : "Our schools"}. One goal: get you working in tech.
                </h2>
              </div>
              <GhostLink href="/quiz" className="text-[15px]">
                Not sure? Take the Career Match quiz →
              </GhostLink>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featuredSchools(schools).map((school) => (
                <SchoolCard key={school.slug} slug={school.slug} name={school.name} oneLiner={school.oneLiner} programmeCount={school.programmes.length} scholarshipOpen={scholarship.isOpen} />
              ))}
            </div>
            {schools.length > FEATURED_SCHOOLS.length && (
              <div className="flex justify-center">
                <Link
                  href="/schools"
                  className="inline-flex min-h-[52px] items-center justify-center rounded-xl border-2 border-navy px-7 text-base font-semibold text-navy transition-colors hover:bg-navy hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-800"
                >
                  See all {schools.length} schools →
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {stories.length > 0 ? (
        <Section tone="muted" eyebrow="Graduate stories" title="Stories from SkillsAir graduates">
          <div className="grid gap-4 md:grid-cols-2">
            {stories.map((story) => (
              <StoryCard key={story.name} story={story} />
            ))}
          </div>
        </Section>
      ) : (
        <section className="bg-neutral-50 py-16 md:py-24">
          <div className="container-wide grid items-center gap-10 md:grid-cols-2 md:gap-14">
            <div className="flex flex-col gap-[18px]">
              <p className="eyebrow">Founding cohort</p>
              <h2 className="text-[1.75rem] font-bold leading-[1.15] text-navy md:text-[2.5rem]">Be part of SkillsAir&apos;s founding cohort</h2>
              <p className="text-neutral-700">
                We&apos;re new, and we&apos;re proud of it. Our first learners will be the first stories on this page. Start now, finish strong, and we&apos;ll celebrate your win here (with your permission).
              </p>
              <blockquote className="border-l-4 border-accent-700 pl-4 text-neutral-700">
                &ldquo;{site.founder.quote}&rdquo;
                <footer className="mt-2 text-sm font-semibold text-navy">{site.founder.name}, {site.founder.title}</footer>
              </blockquote>
              <div>
                <PrimaryCTA href="/apply" block>
                  Apply for a scholarship seat →
                </PrimaryCTA>
              </div>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
              <Image src={unsplashUrl(images.hero.id, 1000)} alt={images.hero.alt} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
            </div>
          </div>
        </section>
      )}

      <section className="bg-navy text-neutral-200">
        <div className="container-wide flex max-w-[900px] flex-col items-start gap-5 py-16 md:py-[88px]">
          <p className="eyebrow text-accent-300">Access Scholarship</p>
          <h2 className="text-[1.75rem] font-bold leading-[1.15] text-white md:text-[2.5rem]">
            {scholarship.isOpen && closesOn ? (
              <>
                The Access Scholarship is open, <span className="text-accent">until {closesOn}</span>
              </>
            ) : (
              "The Access Scholarship opens in windows"
            )}
          </h2>
          <p className="text-lg text-neutral-300">
            Money shouldn&apos;t decide who gets into tech. During each scholarship window, SkillsAir covers most of your programme fee.
            {scholarship.isOpen && closesOn
              ? ` When this window closes on ${closesOn}, the standard fee applies until the next one opens.`
              : " Between windows the standard fee applies. Apply now and we'll message you on WhatsApp when the next window opens."}
          </p>
          <div className="flex w-full flex-col gap-5 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
            <PrimaryCTA href="/apply" block className="text-[17px]">
              See my scholarship price →
            </PrimaryCTA>
            <span className="text-sm text-neutral-300">You&apos;ll see your exact price after a 60-second application.</span>
          </div>
          {laptopSupportOn && (
            <p className="mt-2 text-sm text-neutral-300">
              <span aria-hidden="true">💻 </span>Certified graduates who need a laptop can apply for one. {scholarship.laptopsPerCohort} laptops go to each cohort.{" "}
              <a href="/laptop-rules" className="text-accent-300 underline underline-offset-2">
                Official rules
              </a>
            </p>
          )}
        </div>
      </section>

      <section className="bg-white py-16 md:py-24">
        <div className="container-wide flex max-w-[860px] flex-col gap-8">
          <h2 className="text-[1.75rem] font-bold text-navy md:text-[2.25rem]">Questions people ask first</h2>
          <FAQAccordion items={teaser} />
          <GhostLink href="/faq" className="text-[15px]">
            See all FAQs
          </GhostLink>
        </div>
      </section>

      <section className="bg-neutral-50 py-16 md:py-24">
        <div className="container-wide flex max-w-[820px] flex-col items-center gap-[18px] text-center">
          <h2 className="text-[1.875rem] font-bold leading-[1.12] text-navy md:text-[2.75rem]">Three months from now, you could have a certificate and a new direction.</h2>
          <p className="text-lg text-neutral-700">Applying is free and takes 60 seconds. You&apos;ll see your price and everything you get, then decide.</p>
          <PrimaryCTA href="/apply" block className="min-h-14 px-8 text-[17px]">
            Apply for a scholarship seat →
          </PrimaryCTA>
          <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="text-[15px] font-semibold text-navy underline underline-offset-4 hover:text-primary-800">
            Or chat with {site.advisor.name} on WhatsApp first
          </a>
        </div>
      </section>
    </>
  );
}
