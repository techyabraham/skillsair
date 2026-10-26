import type { Metadata } from "next";
import Image from "next/image";
import { Section } from "@/components/marketing/Section";
import { PrimaryCTA } from "@/components/marketing/PrimaryCTA";
import { ContactForm } from "@/components/marketing/ContactForm";
import { CertificateVerifier } from "@/components/marketing/CertificateVerifier";
import { StoryCard } from "@/components/marketing/StoryCard";
import { proof, verifiedOnly } from "@/content/proof";
import { guidedPlanOn, site } from "@/content/site";

export const metadata: Metadata = {
  title: "Certificate and internship access",
  description: "How SkillsAir works after you finish: a verifiable certificate, then access to internship openings from partner firms. No job guarantees, just an honest pathway.",
  alternates: { canonical: "/outcomes" },
};

export default function OutcomesPage() {
  const partners = verifiedOnly(proof.partners);
  const stories = verifiedOnly(proof.stories);
  const stats = verifiedOnly(proof.stats);
  return (
    <>
      <Section
        level={1}
        title={<>From certificate to internship access</>}
        intro={
          <p>
            When you earn your certificate, you get access to internship openings from SkillsAir partner firms, and sometimes direct job opportunities. We don&apos;t promise jobs, and be careful of anyone who does.
          </p>
        }
      >
        <ol className="grid gap-4 md:grid-cols-3">
          {[
            { title: "Finish your programme", body: guidedPlanOn ? `Follow your guided ${site.programme.planWeeks}-week plan, about ${site.programme.weeklyHours} hours a week.` : `Designed to take ${site.programme.planWeeks} weeks, about ${site.programme.weeklyHours} hours a week.` },
            { title: "Earn your certificate", body: 'Pass the final exam to earn a verifiable certificate with a unique link employers can check. It’s optional and paid separately when you finish; the fee covers the exam and any retakes.' },
            { title: "Unlock internship access", body: "Openings from our partner firms, and sometimes direct job opportunities." },
          ].map((step, index) => (
            <li key={step.title} className="rounded-2xl border border-neutral-200 bg-white p-5">
              <span className="font-heading text-2xl font-bold text-primary-800">{index + 1}</span>
              <h2 className="mt-2 font-heading font-bold text-neutral-900">{step.title}</h2>
              <p className="mt-2 text-neutral-600">{step.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {stats.length > 0 && (
        <Section tone="muted" title="Results so far">
          <dl className="grid gap-4 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-white p-5">
                <dt className="text-sm text-neutral-600">{stat.label}</dt>
                <dd className="text-3xl font-heading font-bold text-neutral-900">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </Section>
      )}

      {partners.length > 0 && (
        <Section title="Partner firms">
          <ul className="flex flex-wrap items-center gap-8">
            {partners.map((partner) => (
              <li key={partner.name}>
                <Image src={partner.logo} alt={partner.name} width={140} height={48} className="h-12 w-auto object-contain" />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {stories.length > 0 && (
        <Section tone="muted" title="Graduate stories">
          <div className="grid gap-4 md:grid-cols-2">{stories.map((story) => <StoryCard key={story.name} story={story} />)}</div>
        </Section>
      )}

      <Section id="verify" tone="muted" title="Verify a SkillsAir certificate" intro={<p>Employers: enter the code printed on the certificate.</p>}>
        <CertificateVerifier />
      </Section>

      <Section
        id="employers"
        title="We're building our partner network. Are you an employer?"
        intro={<p>Partner with us to offer internships to certified, job-ready graduates. Tell us about your company and the roles you hire for.</p>}
      >
        <div className="max-w-xl rounded-2xl border border-neutral-200 bg-white p-6">
          <ContactForm source="employer" messageLabel="Company name and the roles you'd like to fill" />
        </div>
      </Section>

      <Section tone="navy" title="Start the pathway today">
        <PrimaryCTA href="/apply" block>Apply for a scholarship seat →</PrimaryCTA>
      </Section>
    </>
  );
}
