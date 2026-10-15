import type { Metadata } from "next";
import { Section } from "@/components/marketing/Section";
import { UnsubscribeButton } from "@/components/marketing/UnsubscribeButton";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false, follow: false },
};

export default function UnsubscribePage({ searchParams }: { searchParams: { t?: string } }) {
  const token = typeof searchParams.t === "string" ? searchParams.t : "";
  return (
    <Section title="Stop SkillsAir updates">
      <div className="max-w-xl">
        {token ? (
          <UnsubscribeButton token={token} />
        ) : (
          <p className="text-neutral-700">
            To stop updates, use the unsubscribe link at the bottom of any of our emails, reply STOP on WhatsApp, or email{" "}
            <a href={`mailto:${site.supportEmail}`} className="font-medium text-primary-800 underline">{site.supportEmail}</a>.
          </p>
        )}
      </div>
    </Section>
  );
}
