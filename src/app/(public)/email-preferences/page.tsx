import type { Metadata } from "next";
import { Section } from "@/components/marketing/Section";
import { EmailPreferencesForm } from "@/components/marketing/EmailPreferencesForm";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Email preferences",
  robots: { index: false, follow: false },
};

export default function EmailPreferencesPage({ searchParams }: { searchParams: { token?: string } }) {
  const token = typeof searchParams.token === "string" ? searchParams.token : "";
  return (
    <Section level={1} title="Email preferences">
      <div className="max-w-xl">
        {token ? (
          <EmailPreferencesForm token={token} />
        ) : (
          <p className="text-neutral-700">
            Use the &ldquo;Email preferences&rdquo; link at the bottom of any SkillsAir email to change what we send you. You can also reply STOP on WhatsApp, or email{" "}
            <a href={`mailto:${site.supportEmail}`} className="font-medium text-primary-800 underline">{site.supportEmail}</a>.
          </p>
        )}
      </div>
    </Section>
  );
}
