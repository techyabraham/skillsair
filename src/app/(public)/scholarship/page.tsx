import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { images, unsplashUrl } from "@/content/images";
import { Section } from "@/components/marketing/Section";
import { PrimaryCTA } from "@/components/marketing/PrimaryCTA";
import { FAQAccordion } from "@/components/marketing/FAQAccordion";
import { getScholarshipWindow } from "@/lib/scholarship";
import { formatShortDate } from "@/lib/offer";
import { faqs } from "@/content/faq";
import { naira, site } from "@/content/site";

export const metadata: Metadata = {
  title: "The Access Scholarship",
  description: "How the SkillsAir Access Scholarship works: scholarship windows, the standard fee, certificates and laptop support for certified graduates.",
  alternates: { canonical: "/scholarship" },
};

export const revalidate = 300;

const laptopSupportOn = process.env.NEXT_PUBLIC_FEATURE_LAPTOP_SUPPORT !== "false";

export default async function ScholarshipPage() {
  const scholarship = await getScholarshipWindow();
  const closesOn = formatShortDate(scholarship.closesAt);
  const related = faqs.filter((faq) => ["why-cheap", "after-deadline", "certificate", "cohort", "laptop"].includes(faq.id));
  return (
    <>
      <Section
        tone="navy"
        level={1}
        title={scholarship.isOpen && closesOn ? `The Access Scholarship is open until ${closesOn}` : "The Access Scholarship"}
        intro={<p>Money shouldn&apos;t decide who gets into tech. During each scholarship window, SkillsAir covers most of your programme fee.</p>}
      >
        <PrimaryCTA href="/apply" block>See my scholarship price →</PrimaryCTA>
        <p className="mt-3 text-sm text-white/75">Your exact price is shown after a 60-second application.</p>
      </Section>

      <Section title="How it works">
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_22rem]">
        <ul className="max-w-3xl space-y-4 text-lg text-neutral-700">
          <li>
            • The standard fee for every programme is <strong>{naira(site.programme.standardFee)}</strong> (or {naira(site.programme.standardMonthlyFee)} a month).
          </li>
          <li>• Scholarship windows open inside each cohort. While a window is open, the Access Scholarship covers most of that fee.</li>
          <li>
            • {scholarship.isOpen && closesOn
              ? `This window closes on ${closesOn} at 11:59pm. After that, the standard fee applies until the next window opens.`
              : "No window is open right now, so the standard fee applies. Apply and we'll message you on WhatsApp when the next window opens."}
          </li>
          <li>• When you finish, you can claim a verifiable certificate (optional, paid separately). It isn’t needed to learn, but it is needed for internship access and laptop support.</li>
          {scholarship.cohortLabel && <li>• Current cohort: {scholarship.cohortLabel}. Everyone who enrols in this period belongs to it, whatever they paid.</li>}
        </ul>
        <div className="relative hidden aspect-[4/5] overflow-hidden rounded-3xl lg:block">
          <Image src={unsplashUrl(images.learning.id, 800)} alt={images.learning.alt} fill sizes="22rem" className="object-cover" />
        </div>
        </div>
      </Section>

      {laptopSupportOn && (
        <Section tone="muted" title="Laptop support for certified graduates">
          <div className="max-w-3xl space-y-4 text-lg text-neutral-700">
            <p>
              Each cohort, <strong>{scholarship.laptopsPerCohort} laptops</strong> go to certified graduates who need one most. Once you hold your SkillsAir certificate from that cohort, apply from your dashboard and tell us your story. A panel chooses the applicants with the greatest need and most compelling case.
            </p>
            <p>Laptop support comes after certification. It is not needed to take the programme. This promotion is approved by the FCCPC.</p>
            <Link href="/laptop-rules" className="font-semibold text-primary-800 underline underline-offset-2">Read the official rules</Link>
          </div>
        </Section>
      )}

      <Section title="Questions">
        <div className="max-w-3xl"><FAQAccordion items={related} /></div>
      </Section>
    </>
  );
}
