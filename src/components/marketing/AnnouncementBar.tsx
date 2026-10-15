"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const DISMISS_KEY = "sa_announcement_dismissed";

/** Shown only while a real scholarship window is open. Dismissal is remembered per window. */
export function AnnouncementBar({ closesOn, closesAt }: { closesOn: string; closesAt: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(window.localStorage.getItem(DISMISS_KEY) !== closesAt);
    } catch {
      setVisible(true);
    }
  }, [closesAt]);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      window.localStorage.setItem(DISMISS_KEY, closesAt);
    } catch {
      // Storage unavailable: it simply shows again next time.
    }
  };

  return (
    <div className="relative z-50 bg-navy text-white">
      <div className="container-wide flex min-h-11 items-center justify-center gap-3 py-2 pr-10 text-center text-sm">
        <p>
          🎓 Access Scholarship is open. Apply by <strong>{closesOn}</strong>.{" "}
          <Link href="/apply" className="font-semibold text-accent-300 underline underline-offset-2 hover:text-white">
            Apply now →
          </Link>
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss announcement"
          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
