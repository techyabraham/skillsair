"use client";

import { useState } from "react";
import { LeadDetailsForm } from "@/components/apply/LeadDetailsForm";
import { site } from "@/content/site";

/** Contact form: creates a lead with source "contact" so the message reaches Imisi's queue. */
export function ContactForm({ source = "contact", messageLabel }: { source?: "contact" | "employer"; messageLabel?: string }) {
  const [sentTo, setSentTo] = useState("");
  if (sentTo) {
    return (
      <p role="status" className="rounded-xl bg-success-light p-4 text-success-dark">
        Thanks, {sentTo}. {site.advisor.name} will reply on WhatsApp or email ({site.advisor.hoursShort}).
      </p>
    );
  }
  return (
    <LeadDetailsForm
      source={source}
      submitLabel="Send message →"
      withMessage
      messageLabel={messageLabel ?? "How can we help?"}
      onSuccess={(_result, details) => setSentTo(details.firstName.trim())}
    />
  );
}
