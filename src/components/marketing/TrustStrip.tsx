import { site } from "@/content/site";

const ITEMS = [
  `Registered in Nigeria · ${site.cacNumber}`,
  "Payments secured by Paystack",
  "Verifiable certificates",
  "Free preview lesson",
  "Fair refund promise",
];

/** Only true statements. Replaces the old invented stats. */
export function TrustStrip() {
  return (
    <section aria-label="Why you can trust SkillsAir" className="border-y border-neutral-200 bg-neutral-50">
      <ul className="container-wide flex flex-wrap items-center justify-center gap-x-8 gap-y-3 py-5 text-sm font-medium text-neutral-700">
        {ITEMS.map((item) => (
          <li key={item} className="flex items-center gap-2">
            <svg className="h-4 w-4 shrink-0 text-success-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
