import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { TRAIT_IDS, TRAIT_LABELS, careers, topTraits, type CareerId } from "@/content/quiz-v2";
import { buildResultView, getPublishedProgrammes, getQuizResult, type CareerRow, type ResultView } from "@/lib/quiz-result";
import { MatchRing, TraitRadar } from "@/components/quiz/result/charts";
import { ShareResultButton, WaitlistJoinButton } from "@/components/quiz/result/ResultActions";
import { WhatsAppTextLink } from "@/components/marketing/WhatsAppButton";
import { LogoIcon } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import { site } from "@/content/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  return {
    title: "Your Career Match result",
    description: "Your top tech career matches and strengths from the SkillsAir Career Match quiz.",
    robots: { index: false, follow: false },
    openGraph: { images: [{ url: `/quiz/result/${params.id}/card`, width: 1080, height: 1350 }] },
  };
}

const applyHref = (slug: string) => `/apply?programme=${encodeURIComponent(slug)}&from=quiz`;

function StatusBadge({ row, dark = false }: { row: CareerRow; dark?: boolean }) {
  return row.status === "open" ? (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", dark ? "bg-white/15 text-white" : "bg-success-light text-success-dark")}>Open now</span>
  ) : (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", dark ? "bg-orange-400/20 text-orange-100" : "bg-accent-50 text-accent-800")}>Coming soon</span>
  );
}

function Bar({ row, href, resultId, joined }: { row: CareerRow; href?: string; resultId: string; joined: boolean }) {
  const inner = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold text-neutral-900">{row.name}</span>
        <span className="flex items-center gap-2">
          <StatusBadge row={row} />
          <span className="font-heading text-lg font-bold tabular-nums text-navy">{row.percent}%</span>
        </span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-neutral-100" aria-hidden="true">
        <div className={cn("h-full rounded-full", row.status === "open" ? "bg-navy" : "bg-neutral-400")} style={{ width: `${row.percent}%` }} />
      </div>
      <span className="sr-only">
        {row.name}: {row.percent}%, {row.label}, {row.status === "open" ? "open now" : "coming soon"}.
      </span>
    </>
  );
  if (row.status === "open" && href) {
    return (
      <Link href={href} className="block rounded-xl border border-neutral-200 bg-white p-4 hover:border-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy">
        {inner}
      </Link>
    );
  }
  return (
    <details className="group rounded-xl border border-neutral-200 bg-white p-4 open:border-neutral-300">
      <summary className="cursor-pointer list-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy [&::-webkit-details-marker]:hidden">{inner}</summary>
      <div className="mt-3 border-t border-neutral-100 pt-3">
        <p className="text-sm text-neutral-700">{careers[row.career].oneLiner}</p>
        <p className="mt-1 text-sm text-neutral-600">We don&apos;t run {row.name} yet.</p>
        <div className="mt-3">
          <WaitlistJoinButton resultId={resultId} career={row.career} careerName={row.name} initiallyJoined={joined} variant="ghost" />
        </div>
      </div>
    </details>
  );
}

function programmeHref(row: CareerRow): string | undefined {
  return row.programme ? `/programmes/${row.programme.slug}` : undefined;
}

