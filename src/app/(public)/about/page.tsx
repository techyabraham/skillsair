import type { Metadata } from "next";
import Image from "next/image";
import { Section } from "@/components/marketing/Section";
import { PrimaryCTA } from "@/components/marketing/PrimaryCTA";
import { isPlaceholder, site } from "@/content/site";

export const metadata: Metadata = {
  title: "About SkillsAir",
  description: "Why Abraham Akinwumi started SkillsAir: quality, job-ready tech training young Africans can afford. SKILLS AIR LIMITED, RC 9272398, Ikeja, Lagos.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  const team = site.team.filter((member) => member.name && !isPlaceholder(member.photo));
  const founderPhoto = isPlaceholder(site.founder.photo) ? null : site.founder.photo;
  return (
    <>
      <Section tone="navy" level={1}
        title={<>Talent is everywhere in Africa. Access isn&apos;t. We&apos;re fixing that.</>} />

      <Section title="Why I started SkillsAir">
        <div className="grid items-start gap-8 md:grid-cols-[12rem_1fr]">
          {founderPhoto ? (
            <Image src={founderPhoto} alt={site.founder.name} width={192} height={192} className="h-48 w-48 rounded-2xl object-cover" />
          ) : (
            <div className="flex h-48 w-48 items-center justify-center rounded-2xl bg-primary-800 text-4xl font-heading font-bold text-white" aria-hidden="true">AA</div>
          )}
          <div>
            <p className="text-lg leading-relaxed text-neutral-700">&ldquo;{site.founder.story}&rdquo;</p>
            <p className="mt-4 font-semibold text-neutral-900">{site.founder.name}, {site.founder.title}</p>
          </div>
        </div>
      </Section>

      {team.length > 0 && (
        <Section tone="muted" title="The team">
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((member) => (
              <li key={member.name} className="rounded-2xl bg-white p-5 text-center">
                <Image src={member.photo} alt={member.name} width={120} height={120} className="mx-auto h-28 w-28 rounded-full object-cover" />
                <p className="mt-3 font-semibold text-neutral-900">{member.name}</p>
                <p className="text-sm text-neutral-600">{member.role}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section tone="muted" title="A registered Nigerian company">
        <dl className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-5">
            <dt className="text-sm text-neutral-500">Registered name</dt>
            <dd className="mt-1 font-semibold text-neutral-900">{site.legalName}</dd>
          </div>
          <div className="rounded-2xl bg-white p-5">
            <dt className="text-sm text-neutral-500">Corporate Affairs Commission</dt>
            <dd className="mt-1 font-semibold text-neutral-900">{site.cacNumber}</dd>
          </div>
          <div className="rounded-2xl bg-white p-5">
            <dt className="text-sm text-neutral-500">Address</dt>
            <dd className="mt-1 font-semibold text-neutral-900">{site.address}</dd>
          </div>
        </dl>
      </Section>

      <Section title="Join our founding cohort" intro={<p>Applying is free and takes 60 seconds. You&apos;ll see your price and everything you get, then decide.</p>}>
        <PrimaryCTA href="/apply" block>Apply for a scholarship seat →</PrimaryCTA>
      </Section>
    </>
  );
}
