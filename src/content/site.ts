/**
 * Business facts for the public site (Section A of the career-pathway rebuild brief).
 * Change copy and facts here, not in components. Values still marked `{{LIKE_THIS}}`
 * have not been supplied by the owner yet: never invent them.
 *
 * Prices and deadlines that drive checkout live in the backend (course prices and the
 * scholarship-window global). The numbers below are for copy only and must match them.
 */

export const PLACEHOLDER_PATTERN = /^\{\{[A-Z0-9_]+\}\}$/;

/** True while a value is still an owner-supplied placeholder like "{{FOUNDER_PHOTO}}". */
export function isPlaceholder(value: string | null | undefined): boolean {
  return !value || PLACEHOLDER_PATTERN.test(value);
}

export interface SocialLink {
  label: "X" | "Instagram" | "Facebook" | "TikTok";
  href: string;
}

export interface TeamMember {
  name: string;
  role: string;
  photo: string;
}

export interface SchoolInfo {
  /** Reference name; the live name comes from the backend `categories` collection. */
  name: string;
  oneLiner: string;
}

export const site = {
  brand: "SkillsAir",
  legalName: "SKILLS AIR LIMITED",
  cacNumber: "RC 9272398",
  address: "Osifila Street, Anifowose, Ikeja, Lagos",
  supportEmail: "hello@skillsair.com",
  whatsapp: {
    display: "+234 818 212 6524",
    e164: "+2348182126524",
    waMe: "https://wa.me/2348182126524",
    prefill: "Hi Imisi, I'm interested in a SkillsAir programme. Can you tell me more?",
  },
  social: [
    { label: "X", href: "https://x.com/skillsair" },
    { label: "Instagram", href: "https://instagram.com/skillsair" },
    { label: "Facebook", href: "https://facebook.com/skillsair" },
    { label: "TikTok", href: "https://tiktok.com/@skillsair" },
  ] satisfies SocialLink[],
  founder: {
    name: "Abraham Akinwumi",
    title: "Founder",
    photo: "{{FOUNDER_PHOTO}}",
    reason:
      "Young Africans can't access quality, affordable tech programmes, while the tech market is short of skilled people to hire. SkillsAir exists to close both gaps.",
    quote:
      "I started SkillsAir because talented young Africans were being priced out of quality tech training, while companies couldn't find the skilled people they needed.",
    story:
      "I'm Abraham Akinwumi. I kept seeing two problems side by side. Talented young Africans couldn't access quality tech programmes, because they were too expensive or too shallow. At the same time, the tech market was short of skilled people to hire. SkillsAir is my answer to both: job-ready training that young people can actually afford, with a path to internships once they're certified.",
  },
  /** Build the grid; it stays hidden while empty. */
  team: [] as TeamMember[],
  advisor: {
    name: "Imisi",
    displayName: "Imisi from SkillsAir",
    photo: "{{ADVISOR_PHOTO}}",
    hours: "Monday–Saturday, 9am–6pm (WAT)",
    hoursShort: "Mon–Sat, 9am–6pm",
  },
  programme: {
    format: "Self-paced",
    durationMonths: 3,
    weeklyHours: 8,
    standardFee: 100000,
    standardMonthlyFee: 40000,
    /** Access Scholarship price per month (billed monthly by Paystack while learning). */
    scholarshipPrice: 2000,
    scholarshipBilling: "monthly",
    certificatePrice: 10000,
    currentCohort: "October 2026 – January 2027",
    phoneFriendlyExamples: ["Canva Design", "Smartphone Videography", "Data Analysis", "Product Management"],
    /** Owner to confirm whether the ₦100,000 standard fee includes the certificate. Treated as separate until then. */
    standardFeeIncludesCertificate: "{{STANDARD_FEE_INCLUDES_CERTIFICATE}}",
  },
  laptopSupport: {
    perCohort: 2,
    fccpcApproved: true,
    fccpcReference: "{{FCCPC_APPROVAL_REFERENCE}}",
  },
  refund: {
    windowHours: 24,
    minimumProgress: "at least one chapter or 5 lessons",
    /** Owner to confirm: is the certificate fee non-refundable once issued? */
    certificateRefundConfirm: "{{CERT_REFUND_CONFIRM}}",
  },
  failedPaymentResolutionHours: 24,
  dataProtection: {
    contactName: "Blessing Edeh",
    contactEmail: "blessingedeh888@gmail.com",
  },
  priceComparison: "Less than you spend on mobile data",
  promise:
    "SkillsAir gives young Africans job-ready tech skills they can afford, and opens doors to internships once they're certified.",
  schools: [
    { name: "School of AI", oneLiner: "Use and build with AI, the skill every industry is now hiring for." },
    { name: "School of Content Creation", oneLiner: "Create content brands and audiences pay attention to." },
    { name: "School of Data", oneLiner: "Turn raw numbers into decisions companies pay for." },
    { name: "School of Design", oneLiner: "Design products and visuals people love to use." },
    { name: "School of Engineering", oneLiner: "Build the software that runs modern businesses." },
    { name: "School of No-Code Development", oneLiner: "Build real apps and websites without writing code." },
    { name: "School of Products", oneLiner: "Learn to lead products from idea to launch." },
    { name: "School of Sales and Marketing", oneLiner: "Grow brands and close deals with digital skills." },
    { name: "School of Security", oneLiner: "Protect systems and data from attackers." },
    { name: "School of Smart Phone", oneLiner: "Turn the phone in your hand into a source of income." },
  ] satisfies SchoolInfo[],
  analytics: {
    ga4MeasurementId: "{{GA4_MEASUREMENT_ID}}",
    metaPixelId: "{{META_PIXEL_ID}}",
  },
} as const;

/** One-liner for a backend school name, matched loosely ("Smart Phone" vs "Smartphone"). */
export function schoolOneLiner(name: string): string {
  const normalise = (value: string) => value.toLowerCase().replace(/[^a-z]/g, "");
  return site.schools.find((school) => normalise(school.name) === normalise(name))?.oneLiner ?? "";
}

export function whatsappLink(text: string = site.whatsapp.prefill): string {
  return `${site.whatsapp.waMe}?text=${encodeURIComponent(text)}`;
}

export const naira = (amount: number) => `₦${amount.toLocaleString("en-NG")}`;

/** Exact consent wording shown under Apply step 2. The backend stores this text with the consent. */
export const MARKETING_CONSENT_TEXT =
  "Yes, send me updates, scholarship deadlines and offers by WhatsApp and email. I can reply STOP or unsubscribe anytime.";
