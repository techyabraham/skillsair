/** The personal offer returned by the backend `GET /api/offers/:courseSlug`. */
export interface Offer {
  courseId: number;
  slug: string;
  programme: string;
  school: string;
  schoolSlug: string;
  price: number;
  standardPrice: number;
  standardMonthlyPrice: number | null;
  effectivePrice: number;
  windowOpen: boolean;
  closesAt: string | null;
  cohortLabel: string;
  durationMonths: number;
  weeklyHours: number;
  requirements: string[];
  objectives: string[];
  phoneFriendly: boolean;
  phoneFriendlyAlternatives: Array<{ title: string; slug: string }>;
  certificatePrice: number;
  laptopsPerCohort: number;
  firstName: string;
  applicantDevice: "laptop" | "phone_only" | "both" | null;
  applicantWeeklyHours: "under_5" | "5_8" | "8_plus" | null;
  isLead: boolean;
  isUser: boolean;
}

/** "Friday 31 October" in Lagos time. */
export function formatClosingDate(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Africa/Lagos" }).format(new Date(iso));
}

/** "31 October" in Lagos time. */
export function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone: "Africa/Lagos" }).format(new Date(iso));
}

/** "11:59pm" in Lagos time. */
export function formatClosingTime(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Africa/Lagos" })
    .format(new Date(iso))
    .replace(" ", "")
    .toLowerCase();
}
