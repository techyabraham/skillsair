import Link from "next/link";
import type { ReactNode } from "react";
import { AdirePattern } from "@/components/marketing/AdirePattern";
import { PrimaryCTA } from "@/components/marketing/PrimaryCTA";
import { formatShortDate } from "@/lib/offer";
import { site, whatsappLink } from "@/content/site";
import { cn } from "@/lib/utils";

/**
 * Building blocks for the ad landing pages (/schools, /schools/[school], /programmes/[slug]).
 * Same design language as the home page: navy hero over the adire pattern, orange eyebrow,
 * Space Grotesk, rounded-2xl cards, one orange call to action. Every claim is true today:
 * no learner counts, testimonials or job promises.
 */

export function LandingHero({
  eyebrow,
  icon,
  title,
  intro,
  primary,
  secondary,
  note,
  aside,
  breadcrumb,
}: {
  eyebrow: ReactNode;
  icon?: ReactNode;
  title: ReactNode;
  intro?: ReactNode;
  primary: { href: string; label: string };
  secondary?: { href: string; label: string };
  note?: string;
  aside?: ReactNode;
  breadcrumb?: { href: string; label: string };
}) {
  return (
    <section className="relative overflow-hidden border-t border-primary-800 bg-navy text-white">
      <AdirePattern opacity={0.45} />
      <div className={cn("container-wide relative grid gap-10 py-14 md:py-20", aside && "lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center lg:gap-14")}>
        <div className="flex flex-col gap-5">
          {breadcrumb && (
            <Link href={breadcrumb.href} className="w-fit text-sm font-medium text-neutral-300 hover:text-white hover:underline">
              ← {breadcrumb.label}
            </Link>
          )}
          <p className="eyebrow flex items-center gap-2.5 text-accent-300">
            {icon && <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white">{icon}</span>}
            {eyebrow}
          </p>
          <h1 className="max-w-3xl text-[2.25rem] font-bold leading-[1.05] tracking-[-0.025em] text-white md:text-[3.75rem]">{title}</h1>
          {intro && <div className="max-w-2xl text-lg text-neutral-300 md:text-xl">{intro}</div>}
          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center">
            <PrimaryCTA href={primary.href} size="lg" block>
              {primary.label}
            </PrimaryCTA>
            {secondary && (
              <Link href={secondary.href} className="inline-flex min-h-[52px] items-center justify-center rounded-xl border border-white/30 px-6 font-semibold text-white hover:bg-white/10">
                {secondary.label}
              </Link>
            )}
          </div>
          {note && <p className="text-sm text-neutral-300">{note}</p>}
        </div>
        {aside}
      </div>
    </section>
  );
}

/** White card in the hero: the facts a visitor checks before deciding. */
export function AtAGlance({ title = "At a glance", items, footer }: { title?: string; items: Array<{ label: string; value: ReactNode }>; footer?: ReactNode }) {
  return (
    <aside className="rounded-2xl bg-white p-6 text-neutral-900 shadow-modal md:p-7">
      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{title}</p>
      <dl className="mt-4 divide-y divide-neutral-200">
        {items.map((item) => (
          <div key={item.label} className="flex items-start justify-between gap-4 py-3 text-[15px]">
            <dt className="text-neutral-600">{item.label}</dt>
            <dd className="text-right font-semibold text-navy">{item.value}</dd>
          </div>
        ))}
      </dl>
      {footer && <div className="mt-4 border-t border-neutral-200 pt-4 text-sm text-neutral-700">{footer}</div>}
    </aside>
  );
}

const WHY = [
  {
    title: "Priced for real life",
    body: "When an Access Scholarship window is open, you pay a small monthly amount instead of the standard fee. Apply to see your price.",
    // Naira sign.
    icon: <><path d="M7 19V5l10 14V5" /><path d="M4.5 10h15M4.5 14h15" /></>,
  },
  {
    title: "Learn at your own pace",
    body: "Each programme is designed to take about 3 months at about 8 hours a week. Study around school, work or family.",
    icon: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  },
  {
    title: "A certificate employers can check",
    body: "When you finish, pass the final exam to earn a verifiable certificate with its own link for your CV and LinkedIn.",
    icon: <><circle cx="12" cy="9" r="5.5" /><path d="m9 13.6-1.5 7.4L12 18.6l4.5 2.4-1.5-7.4" /></>,
  },
  {
    title: "A door to internships",
    body: "Certified graduates get access to internship openings from our partner firms. The network is new and growing.",
    icon: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 12.5h18" /></>,
  },
  {
    title: "A real person on WhatsApp",
    body: `${site.advisor.name} answers your questions, ${site.advisor.hoursShort}. No bots pretending to be people.`,
    icon: <path d="M20 12a8 8 0 0 1-11.8 7L4 20l1-4.2A8 8 0 1 1 20 12Z" />,
  },
  {
    title: "Try it first",
    body: "Watch a free preview lesson before you pay. After paying, complete a chapter or 5 lessons and ask for a refund within 24 hours if it isn't for you.",
    icon: <><path d="M12 3 4.5 6v5.5c0 4.5 3.2 8.2 7.5 9.5 4.3-1.3 7.5-5 7.5-9.5V6L12 3Z" /><path d="m9 12 2 2 4-4" /></>,
  },
];

export function WhySkillsAir({ title = "Why start with SkillsAir", tone = "muted" }: { title?: string; tone?: "muted" | "white" }) {
  return (
    <section className={cn("py-16 md:py-24", tone === "muted" ? "bg-neutral-50" : "bg-white")}>
      <div className="container-wide">
        <p className="eyebrow">Why SkillsAir</p>
        <h2 className="mt-3 max-w-2xl text-[1.75rem] font-bold leading-[1.15] text-navy md:text-[2.5rem]">{title}</h2>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WHY.map((item) => (
            <li key={item.title} className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50 text-accent-700">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  {item.icon}
                </svg>
              </span>
              <h3 className="text-lg font-bold text-navy">{item.title}</h3>
              <p className="text-[15px] leading-relaxed text-neutral-700">{item.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function HowItWorks({ applyHref }: { applyHref: string }) {
  const steps = [
    { title: "Apply in 60 seconds", body: "Pick your programme and tell us where to send your offer. It's free." },
    { title: "See your price", body: "Your personal offer shows exactly what you'll pay. No hidden fees." },
    { title: "Learn at your own pace", body: "Start today, on the device your programme supports, about 8 hours a week." },
    { title: "Get certified", body: "Finish, pass the final exam for your verifiable certificate, and unlock internship openings." },
  ];
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="container-wide">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">How it works</p>
            <h2 className="mt-3 text-[1.75rem] font-bold leading-[1.15] text-navy md:text-[2.5rem]">From applying to certified, in four steps</h2>
          </div>
          <Link href={applyHref} className="font-semibold text-accent-700 hover:underline">Start step 1 →</Link>
        </div>
        <ol className="mt-10 grid gap-4 md:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.title} className="relative rounded-2xl border border-neutral-200 bg-white p-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">{index + 1}</span>
              <h3 className="mt-4 text-lg font-bold text-navy">{step.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-neutral-700">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function ScholarshipBand({ isOpen, closesAt, applyHref, waitlist = false }: { isOpen: boolean; closesAt: string | null; applyHref: string; waitlist?: boolean }) {
  const closes = formatShortDate(closesAt);
  return (
    <section className="relative overflow-hidden bg-navy py-16 text-white md:py-20">
      <AdirePattern opacity={0.35} />
      <div className="container-wide relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <p className="eyebrow text-accent-300">{isOpen ? "Access Scholarship · open now" : "Access Scholarship"}</p>
          <h2 className="mt-3 text-[1.75rem] font-bold leading-[1.15] text-white md:text-[2.5rem]">
            {waitlist ? "Be first in when it opens" : isOpen ? "Your seat could cost a fraction of the standard fee" : "Scholarship windows open regularly"}
          </h2>
          <p className="mt-3 text-lg text-neutral-300">
            {waitlist
              ? "Leave your details and we'll message you on WhatsApp the moment you can apply."
              : isOpen
                ? `Apply in 60 seconds to see your personal price.${closes ? ` This window closes ${closes}.` : ""}`
                : "Apply now and we'll message you on WhatsApp when the next window opens."}
          </p>
        </div>
        <PrimaryCTA href={applyHref} size="lg" block className="md:w-auto">
          {waitlist ? "Join the waitlist →" : "See my price →"}
        </PrimaryCTA>
      </div>
    </section>
  );
}

export function FounderNote() {
  return (
    <section className="bg-white py-16 md:py-20">
      <div className="container-wide grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:items-center">
        <div>
          <p className="eyebrow">Why we exist</p>
          <h2 className="mt-3 text-[1.75rem] font-bold leading-[1.15] text-navy md:text-[2.25rem]">Talent isn&apos;t the problem. Access is.</h2>
        </div>
        <blockquote className="rounded-2xl border-l-4 border-accent-700 bg-neutral-50 p-6 text-lg leading-relaxed text-neutral-800 md:p-8">
          &ldquo;{site.founder.quote}&rdquo;
          <footer className="mt-4 text-sm font-semibold text-navy">
            {site.founder.name}, {site.founder.title} ·{" "}
            <a href={whatsappLink()} className="font-medium text-accent-700 hover:underline">Questions? WhatsApp {site.advisor.name}</a>
          </footer>
        </blockquote>
      </div>
    </section>
  );
}
