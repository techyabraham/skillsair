"use client";

import { useState } from "react";

/** A button (not an automatic GET) so link scanners in mail apps can't unsubscribe people. */
export function UnsubscribeButton({ token }: { token: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  if (state === "done") {
    return <p role="status" className="rounded-xl bg-success-light p-4 text-success-dark">Done. You won&apos;t get any more marketing emails or WhatsApp updates from SkillsAir.</p>;
  }
  return (
    <div>
      <p className="text-neutral-700">You&apos;ll stop getting scholarship deadlines and offers by email and WhatsApp. Messages about payments you make will still reach you.</p>
      <button
        type="button"
        disabled={state === "busy"}
        onClick={async () => {
          setState("busy");
          const response = await fetch("/api/unsubscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) }).catch(() => null);
          setState(response?.ok ? "done" : "error");
        }}
        className="mt-5 flex min-h-12 items-center justify-center rounded-xl bg-primary-800 px-6 font-semibold text-white hover:bg-primary-900 disabled:opacity-60"
      >
        {state === "busy" ? "Unsubscribing…" : "Unsubscribe me"}
      </button>
      {state === "error" && <p role="alert" className="mt-3 text-error-dark">That link didn&apos;t work. Reply STOP on WhatsApp or email hello@skillsair.com and we&apos;ll remove you.</p>}
    </div>
  );
}
