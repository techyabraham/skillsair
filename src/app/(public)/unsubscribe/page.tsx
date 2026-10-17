import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Section } from "@/components/marketing/Section";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false, follow: false },
};

/** Older emails link here with ?t=…; the preference centre now handles unsubscribing. */
export default function UnsubscribePage({ searchParams }: { searchParams: { t?: string } }) {
  const token = typeof searchParams.t === "string" ? searchParams.t : "";
  if (token) redirect(`/email-preferences?token=${encodeURIComponent(token)}`);
  return (
    <Section title="Stop SkillsAir updates">
      <div className="max-w-xl">
        <p className="text-neutral-700">
          To stop updates, use the &ldquo;Email preferences&rdquo; or &ldquo;Unsubscribe&rdquo; link at the bottom of any of our emails, reply STOP on WhatsApp, or email{" "}
          <a href={`mailto:${site.supportEmail}`} className="font-medium text-primary-800 underline">{site.supportEmail}</a>.
        </p>
      </div>
    </Section>
  );
}
