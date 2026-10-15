"use client";

import { useState } from "react";

/**
 * Viewing the closed-window offer already puts the applicant on the waitlist (the backend
 * sets it); this button confirms it to them.
 */
export function WaitlistButton() {
  const [done, setDone] = useState(false);
  return done ? (
    <p role="status" className="rounded-xl bg-success-light p-4 text-center font-semibold text-success-dark">
      You&apos;re on the list. We&apos;ll message you on WhatsApp when the next window opens.
    </p>
  ) : (
    <button
      type="button"
      onClick={() => setDone(true)}
      className="flex min-h-14 w-full items-center justify-center rounded-xl bg-accent-700 px-6 py-4 text-lg font-semibold text-white hover:bg-accent-800"
    >
      Notify me
    </button>
  );
}
