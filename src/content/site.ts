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

export interface PlannedProgramme {
  title: string;
  /** Other names the same backend course may use (matched loosely, ignoring case and spacing). */
  alsoKnownAs?: string[];
}

export interface SchoolInfo {
  /** Reference name; the live name comes from the backend `categories` collection. */
  name: string;
  /** Earlier names of this school, so an existing backend category still matches. */
  formerNames?: string[];
  oneLiner: string;
  /** The owner's programme line-up. Published backend courses appear as real programmes;
   *  the rest show as "Coming soon". A course may belong to more than one school. */
  programmes: PlannedProgramme[];
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
    phoneFriendlyExamples: ["Smartphone Videography", "Mobile Graphics Design", "Data Analysis", "Product Management"],
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
    { name: "School of AI", oneLiner: "Use and build with AI, the skill every industry is now hiring for.", programmes: [] },
    {
      name: "School of Content Creation",
      oneLiner: "Create content brands and audiences pay attention to.",
      programmes: [{ title: "Smartphone Videography and Content Creation", alsoKnownAs: ["Smartphone Videography"] }],
    },
    {
      name: "School of Data",
      oneLiner: "Turn raw numbers into decisions, and put AI to work on the busywork.",
      programmes: [{ title: "Data Analysis" }, { title: "AI Automation" }, { title: "Prompt Engineering" }],
    },
    {
      name: "School of Design",
      oneLiner: "Design products and visuals people love to use.",
      programmes: [{ title: "UI/UX Design", alsoKnownAs: ["UI/UX", "UI UX", "Product Design"] }, { title: "Graphics Design", alsoKnownAs: ["Graphic Design"] }],
    },
    {
      name: "School of Engineering",
      oneLiner: "Build the software that runs modern businesses.",
      programmes: [
        { title: "Frontend Development", alsoKnownAs: ["Front-end Development", "Front End Development"] },
        { title: "Backend Development", alsoKnownAs: ["Back-end Development", "Back End Development"] },
        { title: "Mobile App Development" },
        { title: "Cloud Engineering (AWS Solutions Architect)", alsoKnownAs: ["Cloud Engineering", "AWS Solutions Architect"] },
        { title: "Website Development (Full Stack)", alsoKnownAs: ["Website Development", "Full Stack Development", "Fullstack Development"] },
      ],
    },
    { name: "School of No-Code Development", oneLiner: "Build real apps and websites without writing code.", programmes: [] },
    {
      name: "School of Products",
      oneLiner: "Learn to lead products from idea to launch.",
      programmes: [{ title: "Product Management" }, { title: "Product Design (UI/UX)", alsoKnownAs: ["Product Design", "UI/UX Design", "UI/UX", "UI UX"] }],
    },
    { name: "School of Sales and Marketing", oneLiner: "Grow brands and close deals with digital skills.", programmes: [] },
    {
      name: "School of Security",
      oneLiner: "Protect systems and data from attackers.",
      programmes: [{ title: "Cyber Security", alsoKnownAs: ["Cybersecurity"] }, { title: "Ethical Hacking" }],
    },
    {
      name: "School of Smartphone Creators",
      formerNames: ["School of Smart Phone", "School of Smartphone"],
      oneLiner: "Shoot, design and stream with just your phone, and turn it into income.",
      programmes: [
        { title: "Smartphone Videography and Content Creation", alsoKnownAs: ["Smartphone Videography"] },
        { title: "Mobile Graphics Design", alsoKnownAs: ["Mobile Graphic Design"] },
        { title: "Mobile Streaming" },
      ],
    },
  ] satisfies SchoolInfo[],
  analytics: {
    ga4MeasurementId: "{{GA4_MEASUREMENT_ID}}",
    metaPixelId: "{{META_PIXEL_ID}}",
  },
} as const;

/** One-liner for a backend school name, matched loosely ("Smart Phone" vs "Smartphone"). */
export function schoolOneLiner(name: string): string {
  return findSchoolInfo(name)?.oneLiner ?? "";
}

const normaliseName = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

/** The school a backend category name refers to, including its former names ("Smart Phone" vs "Smartphone"). */
export function findSchoolInfo(name: string): SchoolInfo | undefined {
  const key = normaliseName(name);
  return (site.schools as readonly SchoolInfo[]).find(
    (school) => normaliseName(school.name) === key || (school.formerNames ?? []).some((former) => normaliseName(former) === key),
  );
}

/** True when a backend course title is the planned programme (or one of its other names). */
export function matchesPlannedProgramme(courseTitle: string, planned: PlannedProgramme): boolean {
  const title = normaliseName(courseTitle);
  return [planned.title, ...(planned.alsoKnownAs ?? [])].some((name) => {
    const key = normaliseName(name);
    return title === key || title.startsWith(key) || key.startsWith(title);
  });
}

export function whatsappLink(text: string = site.whatsapp.prefill): string {
  return `${site.whatsapp.waMe}?text=${encodeURIComponent(text)}`;
}

export const naira = (amount: number) => `₦${amount.toLocaleString("en-NG")}`;

/** Exact consent wording shown under Apply step 2. The backend stores this text with the consent. */
export const MARKETING_CONSENT_TEXT =
  "Yes, send me updates, scholarship deadlines and offers by WhatsApp and email. I can reply STOP or unsubscribe anytime.";
