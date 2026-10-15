"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { normalizePhone, PHONE_ERROR } from "@/lib/phone";
import { track } from "@/lib/analytics";
import { MARKETING_CONSENT_TEXT, site } from "@/content/site";

const SHOWN_KEY = "sa_soft_capture_shown";

function alreadyShown(): boolean {
  try {
    return window.sessionStorage.getItem(SHOWN_KEY) === "1";
  } catch {
    return false;
  }
}

function markShown(): void {
  try {
    window.sessionStorage.setItem(SHOWN_KEY, "1");
  } catch {
    // Without storage it may show once per page view instead of once per session.
  }
}

/**
 * "Want this curriculum on WhatsApp?" Shown once per session: on exit intent (desktop) or
 * after 70% scroll (phones). Creates a lead with source "curriculum_request".
 */
export function SoftCapture({ programme, programmeTitle }: { programme: string; programmeTitle: string }) {
  const id = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle");

  useEffect(() => {
    if (alreadyShown()) return;
    const open = () => {
      if (alreadyShown() || dialogRef.current?.open) return;
      markShown();
      dialogRef.current?.showModal();
    };
    const desktop = window.matchMedia("(min-width: 768px) and (pointer: fine)").matches;
    if (desktop) {
      const onLeave = (event: MouseEvent) => {
        if (event.clientY <= 0) open();
      };
      document.addEventListener("mouseout", onLeave);
      return () => document.removeEventListener("mouseout", onLeave);
    }
    const onScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable > 0 && window.scrollY / scrollable >= 0.7) open();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!firstName.trim()) return setError("Tell us your first name.");
    const e164 = normalizePhone(phone);
    if (!e164) return setError(PHONE_ERROR);
    setError("");
    setStatus("saving");
    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: firstName.trim(),
        phone: e164,
        programme,
        source: "curriculum_request",
        marketingConsent: consent,
        marketingConsentText: consent ? MARKETING_CONSENT_TEXT : undefined,
      }),
    }).catch(() => null);
    if (!response?.ok) {
      setStatus("idle");
      setError(`Something went wrong on our side. WhatsApp ${site.advisor.name} on ${site.whatsapp.display} instead.`);
      return;
    }
    track("lead_captured", { source: "curriculum_request", programme });
    setStatus("done");
  };

  return (
    <dialog ref={dialogRef} className="w-[min(28rem,calc(100vw-2rem))] rounded-2xl p-0 backdrop:bg-neutral-900/60" aria-labelledby={`${id}-title`}>
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id={`${id}-title`} className="text-xl font-heading font-bold text-neutral-900">Want this curriculum on WhatsApp?</h2>
          <button type="button" onClick={() => dialogRef.current?.close()} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl hover:bg-neutral-100" aria-label="Close">
            ✕
          </button>
        </div>
        {status === "done" ? (
          <div className="mt-4 space-y-4">
            <p className="text-neutral-700">Thanks, {firstName.trim()}! {site.advisor.name} will send the {programmeTitle} details to your WhatsApp shortly.</p>
            <Link href={`/apply?programme=${encodeURIComponent(programme)}`} className="flex min-h-12 items-center justify-center rounded-xl bg-accent-700 font-semibold text-white hover:bg-accent-800">
              See my scholarship price →
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="mt-4 space-y-4">
            {error && <p role="alert" className="rounded-xl bg-error-light p-3 text-sm text-error-dark">{error}</p>}
            <div>
              <label htmlFor={`${id}-name`} className="label">First name</label>
              <input id={`${id}-name`} value={firstName} onChange={(event) => setFirstName(event.target.value)} autoComplete="given-name" placeholder="e.g. Tobi" className="input-field min-h-12 text-base" />
            </div>
            <div>
              <label htmlFor={`${id}-phone`} className="label">WhatsApp number</label>
              <input id={`${id}-phone`} value={phone} onChange={(event) => setPhone(event.target.value)} type="tel" inputMode="tel" autoComplete="tel" placeholder="0818 000 0000" className="input-field min-h-12 text-base" />
            </div>
            <label className="flex items-start gap-3 text-sm text-neutral-700">
              <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 rounded border-neutral-300" />
              <span>{MARKETING_CONSENT_TEXT}</span>
            </label>
            <button type="submit" disabled={status === "saving"} className="flex min-h-12 w-full items-center justify-center rounded-xl bg-accent-700 font-semibold text-white hover:bg-accent-800 disabled:opacity-60">
              {status === "saving" ? "Sending…" : "Send it to my WhatsApp"}
            </button>
            <p className="text-center text-xs text-neutral-500">
              We never sell your data. <Link href="/privacy" className="underline">Privacy notice</Link>
            </p>
          </form>
        )}
      </div>
    </dialog>
  );
}
