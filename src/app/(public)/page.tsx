import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { Section } from "@/components/marketing/Section";
import { PrimaryCTA } from "@/components/marketing/PrimaryCTA";
import { TrustStrip } from "@/components/marketing/TrustStrip";
import { StepPathway } from "@/components/marketing/StepPathway";
import { SchoolCard } from "@/components/marketing/SchoolCard";
import { FounderCard } from "@/components/marketing/FounderCard";
import { FAQAccordion } from "@/components/marketing/FAQAccordion";
import { StoryCard } from "@/components/marketing/StoryCard";
import { WhatsAppTextLink } from "@/components/marketing/WhatsAppButton";
import { TrackEvent } from "@/components/analytics/TrackEvent";
import { images, unsplashUrl } from "@/content/images";
import { faqs, homeFaqIds } from "@/content/faq";
import { proof, verifiedOnly } from "@/content/proof";
import { site } from "@/content/site";
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
      Learn a tech skill employers pay for. <span className="text-accent-300">Then get access to internships.</span>
    </>
  ),
  B: <>From zero to job-ready in 3 months, for less than your data subscription.</>,
  C: <>Your tech career starts with one 60-second application.</>,
} as const;

const laptopSupportOn = process.env.NEXT_PUBLIC_FEATURE_LAPTOP_SUPPORT !== "false";

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
    ? `${adSchool.name}: ${adSchool.oneLiner} Self-paced, about ${site.programme.weeklyHours} hours a week for ${site.programme.durationMonths} months, ending with a verifiable certificate and internship access.`
    : `Self-paced training in AI, data, design, engineering, security, marketing and more. Finish in ${site.programme.durationMonths} months at about ${site.programme.weeklyHours} hours a week, earn a verifiable certificate, and unlock internship openings from our partner firms.${scholarship.isOpen ? " Access Scholarship seats are open now." : ""}`;

  const organisationJsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: site.brand,
    legalName: site.legalName,
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://skillsair.com",
    email: site.supportEmail,
    telephone: site.whatsapp.e164,
    address: { "@type": "PostalAddress", streetAddress: "Osifila Street, Anifowose", addressLocality: "Ikeja", addressRegion: "Lagos", addressCountry: "NG" },
    sameAs: site.social.map((link) => link.href),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organisationJsonLd) }} />
      <TrackEvent event="experiment_variant" params={{ hero: experiments.hero, cta: experiments.cta }} />

      <section className="bg-navy text-white">
        <div className="container-wide grid items-center gap-10 py-12 md:py-20 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-accent-300">For young Africans ready to start a tech career</p>
            <h1 className="mt-3 text-[2rem] font-heading font-extrabold leading-tight md:text-[3.5rem]">{HERO_HEADLINES[experiments.hero]}</h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/85 md:text-lg">{subLine}</p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <PrimaryCTA href="/apply" block>{ctaLabel}</PrimaryCTA>
              <Link href="/quiz" className="min-h-12 text-center text-sm font-medium text-white underline underline-offset-4 hover:text-accent-300 sm:text-left">
                Not sure which skill? Take the 2-minute Career Match quiz
              </Link>
            </div>
            <p className="mt-4 text-sm text-white/75">Free to apply · Takes 60 seconds · Beginners welcome</p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
            <Image src={unsplashUrl(images.hero.id, 1200)} alt={images.hero.alt} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </div>
        </div>
      </section>

      <TrustStrip />

      <Section
        title="You're ready to work. The market wants skills you haven't had the chance to get."
        intro={
          <p>
            Bootcamps cost hundreds of thousands. Free tutorials leave you with half-skills and nobody to vouch for you. Meanwhile, companies are short of the tech talent they need. SkillsAir exists to close that gap: quality, job-ready training at a price you can afford, ending with a certificate employers can verify.
          </p>
        }
      />

      <Section id="how-it-works" tone="muted" title="Four steps from where you are to where you want to be">
        <StepPathway />
        <div className="mt-10">
          <PrimaryCTA href="/apply" block>Start step 1: Apply now →</PrimaryCTA>
        </div>
      </Section>

      {schools.length > 0 && (
        <Section title={`${schools.length === 10 ? "Ten schools" : "Our schools"}. One goal: get you working in tech.`}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {schools.map((school) => (
              <SchoolCard key={school.slug} slug={school.slug} name={school.name} oneLiner={school.oneLiner} programmeCount={school.programmes.length} scholarshipOpen={scholarship.isOpen} />
            ))}
          </div>
          <p className="mt-8 text-neutral-700">
            Not sure?{" "}
            <Link href="/quiz" className="font-semibold text-primary-800 underline underline-offset-2">Take the Career Match quiz →</Link>
          </p>
        </Section>
      )}

      {stories.length > 0 ? (
        <Section tone="muted" title="Stories from SkillsAir graduates">
          <div className="grid gap-4 md:grid-cols-2">
            {stories.map((story) => <StoryCard key={story.name} story={story} />)}
          </div>
        </Section>
      ) : (
        <Section
          tone="muted"
          title="Be part of SkillsAir's founding cohort"
          intro={<p>We&apos;re new, and we&apos;re proud of it. Our first learners will be the first stories on this page. Start now, finish strong, and we&apos;ll celebrate your win here (with your permission).</p>}
        >
          <div className="max-w-2xl">
            <FounderCard />
          </div>
        </Section>
      )}

      <Section
        tone="navy"
        title={scholarship.isOpen && closesOn ? `The Access Scholarship is open, until ${closesOn}` : "The Access Scholarship opens in windows"}
        intro={
          <>
            <p>
              Money shouldn&apos;t decide who gets into tech. During each scholarship window, SkillsAir covers most of your programme fee.
              {scholarship.isOpen && closesOn
                ? ` When this window closes on ${closesOn}, the standard fee applies until the next one opens.`
                : " Between windows the standard fee applies. Apply now and we'll message you on WhatsApp when the next window opens."}
            </p>
            {laptopSupportOn && (
              <p className="mt-4">
                Certified graduates who need a laptop can apply for one. {scholarship.laptopsPerCohort} laptops go to each cohort.{" "}
                <Link href="/laptop-rules" className="font-semibold text-white underline underline-offset-2">Official rules</Link>
              </p>
            )}
          </>
        }
      >
        <PrimaryCTA href="/apply" block>See my scholarship price →</PrimaryCTA>
        <p className="mt-3 text-sm text-white/75">You&apos;ll see your exact price after a 60-second application.</p>
      </Section>

      <Section title="Questions people ask first">
        <div className="max-w-3xl">
          <FAQAccordion items={teaser} />
          <Link href="/faq" className="mt-6 inline-block font-semibold text-primary-800 underline underline-offset-2">See all FAQs</Link>
        </div>
      </Section>

      <Section
        tone="muted"
        title="Three months from now, you could have a certificate and a new direction."
        intro={<p>Applying is free and takes 60 seconds. You&apos;ll see your price and everything you get, then decide.</p>}
      >
        <PrimaryCTA href="/apply" block>Apply for a scholarship seat →</PrimaryCTA>
        <p className="mt-4">
          <WhatsAppTextLink>Or chat with {site.advisor.name} on WhatsApp first</WhatsAppTextLink>
        </p>
      </Section>
    </>
  );
}
