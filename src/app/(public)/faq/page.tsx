import type { Metadata } from "next";
import { Section } from "@/components/marketing/Section";
import { FAQAccordion } from "@/components/marketing/FAQAccordion";
import { PrimaryCTA } from "@/components/marketing/PrimaryCTA";
import { WhatsAppTextLink } from "@/components/marketing/WhatsAppButton";
import { faqs } from "@/content/faq";

export const metadata: Metadata = {
  title: "FAQ: price, phone learning, certificates and internships",
  description: "Why is it only ₦2,000? Can I learn on my phone? Will you get me a job? Straight answers about SkillsAir.",
  alternates: { canonical: "/faq" },
};

const GROUPS: Array<{ title: string; ids: string[] }> = [
  { title: "Price and trust", ids: ["why-cheap", "legit", "after-deadline", "someone-else-pays", "debited", "refunds"] },
  { title: "Learning", ids: ["beginner", "phone", "how-long", "start", "cohort"] },
  { title: "Certificate and what comes after", ids: ["certificate", "job", "extras", "laptop"] },
];

export default function FaqPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Section title={<span className="block text-[2rem] md:text-[3.5rem]">Questions, answered straight</span>} intro={<p>If yours isn&apos;t here, ask us on WhatsApp. A real person reads every message.</p>}>
        <div className="max-w-3xl space-y-10">
          {GROUPS.map((group) => (
            <div key={group.title}>
              <h2 className="mb-4 text-xl font-heading font-bold text-neutral-900">{group.title}</h2>
              <FAQAccordion items={faqs.filter((faq) => group.ids.includes(faq.id))} />
            </div>
          ))}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <PrimaryCTA href="/apply" block>Apply for a scholarship seat →</PrimaryCTA>
            <WhatsAppTextLink />
          </div>
        </div>
      </Section>
    </>
  );
}
