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
  /** "monthly" while the scholarship is open and its plan is set up; otherwise "once". */
  billing: "monthly" | "once";
  scholarshipPlanId: number | null;
  standardPlanId: number | null;
  windowOpen: boolean;
  closesAt: string | null;
  /**
   * The learner keeps ₦2,000 a month whether or not a window is open: restarting a programme
   * they started on the scholarship (no deadline), or a new programme within 3 days of
   * finishing one ("next_programme", until priceLockEndsAt). Optional until the backend sends it.
   */
  priceLocked?: boolean;
  priceLockReason?: "restart" | "next_programme" | null;
  priceLockEndsAt?: string | null;
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

/** The locked-rate line shown instead of a closing date. */
export function priceLockLine(offer: Pick<Offer, "price" | "priceLockReason" | "priceLockEndsAt">, naira: (amount: number) => string): string {
  if (offer.priceLockReason === "next_programme") {
    const until = offer.priceLockEndsAt ? ` Start by ${formatClosingDate(offer.priceLockEndsAt)}, ${formatClosingTime(offer.priceLockEndsAt)} to keep it.` : "";
    return `As a SkillsAir graduate, you can start your next programme at ${naira(offer.price)} a month.${until}`;
  }
  return `Your rate is locked at ${naira(offer.price)} a month, because you joined during the Access Scholarship.`;
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
