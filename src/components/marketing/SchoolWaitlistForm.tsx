"use client";

import { useState } from "react";
import { LeadDetailsForm } from "@/components/apply/LeadDetailsForm";
import { track } from "@/lib/analytics";
import { site } from "@/content/site";

/** Captures interest in a school whose programmes aren't published yet. */
export function SchoolWaitlistForm({ school, schoolName }: { school: string; schoolName: string }) {
  const [name, setName] = useState("");
  if (name) {
    return (
      <p role="status" className="rounded-xl bg-success-light p-4 text-success-dark">
        You&apos;re on the list, {name}. {site.advisor.name} will message you on WhatsApp when the {schoolName} opens.
      </p>
    );
  }
  return (
    <LeadDetailsForm
      source="apply"
      school={school}
      submitLabel="Tell me when it opens →"
      onSuccess={(_result, details) => {
        track("lead_captured", { source: "school_waitlist", school });
        setName(details.firstName.trim());
      }}
    />
  );
}
