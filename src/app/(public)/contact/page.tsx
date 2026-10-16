import type { Metadata } from "next";
import Image from "next/image";
import { Section } from "@/components/marketing/Section";
import { images, unsplashUrl } from "@/content/images";
import { ContactForm } from "@/components/marketing/ContactForm";
import { site, whatsappLink } from "@/content/site";

export const metadata: Metadata = {
  title: "Contact SkillsAir",
  description: "WhatsApp, email or visit SkillsAir. SKILLS AIR LIMITED, Osifila Street, Anifowose, Ikeja, Lagos.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <Section level={1}
        title={<>Talk to us</>} intro={<p>The fastest way to reach us is WhatsApp. {site.advisor.name} replies {site.advisor.hours}.</p>}>
      <div className="grid gap-10 lg:grid-cols-2">
        <dl className="space-y-6">
          <div>
            <dt className="text-sm font-semibold uppercase tracking-wider text-neutral-500">WhatsApp</dt>
            <dd className="mt-1 text-lg">
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary-800 underline underline-offset-2">
                {site.whatsapp.display}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Email</dt>
            <dd className="mt-1 text-lg">
              <a href={`mailto:${site.supportEmail}`} className="font-semibold text-primary-800 underline underline-offset-2">{site.supportEmail}</a>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Address</dt>
            <dd className="mt-1 text-lg text-neutral-800">
              {site.legalName}
              <br />
              {site.address}
              <br />
              <span className="text-base text-neutral-600">{site.cacNumber}</span>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Hours</dt>
            <dd className="mt-1 text-lg text-neutral-800">{site.advisor.hours}</dd>
          </div>
        </dl>
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <div className="relative mb-6 aspect-[16/9] overflow-hidden rounded-xl">
            <Image src={unsplashUrl(images.support.id, 900)} alt={images.support.alt} fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
          </div>
          <h2 className="text-xl font-heading font-bold text-neutral-900">Send us a message</h2>
          <div className="mt-5">
            <ContactForm />
          </div>
        </div>
      </div>
    </Section>
  );
}
