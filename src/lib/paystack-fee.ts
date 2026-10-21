/**
 * Paystack's Nigerian local fee, passed on to learners on enrolment payments (course and monthly
 * plans): 1.5% + ₦100, the ₦100 waived under ₦2,500, capped at ₦2,000. Display only: the backend
 * (src/lib/billing.ts in skillsair-backend) works out what is actually charged. Keep them in sync.
 */
const PERCENT = 0.015;
const FLAT = 100;
const FLAT_FROM = 2500;
const CAP = 2000;

export function paystackFee(price: number): number {
  if (!(price > 0)) return 0;
  const gross = (flat: number) => Math.ceil((price + flat) / (1 - PERCENT));
  let total = gross(0);
  if (total >= FLAT_FROM) total = gross(FLAT);
  return Math.min(total - price, CAP);
}

export function withPaystackFee(price: number): number {
  return price + paystackFee(price);
}
