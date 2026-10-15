"use client";

import { useId, useState } from "react";
import Link from "next/link";
import useSWR from "swr";

interface Eligibility {
  cohortLabel: string;
  laptopsPerCohort: number;
  eligible: boolean;
  certificate: { code: string; course: string } | null;
  application: { id: number; status: string; submittedAt: string } | null;
}

const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted. The panel will review every application.",
  shortlisted: "Shortlisted. We may contact you on WhatsApp.",
  awarded: "Awarded! We'll contact you about delivery.",
  not_selected: "Not selected this cohort. Thank you for applying.",
};

const fetcher = (url: string) =>
  fetch(url).then(async (response) => {
    if (!response.ok) throw new Error(((await response.json().catch(() => ({}))) as { message?: string }).message ?? "Request failed");
    return response.json();
  });

export function LaptopSupport() {
  const id = useId();
  const { data, error, mutate } = useSWR<Eligibility>("/api/laptop-support", fetcher, { revalidateOnFocus: false });
  const [story, setStory] = useState("");
  const [plannedUse, setPlannedUse] = useState("");
  const [currentDevice, setCurrentDevice] = useState("");
  const [consent, setConsent] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (story.trim().length < 150) return setFormError("Tell us a bit more about your story (at least 150 characters).");
    if (!currentDevice) return setFormError("Tell us what device you have now.");
    if (plannedUse.trim().length < 20) return setFormError("Tell us how you'll use the laptop (at least 20 characters).");
    setSubmitting(true);
    setFormError("");
    const response = await fetch("/api/laptop-support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ story, plannedUse, currentDevice, consentToFeature: consent }),
    }).catch(() => null);
    setSubmitting(false);
    if (!response?.ok) {
      const result = (await response?.json().catch(() => null)) as { message?: string } | null;
      setFormError(result?.message ?? "Something went wrong. Please try again.");
      return;
    }
    await mutate();
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:py-12">
      <h1 className="text-2xl font-heading font-extrabold text-neutral-900 md:text-3xl">Laptop support</h1>
      <p className="mt-2 text-neutral-600">
        Each cohort, {data?.laptopsPerCohort ?? 2} laptops go to certified graduates who need one most. A panel chooses the applicants with the greatest need and most compelling case. This promotion is approved by the FCCPC.{" "}
        <Link href="/laptop-rules" className="font-medium text-primary-800 underline">Official rules</Link>
      </p>

      {error && <p role="alert" className="mt-6 rounded-xl bg-error-light p-4 text-error-dark">{error.message}</p>}
      {!data && !error && <div className="mt-6 h-48 animate-pulse rounded-2xl bg-neutral-200" />}

      {data?.application && (
        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5">
          <h2 className="font-heading font-semibold text-neutral-900">Your application ({data.cohortLabel})</h2>
          <p className="mt-2 text-neutral-700">{STATUS_LABELS[data.application.status] ?? data.application.status}</p>
        </div>
      )}

      {data && !data.application && !data.eligible && (
        <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-neutral-700">
          <p>
            Laptop support is for learners who hold their SkillsAir certificate from this cohort{data.cohortLabel ? ` (${data.cohortLabel})` : ""}. Finish your programme and claim your certificate, then come back here to apply.
          </p>
          <Link href="/dashboard/courses" className="mt-4 inline-flex min-h-12 items-center rounded-xl bg-accent-700 px-5 font-semibold text-white hover:bg-accent-800">
            Continue learning
          </Link>
        </div>
      )}

      {data && !data.application && data.eligible && (
        <form onSubmit={submit} className="mt-6 space-y-5 rounded-2xl border border-neutral-200 bg-white p-5 md:p-6">
          <p className="text-sm text-neutral-600">
            Eligible with certificate {data.certificate?.code} ({data.certificate?.course}). One application per cohort.
          </p>
          {formError && <p role="alert" className="rounded-xl bg-error-light p-3 text-sm text-error-dark">{formError}</p>}
          <div>
            <label htmlFor={`${id}-story`} className="label">Tell us your story and why you need a laptop</label>
            <textarea id={`${id}-story`} value={story} onChange={(event) => setStory(event.target.value)} maxLength={1500} rows={7} className="input-field text-base" />
            <p className="mt-1 text-xs text-neutral-500">{story.trim().length}/1500 (at least 150)</p>
          </div>
          <div>
            <label htmlFor={`${id}-device`} className="label">What do you use now?</label>
            <select id={`${id}-device`} value={currentDevice} onChange={(event) => setCurrentDevice(event.target.value)} className="input-field min-h-12 text-base">
              <option value="">Choose one</option>
              <option value="none">No device</option>
              <option value="phone_only">Phone only</option>
              <option value="shared_laptop">A shared laptop</option>
              <option value="old_laptop">An old or faulty laptop</option>
            </select>
          </div>
          <div>
            <label htmlFor={`${id}-use`} className="label">What will you do with it?</label>
            <textarea id={`${id}-use`} value={plannedUse} onChange={(event) => setPlannedUse(event.target.value)} maxLength={1500} rows={4} className="input-field text-base" />
          </div>
          <label className="flex items-start gap-3 text-sm text-neutral-700">
            <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5 h-5 w-5 shrink-0" />
            <span>If I&apos;m selected, SkillsAir may share my first name, photo and story. (Optional; it does not affect selection.)</span>
          </label>
          <button type="submit" disabled={submitting} className="flex min-h-12 w-full items-center justify-center rounded-xl bg-accent-700 font-semibold text-white hover:bg-accent-800 disabled:opacity-60">
            {submitting ? "Submitting…" : "Submit my application"}
          </button>
        </form>
      )}
    </div>
  );
}
