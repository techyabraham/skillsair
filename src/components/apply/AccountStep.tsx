"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { EMAIL_ERROR, PHONE_ERROR, isValidEmail, normalizePhone } from "@/lib/phone";
import { track } from "@/lib/analytics";
import { naira, site } from "@/content/site";
import { cn } from "@/lib/utils";

interface LeadProfile {
  firstName: string;
  email: string;
  phone: string;
  marketingConsent: boolean;
}

/** The backend's password rules, shown live. */
const PASSWORD_RULES: Array<{ label: string; test: (value: string) => boolean }> = [
  { label: "8+ characters", test: (value) => value.length >= 8 },
  { label: "An uppercase letter", test: (value) => /[A-Z]/.test(value) },
  { label: "A lowercase letter", test: (value) => /[a-z]/.test(value) },
  { label: "A number", test: (value) => /\d/.test(value) },
  { label: "A symbol", test: (value) => /[^a-zA-Z\d]/.test(value) },
];

function ReadOnlyField({ id, label, value, editing, onEdit, onChange, type = "text", error }: {
  id: string;
  label: string;
  value: string;
  editing: boolean;
  onEdit: () => void;
  onChange: (value: string) => void;
  type?: string;
  error?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="label">{label}</label>
        {!editing && (
          <button type="button" onClick={onEdit} className="text-sm font-medium text-primary-800 underline underline-offset-2">
            Edit
          </button>
        )}
      </div>
      <input
        id={id}
        type={type}
        value={value}
        readOnly={!editing}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          "w-full min-h-12 rounded-xl border px-4 py-3 text-base",
          editing ? "border-neutral-300 bg-white focus:border-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-800/30" : "border-neutral-200 bg-neutral-100 text-neutral-700",
          error && "border-error",
        )}
      />
      {error && <p id={`${id}-error`} className="mt-1.5 text-sm text-error-dark">{error}</p>}
    </div>
  );
}

