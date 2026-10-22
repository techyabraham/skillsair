"use client";

import { useId, useState } from "react";
import { ConsentCheckbox, PrivacyNote } from "@/components/marketing/ConsentCheckbox";
import { EMAIL_ERROR, PHONE_ERROR, isValidEmail, normalizePhone } from "@/lib/phone";
import { suggestEmail } from "@/lib/email-typos";
import { MARKETING_CONSENT_TEXT, site } from "@/content/site";

export interface LeadDetails {
  firstName: string;
  phone: string;
  email: string;
  marketingConsent: boolean;
  message?: string;
}

export interface LeadCaptureResult {
  leadId: number;
  hasAccount: boolean;
}

interface LeadDetailsFormProps {
  source: "apply" | "quiz" | "curriculum_request" | "contact" | "employer";
  submitLabel: string;
  initial?: Partial<LeadDetails>;
  school?: string;
  programme?: string;
  withMessage?: boolean;
  messageLabel?: string;
  onSuccess: (result: LeadCaptureResult, details: LeadDetails) => void;
  onChange?: (details: LeadDetails) => void;
  /** Put the cursor in the email field (after "use a different email"). */
  focusEmail?: boolean;
}

const SERVER_ERROR = `Something went wrong on our side. Your details are safe. Tap Continue again, or WhatsApp ${site.advisor.name} on ${site.whatsapp.display}.`;

