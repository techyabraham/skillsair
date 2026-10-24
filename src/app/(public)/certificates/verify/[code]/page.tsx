import type { Metadata } from "next";
import { CertificateVerifier } from "@/components/marketing/CertificateVerifier";

interface PageProps {
  params: { code: string };
}

export function generateMetadata({ params }: PageProps): Metadata {
  return {
    title: `Verify certificate ${params.code.toUpperCase()}`,
    description: "Check a SkillsAir certificate: the learner, the programme, the date and the final exam result.",
    robots: { index: false, follow: false },
  };
}

/** The link on every SkillsAir certificate: employers land here and see the check straight away. */
export default function VerifyCertificatePage({ params }: PageProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:py-16">
      <h1 className="font-heading text-3xl font-bold text-navy">Certificate check</h1>
      <p className="mt-3 text-neutral-700">
        SkillsAir certificates are earned by finishing every lesson and chapter quiz and passing a final exam. This page shows whether a certificate is genuine.
      </p>
      <div className="mt-8">
        <CertificateVerifier initialCode={params.code.toUpperCase()} />
      </div>
    </div>
  );
}