export function AccountStep() {
  const id = useId();
  const router = useRouter();
  const params = useSearchParams();
  const programme = params.get("programme") || "";
  const { register: registerUser } = useAuth();
  const [profile, setProfile] = useState<LeadProfile | null>(null);
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [existingAccount, setExistingAccount] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!programme) {
      router.replace("/apply");
      return;
    }
    fetch("/api/leads/me", { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) {
          router.replace(`/apply?programme=${encodeURIComponent(programme)}`);
          return;
        }
        if (!response.ok) throw new Error("unavailable");
        const lead = (await response.json()) as LeadProfile;
        setProfile({ firstName: lead.firstName, email: lead.email, phone: lead.phone, marketingConsent: lead.marketingConsent });
        if (!lead.email) setEditing((current) => ({ ...current, email: true }));
      })
      .catch(() => setFormError(`We couldn't load your details. Refresh the page, or WhatsApp ${site.advisor.name} on ${site.whatsapp.display}.`));
  }, [programme, router]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!profile) return;
    const nextErrors: Record<string, string> = {};
    if (!profile.firstName.trim()) nextErrors.firstName = "Tell us your first name.";
    if (!lastName.trim()) nextErrors.lastName = "Add your last name as it should appear on your certificate.";
    if (!isValidEmail(profile.email)) nextErrors.email = EMAIL_ERROR;
    if (!normalizePhone(profile.phone)) nextErrors.phone = PHONE_ERROR;
    if (!PASSWORD_RULES.every((rule) => rule.test(password))) nextErrors.password = "Your password needs every item on the checklist.";
    if (!acceptTerms) nextErrors.terms = "Please agree to the Terms and Privacy Notice.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    setFormError("");
    try {
      // Keep the lead on the programme they are about to pay for.
      await fetch("/api/leads/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programme }),
      }).catch(() => null);
      await registerUser({
        firstName: profile.firstName.trim(),
        lastName: lastName.trim(),
        email: profile.email.trim(),
        phone: normalizePhone(profile.phone) ?? profile.phone,
        password,
        acceptTerms,
      });
      track("account_created", { programme });
      router.push(`/checkout?course=${encodeURIComponent(programme)}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (/already exists/i.test(message)) setExistingAccount(true);
      else setFormError(message || "Something went wrong on our side. Your details are safe. Try again.");
      setSubmitting(false);
    }
  };

  if (!profile) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        {formError ? <p role="alert" className="rounded-xl border border-error/30 bg-error-light p-4 text-error-dark">{formError}</p> : <div className="h-80 animate-pulse rounded-2xl bg-neutral-200" />}
      </div>
    );
  }

  const loginHref = `/login?next=${encodeURIComponent(`/checkout?course=${programme}`)}`;

  return (
    <div className="mx-auto max-w-xl px-4 py-8 md:py-12">
      <h1 className="text-2xl font-heading font-bold text-neutral-900 md:text-3xl">Last step: create a password to lock in your seat</h1>

      {existingAccount ? (
        <div className="mt-6 rounded-2xl border border-primary-200 bg-white p-6">
          <p className="text-neutral-700">You already have a SkillsAir account with this email. Log in to continue to payment.</p>
          <Link href={loginHref} className="mt-5 flex min-h-12 w-full items-center justify-center rounded-xl bg-accent-700 px-6 py-3 font-semibold text-white hover:bg-accent-800">
            Log in →
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="mt-6 space-y-5">
          {formError && <p role="alert" className="rounded-xl border border-error/30 bg-error-light p-3.5 text-sm text-error-dark">{formError}</p>}
          <ReadOnlyField id={`${id}-first`} label="First name" value={profile.firstName} editing={Boolean(editing.firstName)} onEdit={() => setEditing((c) => ({ ...c, firstName: true }))} onChange={(firstName) => setProfile({ ...profile, firstName })} error={errors.firstName} />
          <div>
            <label htmlFor={`${id}-last`} className="label">Last name</label>
            <input
              id={`${id}-last`}
              autoComplete="family-name"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              aria-invalid={Boolean(errors.lastName)}
              aria-describedby={`${id}-last-help${errors.lastName ? ` ${id}-last-error` : ""}`}
              className={cn("w-full min-h-12 rounded-xl border bg-white px-4 py-3 text-base focus:border-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-800/30", errors.lastName ? "border-error" : "border-neutral-300")}
            />
            <p id={`${id}-last-help`} className="mt-1.5 text-sm text-neutral-500">As it should appear on your certificate.</p>
            {errors.lastName && <p id={`${id}-last-error`} className="mt-1.5 text-sm text-error-dark">{errors.lastName}</p>}
          </div>
          <ReadOnlyField id={`${id}-email`} label="Email" type="email" value={profile.email} editing={Boolean(editing.email)} onEdit={() => setEditing((c) => ({ ...c, email: true }))} onChange={(email) => setProfile({ ...profile, email })} error={errors.email} />
          <ReadOnlyField id={`${id}-phone`} label="WhatsApp number" type="tel" value={profile.phone} editing={Boolean(editing.phone)} onEdit={() => setEditing((c) => ({ ...c, phone: true }))} onChange={(phone) => setProfile({ ...profile, phone })} error={errors.phone} />

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor={`${id}-password`} className="label">Password</label>
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="text-sm font-medium text-primary-800" aria-controls={`${id}-password`}>
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <input
              id={`${id}-password`}
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={`${id}-rules`}
              className={cn("w-full min-h-12 rounded-xl border bg-white px-4 py-3 text-base focus:border-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-800/30", errors.password ? "border-error" : "border-neutral-300")}
            />
            <ul id={`${id}-rules`} className="mt-3 grid grid-cols-1 gap-1.5 text-sm sm:grid-cols-2">
              {PASSWORD_RULES.map((rule) => {
                const met = rule.test(password);
                return (
                  <li key={rule.label} className={met ? "text-success-dark" : "text-neutral-500"}>
                    <span aria-hidden="true">{met ? "✓" : "○"}</span> {rule.label}
                    <span className="sr-only">{met ? " (done)" : " (not yet)"}</span>
                  </li>
                );
              })}
            </ul>
            {errors.password && <p className="mt-1.5 text-sm text-error-dark">{errors.password}</p>}
          </div>

          <div>
            <label className="flex cursor-pointer items-start gap-3 text-sm text-neutral-700">
              <input type="checkbox" checked={acceptTerms} onChange={(event) => setAcceptTerms(event.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 rounded border-neutral-300 text-primary-800" aria-invalid={Boolean(errors.terms)} />
              <span>
                I agree to the{" "}
                <Link href="/terms" className="font-medium text-primary-800 underline underline-offset-2">Terms</Link> and{" "}
                <Link href="/privacy" className="font-medium text-primary-800 underline underline-offset-2">Privacy Notice</Link>.
              </span>
            </label>
            {errors.terms && <p className="mt-1.5 text-sm text-error-dark">{errors.terms}</p>}
          </div>

          <button type="submit" disabled={submitting} className="flex min-h-12 w-full items-center justify-center rounded-xl bg-accent-700 px-6 py-3 text-base font-semibold text-white hover:bg-accent-800 disabled:opacity-60">
            {submitting ? "Creating your account…" : "Create account & continue to payment →"}
          </button>
          <p className="text-center text-sm text-neutral-600">
            Next: pay your offer price by card or bank transfer on Paystack. The {naira(site.programme.certificatePrice)} certificate is paid only when you finish.
          </p>
          <p className="text-center text-sm text-neutral-600">
            Already have an account? <Link href={loginHref} className="font-medium text-primary-800 underline underline-offset-2">Log in</Link>
          </p>
        </form>
      )}
    </div>
  );
}