/** First name, WhatsApp number and email, with optional consent. Saves the lead immediately. */
export function LeadDetailsForm({
  source,
  submitLabel,
  initial,
  school,
  programme,
  withMessage = false,
  messageLabel = "How can we help?",
  onSuccess,
  onChange,
  focusEmail = false,
}: LeadDetailsFormProps) {
  const id = useId();
  const [details, setDetails] = useState<LeadDetails>({
    firstName: initial?.firstName ?? "",
    phone: initial?.phone ?? "",
    email: initial?.email ?? "",
    marketingConsent: initial?.marketingConsent ?? false,
    message: initial?.message ?? "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LeadDetails, string>>>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [website, setWebsite] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const emailSuggestion = emailTouched ? suggestEmail(details.email) : null;

  const update = (patch: Partial<LeadDetails>) => {
    const next = { ...details, ...patch };
    setDetails(next);
    onChange?.(next);
  };

  const validate = (field: keyof LeadDetails, value: string): string => {
    if (field === "firstName") return value.trim() ? "" : "Tell us your first name.";
    if (field === "phone") return normalizePhone(value) ? "" : PHONE_ERROR;
    if (field === "email") return isValidEmail(value) ? "" : EMAIL_ERROR;
    if (field === "message" && withMessage) return value.trim() ? "" : "Tell us a little about what you need.";
    return "";
  };

  const onBlur = (field: keyof LeadDetails) => () => {
    const value = String(details[field] ?? "");
    if (!value) return;
    setErrors((current) => ({ ...current, [field]: validate(field, value) }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const fields: Array<keyof LeadDetails> = ["firstName", "phone", "email", ...(withMessage ? (["message"] as const) : [])];
    const nextErrors: Partial<Record<keyof LeadDetails, string>> = {};
    for (const field of fields) {
      const message = validate(field, String(details[field] ?? ""));
      if (message) nextErrors[field] = message;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      document.getElementById(`${id}-${Object.keys(nextErrors)[0]}`)?.focus();
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: details.firstName.trim(),
          phone: normalizePhone(details.phone),
          email: details.email.trim(),
          marketingConsent: details.marketingConsent,
          marketingConsentText: details.marketingConsent ? MARKETING_CONSENT_TEXT : undefined,
          message: withMessage ? details.message : undefined,
          source,
          school,
          programme,
          website,
        }),
      });
      const result = (await response.json().catch(() => ({}))) as Partial<LeadCaptureResult> & { message?: string; fields?: Record<string, string> };
      if (!response.ok) {
        if (result.fields?.phone) setErrors((current) => ({ ...current, phone: PHONE_ERROR }));
        setFormError(response.status === 429 ? "Too many attempts. Please wait a few minutes and try again." : result.fields?.phone ? "" : SERVER_ERROR);
        return;
      }
      onSuccess({ leadId: Number(result.leadId ?? 0), hasAccount: Boolean(result.hasAccount) }, details);
    } catch {
      setFormError(SERVER_ERROR);
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass = (field: keyof LeadDetails) =>
    `w-full min-h-12 rounded-xl border bg-white px-4 py-3 text-base text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-800/30 ${
      errors[field] ? "border-error" : "border-neutral-300 focus:border-primary-800"
    }`;

  const errorText = (field: keyof LeadDetails) =>
    errors[field] ? (
      <p id={`${id}-${field}-error`} className="mt-1.5 text-sm text-error-dark">
        {errors[field]}
      </p>
    ) : null;

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {formError && (
        <div role="alert" className="rounded-xl border border-error/30 bg-error-light p-3.5 text-sm text-error-dark">
          {formError}
        </div>
      )}
      <div>
        <label htmlFor={`${id}-firstName`} className="label">First name</label>
        <input
          id={`${id}-firstName`}
          className={fieldClass("firstName")}
          placeholder="e.g. Tobi"
          autoComplete="given-name"
          value={details.firstName}
          onChange={(event) => update({ firstName: event.target.value })}
          onBlur={onBlur("firstName")}
          aria-invalid={Boolean(errors.firstName)}
          aria-describedby={errors.firstName ? `${id}-firstName-error` : undefined}
        />
        {errorText("firstName")}
      </div>
      <div>
        <label htmlFor={`${id}-phone`} className="label">WhatsApp number</label>
        <input
          id={`${id}-phone`}
          className={fieldClass("phone")}
          placeholder="0818 000 0000"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={details.phone}
          onChange={(event) => update({ phone: event.target.value })}
          onBlur={onBlur("phone")}
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={`${id}-phone-help${errors.phone ? ` ${id}-phone-error` : ""}`}
        />
        <p id={`${id}-phone-help`} className="mt-1.5 text-sm text-neutral-500">
          {site.advisor.name} will send your {source === "contact" || source === "employer" ? "reply" : "offer"} here. No spam, ever.
        </p>
        {errorText("phone")}
      </div>
      <div>
        <label htmlFor={`${id}-email`} className="label">Email</label>
        <input
          id={`${id}-email`}
          className={fieldClass("email")}
          placeholder="you@example.com"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoFocus={focusEmail}
          value={details.email}
          onChange={(event) => update({ email: event.target.value })}
          onBlur={() => {
            setEmailTouched(true);
            onBlur("email")();
          }}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={[errors.email ? `${id}-email-error` : "", emailSuggestion ? `${id}-email-hint` : ""].filter(Boolean).join(" ") || undefined}
        />
        {emailSuggestion && (
          <p id={`${id}-email-hint`} className="mt-1.5 text-sm text-neutral-700" role="status">
            Did you mean{" "}
            <button
              type="button"
              onClick={() => update({ email: emailSuggestion })}
              className="font-semibold text-primary-800 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-800"
            >
              {emailSuggestion}
            </button>
            ?
          </p>
        )}
        {errorText("email")}
      </div>
      {withMessage && (
        <div>
          <label htmlFor={`${id}-message`} className="label">{messageLabel}</label>
          <textarea
            id={`${id}-message`}
            className={`${fieldClass("message")} min-h-28`}
            value={details.message}
            onChange={(event) => update({ message: event.target.value })}
            onBlur={onBlur("message")}
            maxLength={2000}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? `${id}-message-error` : undefined}
          />
          {errorText("message")}
        </div>
      )}
      {/* Honeypot for bots; hidden from people and assistive technology. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor={`${id}-website`}>Website</label>
        <input id={`${id}-website`} tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} />
      </div>
      <ConsentCheckbox id={`${id}-consent`} checked={details.marketingConsent} onChange={(marketingConsent) => update({ marketingConsent })} />
      <button
        type="submit"
        disabled={submitting}
        className="flex min-h-12 w-full items-center justify-center rounded-xl bg-accent-700 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-accent-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-700 focus-visible:ring-offset-2 disabled:opacity-60"
      >
        {submitting ? "Saving…" : submitLabel}
      </button>
      <PrivacyNote />
    </form>
  );
}
