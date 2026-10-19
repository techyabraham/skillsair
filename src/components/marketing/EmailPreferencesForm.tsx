"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { site } from "@/content/site";

interface Preferences {
  firstName: string;
  email: string;
  offers: boolean;
  learningReminders: boolean;
  hasLearningReminders: boolean;
}

type Status = "loading" | "ready" | "saving" | "saved" | "error" | "invalid";

interface ToggleProps {
  id: string;
  label: string;
  help: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

function Toggle({ id, label, help, checked, onChange }: ToggleProps) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-4 rounded-xl border border-neutral-200 bg-white p-4">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 rounded border-neutral-300 text-primary-800 focus:ring-primary-800"
      />
      <span>
        <span className="block font-semibold text-neutral-900">{label}</span>
        <span className="mt-1 block text-sm text-neutral-600">{help}</span>
      </span>
    </label>
  );
}

/** The two email switches plus "unsubscribe from all marketing". Receipts and account emails always send. */
export function EmailPreferencesForm({ token }: { token: string }) {
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/email/preferences?token=${encodeURIComponent(token)}`)
      .then(async (response) => {
        const body = (await response.json().catch(() => null)) as (Preferences & { message?: string }) | null;
        if (cancelled) return;
        if (!response.ok || !body) {
          setStatus(response.status === 404 || response.status === 400 ? "invalid" : "error");
          setMessage(body?.message || "");
          return;
        }
        setPrefs(body);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const save = async (change: { offers?: boolean; learningReminders?: boolean; unsubscribeAll?: boolean }) => {
    setStatus("saving");
    const response = await fetch("/api/email/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, ...change }),
    }).catch(() => null);
    const body = (await response?.json().catch(() => null)) as (Preferences & { message?: string }) | null;
    if (!response?.ok || !body) {
      setStatus("error");
      setMessage(body?.message || "");
      return;
    }
    setPrefs(body);
    setStatus("saved");
  };

  if (status === "loading") {
    return (
      <div className="space-y-3" aria-busy="true">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!prefs) {
    return (
      <p role="alert" className="rounded-xl border border-neutral-200 bg-white p-4 text-neutral-700">
        {status === "invalid" ? message || "This link has expired or is not valid." : "We couldn't load your email settings just now."} You can also reply STOP on WhatsApp, or email{" "}
        <a href={`mailto:${site.supportEmail}`} className="font-medium text-primary-800 underline">{site.supportEmail}</a> and we&apos;ll update it for you.
      </p>
    );
  }

  const edit = (change: Partial<Preferences>) => {
    setPrefs({ ...prefs, ...change });
    setStatus("ready");
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void save({ offers: prefs.offers, ...(prefs.hasLearningReminders ? { learningReminders: prefs.learningReminders } : {}) });
      }}
      className="space-y-4"
    >
      <p className="text-neutral-700">
        {prefs.firstName ? `Hi ${prefs.firstName}. ` : ""}Choose what we send to <strong>{prefs.email}</strong>.
      </p>
      <Toggle
        id="pref-offers"
        label="Offers and scholarship news"
        help={
          prefs.hasLearningReminders
            ? "Scholarship windows, deadlines and programme offers by email."
            : "Scholarship windows, deadlines and programme offers by email and WhatsApp."
        }
        checked={prefs.offers}
        onChange={(offers) => edit({ offers })}
      />
      {prefs.hasLearningReminders && (
        <Toggle
          id="pref-learning"
          label="Learning reminders"
          help="A nudge when you haven't studied for a while, and a notice before your plan renews."
          checked={prefs.learningReminders}
          onChange={(learningReminders) => edit({ learningReminders })}
        />
      )}
      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
        <Button type="submit" size="lg" loading={status === "saving"} disabled={status === "saving"}>
          Save my choices
        </Button>
        <button
          type="button"
          disabled={status === "saving"}
          onClick={() => void save({ unsubscribeAll: true })}
          className="min-h-12 rounded-xl px-4 text-sm font-semibold text-neutral-700 underline underline-offset-2 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-800 disabled:opacity-60"
        >
          Unsubscribe from all marketing
        </button>
      </div>
      {status === "saved" && (
        <p role="status" className="rounded-xl bg-success-light p-4 text-success-dark">
          Done. We&apos;ll still send receipts and account emails, because you need those.
        </p>
      )}
      {status === "error" && (
        <p role="alert" className="text-error-dark">
          {message || "That didn't save."} Please try again, or email {site.supportEmail}.
        </p>
      )}
    </form>
  );
}
