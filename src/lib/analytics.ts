/**
 * Funnel analytics (GA4 + Meta Pixel). Scripts load only when the IDs are configured and the
 * visitor accepted measurement cookies; until then `track` is a no-op.
 */

export const CONSENT_COOKIE = "sa_consent";
export type ConsentChoice = "all" | "essential";

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";
export const analyticsConfigured = Boolean(GA_ID || META_PIXEL_ID);

export type FunnelEvent =
  | "view_school"
  | "view_programme"
  | "preview_lesson_play"
  | "apply_start"
  | "apply_step_complete"
  | "lead_captured"
  | "qualifier_complete"
  | "offer_view"
  | "account_created"
  | "checkout_start"
  | "payment_success"
  | "whatsapp_click"
  | "quiz_complete"
  | "experiment_variant"
  | "plan_viewed"
  | "plan_continue_clicked"
  | "plan_reset"
  | "plan_pace_changed"
  | "plan_week_completed"
  | "plan_chapter_view_cancelled"
  | "plan_ahead";

const META_EVENTS: Partial<Record<FunnelEvent, string>> = {
  lead_captured: "Lead",
  account_created: "CompleteRegistration",
  checkout_start: "InitiateCheckout",
  payment_success: "Purchase",
};

type Params = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

export function readConsent(): ConsentChoice | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((row) => row.startsWith(`${CONSENT_COOKIE}=`));
  const value = match?.split("=")[1];
  return value === "all" || value === "essential" ? value : null;
}

export function writeConsent(choice: ConsentChoice): void {
  document.cookie = `${CONSENT_COOKIE}=${choice}; path=/; max-age=${180 * 24 * 60 * 60}; samesite=lax`;
  window.dispatchEvent(new CustomEvent("sa-consent", { detail: choice }));
}

export function track(event: FunnelEvent, params: Params = {}): void {
  if (typeof window === "undefined" || readConsent() !== "all") return;
  try {
    window.gtag?.("event", event, params);
    const metaEvent = META_EVENTS[event];
    if (metaEvent) window.fbq?.("track", metaEvent, params);
  } catch {
    // Analytics must never break the page.
  }
}