function Card({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm md:p-6", className)} aria-label={title}>
      <h2 className="font-heading text-xl font-bold text-neutral-900">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Hero({ view }: { view: ResultView }) {
  const { top } = view;
  const name = view.firstName || "Hi";
  const waitlistTop = top.status === "waitlist";
  const openInTop3 = view.top3.filter((row) => row.status === "open");
  return (
    <div className="bg-navy text-white">
      <div className="mx-auto max-w-3xl px-4 pb-10 pt-8 md:pb-14 md:pt-12">
        {view.welcomeBack && <p className="mb-3 text-sm font-semibold text-orange-200">Welcome back{view.firstName ? `, ${view.firstName}` : ""}! We&apos;ve added this to your account.</p>}
        {view.fewOptions ? (
          <>
            <h1 className="font-heading text-[1.75rem] font-extrabold leading-tight text-white md:text-4xl">{name}, you have a few good options</h1>
            <p className="mt-3 text-white/80">No single career stood out, and that&apos;s fine. These three fit you about equally:</p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-3">
              {view.top3.map((row) => (
                <li key={row.career} className="rounded-xl bg-white/10 p-4">
                  <p className="font-semibold text-white">{row.name}</p>
                  <p className="mt-1 text-sm text-white/80">
                    {row.percent}% · {row.label}
                  </p>
                  <div className="mt-2">
                    <StatusBadge row={row} dark />
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <MatchRing percent={top.percent} label={top.label} />
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-orange-200">Your top match</p>
              <h1 className="mt-1 font-heading text-[1.75rem] font-extrabold leading-tight text-white md:text-4xl">
                {name}, your top match is {top.name}
              </h1>
              <p className="sr-only">
                {top.percent}% match, {top.label}.
              </p>
              {waitlistTop && <span className="mt-3 inline-block rounded-full bg-orange-400/20 px-3 py-1 text-sm font-semibold text-orange-100">Coming soon</span>}
              {view.why && <p className="mt-3 text-white/85">{view.why}</p>}
            </div>
          </div>
        )}
        {waitlistTop && !view.fewOptions && (
          <div className="mt-6 rounded-2xl bg-white/10 p-5">
            <p className="text-white">
              We don&apos;t run {top.name} yet. Join the waitlist and we&apos;ll WhatsApp you the day it opens.
            </p>
            <div className="mt-3">
              <WaitlistJoinButton resultId={view.publicId} career={top.career} careerName={top.name} initiallyJoined={view.waitlisted.includes(top.career)} variant="ghost-dark" />
            </div>
            {openInTop3.length > 0 && (
              <p className="mt-4 text-sm text-white/85">
                While you wait, these fit you too and are open now: {openInTop3.map((row) => `${row.name} (${row.percent}%)`).join(", ")}.
              </p>
            )}
          </div>
        )}
        <p className="mt-6 text-sm text-white/70">Based on what you told us, not a test you can fail.</p>
      </div>
    </div>
  );
}

function FitChecks({ view, row }: { view: ResultView; row: CareerRow }) {
  const programme = row.programme;
  if (!programme) return null;
  const notes: React.ReactNode[] = [];
  if (view.context.device === "phone_only" && !programme.phoneFriendly) {
    const alternative = view.top3.find((item) => item.status === "open" && item.programme?.phoneFriendly && item.career !== row.career);
    notes.push(
      <li key="phone">
        Most of {programme.title} works on a phone, but some projects need a laptop. Ask {site.advisor.name} about the laptop support scheme.
        {alternative && (
          <>
            {" "}
            If you&apos;d rather stay on your phone,{" "}
            <Link href={applyHref(alternative.programme!.slug)} className="font-semibold text-primary-800 underline underline-offset-2">
              {alternative.programme!.title}
            </Link>{" "}
            ({alternative.percent}% match) is phone-friendly.
          </>
        )}
      </li>,
    );
  }
  if (view.context.weeklyHours === "under_5" && programme.durationMonths && programme.weeklyHours) {
    // The programme is planned at its weekly hours; at about 4 hours a week it stretches in proportion.
    const months = Math.ceil((programme.durationMonths * programme.weeklyHours) / 4);
    if (months > programme.durationMonths) {
      notes.push(
        <li key="time">
          {programme.title} is planned for about {programme.weeklyHours} hours a week over {programme.durationMonths} months. At under 5 hours a week, plan for about {months} months instead. That&apos;s fine: you go at your pace.
        </li>,
      );
    }
  }
  if (!notes.length) return null;
  return (
    <Card title="Will it fit your life?">
      <ul className="list-disc space-y-3 pl-5 text-neutral-700">{notes}</ul>
    </Card>
  );
}

const PATH = [
  { title: "Learn", text: "Short lessons on phone or laptop" },
  { title: "Build projects", text: "Real work for your portfolio" },
  { title: "Certificate", text: "A certificate employers can verify" },
  { title: "Internship opportunities", text: "For every graduate who gets certified" },
];

export default async function QuizResultPage({ params }: { params: { id: string } }) {
  const [lookup, programmes] = await Promise.all([getQuizResult(params.id, headers()), getPublishedProgrammes().catch(() => null)]);
  if (lookup.status === "not_found") notFound();
  if (lookup.status === "error" || !programmes) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-heading font-bold text-neutral-900">We couldn&apos;t load your result just now</h1>
        <p className="mt-3 text-neutral-600">Your result is saved. Please refresh in a minute, or message us and we&apos;ll send it to you.</p>
        <div className="mt-6 flex justify-center">
          <WhatsAppTextLink />
        </div>
      </div>
    );
  }
  const view = buildResultView(lookup.result, programmes);
  if (!view) notFound();

  const { top, bestOpen } = view;
  const [traitA, traitB] = topTraits(view.traits);
  const featured = top.status === "open" ? top : bestOpen;
  const rest = view.rows.slice(3);
  const joined = (career: CareerId) => view.waitlisted.includes(career);

  return (
    <div className="bg-neutral-50">
      <Hero view={view} />

      <div className="mx-auto -mt-4 grid max-w-3xl gap-5 px-4 pb-16">
        <Card title="Your top 3">
          <ul className="grid gap-3">
            {view.top3.map((row) => (
              <li key={row.career}>
                <Bar row={row} href={programmeHref(row)} resultId={view.publicId} joined={joined(row.career)} />
              </li>
            ))}
          </ul>
          {view.top3.some((row) => row.career === "backend") && (
            <p className="mt-3 text-sm text-neutral-600">{careers.backend.programmeNote}</p>
          )}
          {bestOpen && !view.top3.some((row) => row.status === "open") && (
            <div className="mt-4 rounded-xl border-2 border-dashed border-navy/30 p-4">
              <p className="text-sm font-semibold uppercase tracking-wider text-navy">Available now: your best open match</p>
              <div className="mt-2">
                <Bar row={bestOpen} href={programmeHref(bestOpen)} resultId={view.publicId} joined={false} />
              </div>
            </div>
          )}
          <details className="mt-4">
            <summary className="min-h-11 cursor-pointer py-2 font-semibold text-primary-800">See all 14</summary>
            <ul className="mt-2 grid gap-2">
              {rest.map((row) => (
                <li key={row.career}>
                  <Bar row={row} href={programmeHref(row)} resultId={view.publicId} joined={joined(row.career)} />
                </li>
              ))}
            </ul>
          </details>
        </Card>

        <Card title="Your strengths">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
            <TraitRadar traits={view.traits} />
            <div>
              <p className="text-lg font-semibold text-neutral-900">
                You&apos;re mostly {TRAIT_LABELS[traitA].noun} and {TRAIT_LABELS[traitB].noun}.
              </p>
              <ul className="mt-3 space-y-1 text-sm text-neutral-700">
                {TRAIT_IDS.map((trait) => (
                  <li key={trait} className="flex justify-between gap-6">
                    <span>{TRAIT_LABELS[trait].name}</span>
                    <span className="font-semibold tabular-nums">{view.traits[trait]}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>

        <Card title={`What ${top.name} is like`}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-success-light/60 p-4">
              <h3 className="font-semibold text-neutral-900">What you&apos;ll love</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-neutral-700">
                {careers[top.career].love.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div className="rounded-xl bg-neutral-100 p-4">
              <h3 className="font-semibold text-neutral-900">Real talk: the hard parts</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-neutral-700">
                {careers[top.career].hard.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </div>
          {top.programme && (
            <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-700">
              <div><dt className="inline font-semibold">Programme: </dt><dd className="inline">{top.programme.title}</dd></div>
              {top.programme.durationMonths && <div><dt className="inline font-semibold">Length: </dt><dd className="inline">about {top.programme.durationMonths} months</dd></div>}
              {top.programme.weeklyHours && <div><dt className="inline font-semibold">Time: </dt><dd className="inline">about {top.programme.weeklyHours} hrs a week</dd></div>}
              <div><dt className="inline font-semibold">Phone-friendly: </dt><dd className="inline">{top.programme.phoneFriendly ? "Yes" : "Mostly; some projects need a laptop"}</dd></div>
            </dl>
          )}
        </Card>

        {featured && <FitChecks view={view} row={featured} />}

        <Card title="Your path">
          <ol className="grid gap-3 sm:grid-cols-4">
            {PATH.map((step, index) => (
              <li key={step.title} className="relative rounded-xl bg-neutral-50 p-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-sm font-bold text-white" aria-hidden="true">{index + 1}</span>
                <p className="mt-2 font-semibold text-neutral-900">{step.title}</p>
                <p className="mt-1 text-sm text-neutral-600">{step.text}</p>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm text-neutral-600">Included free with any programme: Freelancer&apos;s Academy, to help you find clients.</p>
        </Card>

        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm md:p-6" aria-label="Next steps">
          {bestOpen?.programme ? (
            <>
              {top.status === "waitlist" && <p className="mb-3 text-neutral-700">{bestOpen.name} is your best match that&apos;s open now ({bestOpen.percent}%).</p>}
              <Link href={applyHref(bestOpen.programme.slug)} className="flex min-h-14 w-full items-center justify-center rounded-xl bg-accent-700 px-6 py-4 text-lg font-semibold text-white hover:bg-accent-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-700 focus-visible:ring-offset-2">
                Apply for {bestOpen.programme.title} →
              </Link>
            </>
          ) : (
            <p className="text-neutral-700">None of your matches is open yet. Join the waitlist above and we&apos;ll message you the day one opens.</p>
          )}
          {top.status === "waitlist" && (
            <div className="mt-3 flex justify-center">
              <WaitlistJoinButton resultId={view.publicId} career={top.career} careerName={top.name} initiallyJoined={joined(top.career)} variant="ghost" />
            </div>
          )}
          <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-6">
            <WhatsAppTextLink className="min-h-12">Chat with {site.advisor.name} on WhatsApp</WhatsAppTextLink>
            <Link href="/quiz?retake=1" className="min-h-12 py-3 text-sm font-medium text-neutral-600 underline underline-offset-2">
              Retake the quiz
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm md:p-6" aria-label="Share">
          <div className="flex items-center gap-2">
            <LogoIcon className="h-5 w-5" />
            <h2 className="font-heading text-lg font-bold text-neutral-900">Share your result</h2>
          </div>
          <p className="mt-1 text-sm text-neutral-600">A picture of your top matches, with your first name only.</p>
          <div className="mt-4">
            <ShareResultButton resultId={view.publicId} careerName={top.name} />
          </div>
        </section>
      </div>
    </div>
  );
}
