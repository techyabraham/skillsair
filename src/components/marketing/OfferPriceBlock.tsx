import { naira } from "@/content/site";
import { formatClosingDate, formatClosingTime, priceLockLine, type Offer } from "@/lib/offer";
import { DeadlineCountdown } from "@/components/marketing/DeadlineCountdown";

type PriceFacts = Pick<
  Offer,
  | "price"
  | "standardPrice"
  | "standardMonthlyPrice"
  | "effectivePrice"
  | "billing"
  | "windowOpen"
  | "closesAt"
  | "certificatePrice"
  | "priceLocked"
  | "priceLockReason"
  | "priceLockEndsAt"
>;

/**
 * The price is never shown bare: real standard fee → the Access Scholarship monthly price →
 * the certificate fee (same size as body text) → the real closing date.
 */
export function OfferPriceBlock({ offer }: { offer: PriceFacts }) {
  const monthlyStandard = offer.standardMonthlyPrice ? `${naira(offer.standardMonthlyPrice)} a month` : "";
  const standardLine = monthlyStandard ? `${monthlyStandard} or ${naira(offer.standardPrice)} once` : `${naira(offer.standardPrice)} once`;
  const scholarship = offer.billing === "monthly";
  const locked = scholarship && offer.priceLocked === true;
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 md:p-6">
      <dl className="space-y-3 text-base">
        <div className="flex items-start justify-between gap-4 text-neutral-600">
          <dt>Standard fee</dt>
          <dd className="text-right">{scholarship ? <s>{standardLine}</s> : standardLine}</dd>
        </div>
        {scholarship && (
          <div className="flex items-start justify-between gap-4 border-t border-neutral-200 pt-3">
            <dt className="font-semibold text-navy">{locked ? "Your locked rate" : "With your Access Scholarship"}</dt>
            <dd className="text-right">
              <span className="text-2xl font-bold text-navy">{naira(offer.price)}</span>
              <span className="text-neutral-700"> a month</span>
            </dd>
          </div>
        )}
        <div className="flex items-start justify-between gap-4 text-neutral-700">
          <dt>Certificate (when you finish)</dt>
          <dd className="text-right">Optional, paid separately; needed for internship access</dd>
        </div>
      </dl>
      {/*
      {scholarship && (
        <p className="mt-4 text-neutral-700">
          Billed monthly by Paystack until you finish. A guided {site.programme.planWeeks}-week plan at about {site.programme.weeklyHours} hours a week. Cancel anytime from your dashboard. That&apos;s {site.priceComparison.toLowerCase()}.
        </p>
      )}
      */}
      {locked && <p className="mt-4 rounded-xl bg-success-light p-4 font-semibold text-success-dark">{priceLockLine(offer, naira)}</p>}
      {!locked && offer.windowOpen && offer.closesAt && (
        <div className="mt-4 rounded-xl bg-accent-50 p-4 text-accent-800">
          <p className="font-semibold">
            ⏳ Scholarship closes {formatClosingDate(offer.closesAt)}, {formatClosingTime(offer.closesAt)}. Join before then to keep {naira(offer.price)} a month.
          </p>
          <DeadlineCountdown closesAt={offer.closesAt} />
        </div>
      )}
    </div>
  );
}
