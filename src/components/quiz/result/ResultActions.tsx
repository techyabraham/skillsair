"use client";

import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const WAITLIST_EVENT = "sa-quiz-waitlist-joined";

/** One tap: joins the waitlist with the details given at the quiz gate. */
export function WaitlistJoinButton({
  resultId,
  career,
  careerName,
  initiallyJoined,
  variant = "primary",
}: {
  resultId: string;
  career: string;
  careerName: string;
  initiallyJoined: boolean;
  variant?: "primary" | "ghost" | "ghost-dark";
}) {
  const [joined, setJoined] = useState(initiallyJoined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // The page can show the same career's button twice (hero and next steps): keep them in step.
  useEffect(() => {
    const onJoined = (event: Event) => {
      if ((event as CustomEvent<string>).detail === career) setJoined(true);
    };
    window.addEventListener(WAITLIST_EVENT, onJoined);
    return () => window.removeEventListener(WAITLIST_EVENT, onJoined);
  }, [career]);

  if (joined) {
    return (
      <p role="status" className={cn("inline-flex min-h-12 items-center gap-2 font-semibold", variant === "ghost-dark" ? "text-white" : "text-success-dark")}>
        ✓ You&apos;re on the waitlist
      </p>
    );
  }
  return (
    <div>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const response = await fetch(`/api/quiz/result/${encodeURIComponent(resultId)}/waitlist`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ career }),
            });
            const body = (await response.json().catch(() => ({}))) as { message?: string };
            if (!response.ok) throw new Error(body.message || "That didn't work. Please try again.");
            setJoined(true);
            window.dispatchEvent(new CustomEvent(WAITLIST_EVENT, { detail: career }));
            track("quiz_waitlist_join", { career });
          } catch (caught) {
            setError(caught instanceof Error ? caught.message : "That didn't work. Please try again.");
          } finally {
            setBusy(false);
          }
        }}
        className={cn(
          "inline-flex min-h-12 items-center justify-center rounded-xl px-5 py-3 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60",
          variant === "primary" && "bg-navy text-white hover:bg-primary-900 focus-visible:ring-navy",
          variant === "ghost" && "border-2 border-navy text-navy hover:bg-neutral-50 focus-visible:ring-navy",
          variant === "ghost-dark" && "border-2 border-white/70 text-white hover:bg-white/10 focus-visible:ring-white",
        )}
        aria-label={`Join the waitlist for ${careerName}`}
      >
        {busy ? "Joining…" : "Join the waitlist"}
      </button>
      {error && (
        <p role="alert" className={cn("mt-2 text-sm", variant === "ghost-dark" ? "text-orange-100" : "text-error-dark")}>
          {error}
        </p>
      )}
    </div>
  );
}

/** Share the result card (Web Share API with the image when supported, else WhatsApp). */
export function ShareResultButton({ resultId, careerName }: { resultId: string; careerName: string }) {
  const [canShare, setCanShare] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function"), []);

  const text = `My SkillsAir Career Match is ${careerName}. Find yours in 3 minutes:`;
  const quizUrl = "https://skillsair.com/quiz";
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${text} ${quizUrl}`)}`;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {canShare && (
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const response = await fetch(`/quiz/result/${encodeURIComponent(resultId)}/card`);
              const blob = response.ok ? await response.blob() : null;
              const file = blob ? new File([blob], "skillsair-career-match.png", { type: "image/png" }) : null;
              if (file && navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], text: `${text} ${quizUrl}` });
              else await navigator.share({ text, url: quizUrl });
              track("quiz_share", { method: "web_share" });
            } catch {
              // Cancelled by the person, or not allowed: nothing to do.
            } finally {
              setBusy(false);
            }
          }}
          className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-navy px-5 py-3 font-semibold text-navy hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy disabled:opacity-60"
        >
          {busy ? "Preparing…" : "Share my result"}
        </button>
      )}
      <a
        href={whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track("quiz_share", { method: "whatsapp" })}
        className={cn(
          "inline-flex min-h-12 items-center justify-center rounded-xl px-5 py-3 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#075E54]",
          canShare ? "text-[#075E54] underline underline-offset-2" : "border-2 border-[#075E54] text-[#075E54] hover:bg-neutral-50",
        )}
      >
        {canShare ? "Share on WhatsApp" : "Share my result on WhatsApp"}
      </a>
      <a href={`/quiz/result/${encodeURIComponent(resultId)}/card`} download="skillsair-career-match.png" className="text-sm font-medium text-neutral-600 underline underline-offset-2">
        Download the card
      </a>
    </div>
  );
}
