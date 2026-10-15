import { naira, site } from "@/content/site";
import { formatClosingDate, formatClosingTime, type Offer } from "@/lib/offer";
import { DeadlineCountdown } from "@/components/marketing/DeadlineCountdown";

type PriceFacts = Pick<
  Offer,
  "price" | "standardPrice" | "standardMonthlyPrice" | "effectivePrice" | "windowOpen" | "closesAt" | "certificatePrice"
>;

/**
 * The price is never shown bare: real anchor → scholarship → what you pay → certificate fee
 * (same size as body text) → the real closing date.
 */
export function OfferPriceBlock({ offer }: { offer: PriceFacts }) {
  const monthly = offer.standardMonthlyPrice ? ` (or ${naira(offer.standardMonthlyPrice)}/month)` : "";
  const showAnchor = offer.windowOpen && offer.standardPrice > offer.effectivePrice;
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 md:p-6">
      <dl className="space-y-3 text-base">
        {showAnchor && (
          <>
            <div className="flex items-start justify-between gap-4 text-neutral-600">
              <dt>Standard fee</dt>
              <dd className="text-right">
                <s>{naira(offer.standardPrice)}</s>
                <span className="block text-sm">{monthly.trim()}</span>
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4 text-success-dark">
              <dt>Access Scholarship</dt>
              <dd className="font-semibold">−{naira(offer.standardPrice - offer.effectivePrice)}</dd>
            </div>
          </>
        )}
        <div className="flex items-start justify-between gap-4 border-t border-neutral-200 pt-3">
          <dt className="font-semibold text-neutral-900">{offer.windowOpen ? "You pay, one time" : "Standard fee"}</dt>
          <dd className="text-right text-2xl font-heading font-extrabold text-neutral-900">
            {naira(offer.effectivePrice)}
            {!offer.windowOpen && monthly && <span className="block text-sm font-normal text-neutral-600">{monthly.trim()}</span>}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-4 text-neutral-700">
          <dt>Certificate (when you finish)</dt>
          <dd className="text-right">{naira(offer.certificatePrice)}, optional; needed for internship access</dd>
        </div>
      </dl>
      {offer.windowOpen && <p className="mt-4 text-neutral-700">That&apos;s {site.priceComparison.toLowerCase()}.</p>}
      {offer.windowOpen && offer.closesAt && (
        <div className="mt-4 rounded-xl bg-accent-50 p-4 text-accent-800">
          <p className="font-semibold">
            ⏳ Scholarship closes {formatClosingDate(offer.closesAt)}, {formatClosingTime(offer.closesAt)}
          </p>
          <DeadlineCountdown closesAt={offer.closesAt} />
        </div>
      )}
    </div>
  );
}
