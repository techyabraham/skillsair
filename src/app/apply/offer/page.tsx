import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { fetchOffer, hasAccountSession, recordOfferView } from "@/lib/server-session";
import { formatShortDate, priceLockLine } from "@/lib/offer";
import { naira, site } from "@/content/site";
import { paystackFee } from "@/lib/paystack-fee";
import { OfferPriceBlock } from "@/components/marketing/OfferPriceBlock";
import { GuaranteeBox } from "@/components/marketing/GuaranteeBox";
import { RequirementsList } from "@/components/marketing/RequirementsList";
import { FAQAccordion } from "@/components/marketing/FAQAccordion";
import { WhatsAppTextLink } from "@/components/marketing/WhatsAppButton";
import { TrackEvent } from "@/components/analytics/TrackEvent";
import { WaitlistButton } from "@/components/apply/WaitlistButton";

export const metadata: Metadata = {
  title: "Your scholarship offer",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const laptopSupportOn = process.env.NEXT_PUBLIC_FEATURE_LAPTOP_SUPPORT !== "false";

export default async function OfferPage({ searchParams }: { searchParams: { programme?: string } }) {
  const slug = typeof searchParams.programme === "string" ? searchParams.programme : "";
  if (!slug) redirect("/apply");
  const result = await fetchOffer(slug);
  if (result.status === "unauthorised" || result.status === "not_found") redirect(`/apply?programme=${encodeURIComponent(slug)}`);
  if (result.status === "error") {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-heading font-bold text-neutral-900">We couldn&apos;t load your offer just now</h1>
        <p className="mt-3 text-neutral-600">Your application is saved. Refresh in a minute, or message {site.advisor.name} and we&apos;ll send it to you.</p>
        <div className="mt-6 flex justify-center"><WhatsAppTextLink /></div>
      </div>
    );
  }

  const { offer } = result;
  await recordOfferView();
  const loggedIn = hasAccountSession() && offer.isUser;
  const nextHref = loggedIn ? `/checkout?course=${encodeURIComponent(offer.slug)}` : `/apply/account?programme=${encodeURIComponent(offer.slug)}`;
  const name = offer.firstName || "Hi";
  const outcomes = offer.objectives.slice(0, 3);
  const closesShort = formatShortDate(offer.closesAt);
  // The scholarship is billed monthly through its Paystack plan.
  const monthly = offer.billing === "monthly";
  const locked = monthly && offer.priceLocked === true;
  const scholarshipNotReady = (offer.windowOpen || offer.priceLocked === true) && !offer.scholarshipPlanId;

  const microFaq = [
    monthly
      ? {
          id: "monthly",
          question: `How does ${naira(offer.price)} a month work?`,
          answer: `You pay ${naira(offer.price)} a month until you finish, plus Paystack's ${naira(paystackFee(offer.price))} payment fee. Pay by bank transfer or OPay and each payment covers a month (we remind you a few days before the next is due), or by card through Paystack, which renews automatically. Your access continues as long as your plan is paid up. The programme is designed to take about ${offer.durationMonths} months at about ${offer.weeklyHours} hours a week. ${locked ? priceLockLine(offer, naira) : `Joining during this scholarship window keeps your ${naira(offer.price)} rate until you finish.`} Cancel anytime from your dashboard. The certificate is optional and paid separately when you finish.`,
        }
      : {
          id: "one-time",
          question: "How do I pay the standard fee?",
          answer: `Pay ${naira(offer.effectivePrice)} once${offer.standardMonthlyPrice ? `, or ${naira(offer.standardMonthlyPrice)} a month where a monthly plan is offered at checkout` : ""}. The certificate is optional and paid separately when you finish.`,
        },
    {
      id: "debited",
      question: "What if I'm debited and it fails?",
      answer: `Banks normally reverse failed payments automatically. If yours hasn't, send your payment reference to ${site.advisor.name} on WhatsApp (${site.whatsapp.display}) and we'll resolve it within 24 hours.`,
    },
    { id: "start", question: "When can I start?", answer: "Immediately. It's self-paced." },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:py-12">
      <TrackEvent event="offer_view" params={{ windowOpen: offer.windowOpen, programme: offer.slug }} />

      {locked && !offer.windowOpen ? (
        <h1 className="text-2xl font-heading font-extrabold text-neutral-900 md:text-4xl">
          {name}, your {naira(offer.price)}-a-month rate is ready
        </h1>
      ) : offer.windowOpen ? (
        <h1 className="text-2xl font-heading font-extrabold text-neutral-900 md:text-4xl">
          {name}, your SkillsAir Access Scholarship is ready 🎉
        </h1>
      ) : (
        <>
          <h1 className="text-2xl font-heading font-extrabold text-neutral-900 md:text-4xl">The Access Scholarship window has closed</h1>
          <p className="mt-3 text-lg text-neutral-700">
            The standard fee for {offer.programme} is {naira(offer.standardPrice)}
            {offer.standardMonthlyPrice ? ` (or ${naira(offer.standardMonthlyPrice)}/month)` : ""}. We&apos;ll message you on WhatsApp the moment the next scholarship window opens.
          </p>
        </>
      )}

      <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5 md:p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary-800">{offer.school || "SkillsAir"}</p>
        <h2 className="mt-1 text-xl font-heading font-bold text-neutral-900">{offer.programme}</h2>
        <p className="mt-2 text-neutral-700">
          Self-paced · designed to take about {offer.durationMonths} months at about {offer.weeklyHours} hours a week · Optional certificate when you finish.
        </p>
        {outcomes.length > 0 && (
          <ul className="mt-4 space-y-2">
            {outcomes.map((outcome) => (
              <li key={outcome} className="flex items-start gap-2 text-neutral-700">
                <span className="mt-0.5 text-success-dark" aria-hidden="true">✓</span>
                {outcome}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6" aria-label="Your price">
        <OfferPriceBlock offer={offer} />
      </section>

      {offer.windowOpen && (
        <section className="mt-6 rounded-2xl bg-navy p-5 text-white md:p-6">
          <h2 className="text-lg font-heading font-bold text-white">Why only {naira(offer.price)} a month?</h2>
          <p className="mt-2 text-white/90 leading-relaxed">
            Because talent isn&apos;t the problem. Access is. SkillsAir was started by {site.founder.name} to give young Africans quality, job-ready tech training without the high fees, and to supply the tech market with the skilled people it&apos;s short of. The scholarship replaces the standard fee with {naira(offer.price)} a month for everyone who joins in this window.
          </p>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-xl font-heading font-bold text-neutral-900">What you get</h2>
        <ul className="mt-4 space-y-3 text-neutral-700">
          <li>✓ The full {offer.programme} programme, at your own pace, for as long as you study.</li>
          <li>✓ When you finish: a verifiable certificate employers can check online (optional, paid separately).</li>
          <li>✓ <strong>Free bonus courses:</strong> CV &amp; LinkedIn, and Freelancing.</li>
          <li>✓ Access to internship openings from SkillsAir partner firms once you&apos;re certified.</li>
          {laptopSupportOn && (
            <li>
              ✓ Certified graduates can apply for laptop support: {offer.laptopsPerCohort} laptops per cohort go to those who need one most (
              <Link href="/laptop-rules" className="font-medium text-primary-800 underline underline-offset-2">see rules</Link>).
            </li>
          )}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-heading font-bold text-neutral-900">What you&apos;ll need</h2>
        <div className="mt-4">
          <RequirementsList
            requirements={offer.requirements}
            phoneFriendly={offer.phoneFriendly}
            phoneOnlyWarning={offer.applicantDevice === "phone_only"}
            alternatives={offer.phoneFriendlyAlternatives}
            alternativeHref={(alt) => `/apply/offer?programme=${encodeURIComponent(alt)}`}
          />
        </div>
        {offer.applicantWeeklyHours === "under_5" && (
          <p className="mt-4 rounded-xl bg-neutral-100 p-4 text-neutral-700">
            You said you have under 5 hours a week. That&apos;s okay: it&apos;s self-paced. It&apos;s designed for about {offer.weeklyHours} hours a week, so plan a little extra time on weekends.
          </p>
        )}
      </section>

      <section className="mt-8">
        <GuaranteeBox />
      </section>

      <section className="mt-8 space-y-4">
        {scholarshipNotReady ? (
          <p className="rounded-xl border border-warning/40 bg-warning-light p-4 text-neutral-800">
            Monthly billing for {offer.programme} is being set up. Message {site.advisor.name} on WhatsApp and we&apos;ll hold your {naira(offer.price)}-a-month seat.
          </p>
        ) : monthly ? (
          <>
          <Link href={nextHref} className="flex min-h-14 w-full items-center justify-center rounded-xl bg-accent-700 px-6 py-4 text-lg font-semibold text-white hover:bg-accent-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-700 focus-visible:ring-offset-2">
            Secure my seat for {naira(offer.price)}/month →
          </Link>
          <p className="text-center text-sm text-neutral-600">
            Plus Paystack&apos;s {naira(paystackFee(offer.price))} payment fee each month, shown at checkout.
          </p>
          </>
        ) : (
          <>
            <WaitlistButton />
            <Link href={nextHref} className="flex min-h-12 w-full items-center justify-center rounded-xl border-2 border-primary-800 px-6 py-3 font-semibold text-primary-800 hover:bg-primary-50">
              Enrol at the standard fee
            </Link>
          </>
        )}
        <div className="flex justify-center">
          <WhatsAppTextLink />
        </div>
        <p className="text-center text-sm text-neutral-600">
          {monthly
            ? "Someone paying for you? They can pay each month by bank transfer or OPay, or enter their own card on the Paystack page, where it renews from that card."
            : "Someone paying for you? Choose Bank transfer at checkout and send them the account details, or they can pay from their own OPay."}
        </p>
      </section>

      <section className="mt-10">
        <FAQAccordion items={microFaq} />
      </section>

      {offer.windowOpen && !locked && closesShort && (
        <p className="mt-8 text-neutral-700">
          <strong>P.S.</strong> This scholarship window closes {closesShort}. If you&apos;ve been waiting for &ldquo;one day&rdquo;, today is a good day.
        </p>
      )}
    </div>
  );
}
