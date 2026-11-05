import Link from "next/link";

/**
 * The large "carry on" card at the top of Today: one lesson, its place, and one button. Guided
 * learners get the guided plan's Today card instead (TodayPlans); this one is for chapter view,
 * and for the dashboard when the guided plan is switched off.
 */
export function ContinueCard({
  eyebrow,
  title,
  meta,
  href,
  cta = "Continue",
  onClick,
}: {
  eyebrow: string;
  title: string;
  meta?: string;
  href: string;
  cta?: string;
  onClick?: () => void;
}) {
  return (
    <section aria-label="Continue learning" className="rounded-[20px] bg-navy px-5 py-6 text-white sm:px-7">
      <p className="text-[13px] font-semibold uppercase tracking-wide text-white/70 sm:text-sm">{eyebrow}</p>
      <h2 className="mt-1.5 text-xl font-bold leading-snug text-white sm:text-[26px] sm:leading-tight">{title}</h2>
      {meta && <p className="mt-1.5 text-[15px] text-white/80">{meta}</p>}
      <Link
        href={href}
        onClick={onClick}
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-accent-700 px-6 font-semibold text-white hover:bg-accent-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy sm:w-auto"
      >
        {cta}
      </Link>
    </section>
  );
}
