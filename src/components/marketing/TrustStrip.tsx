import { site } from "@/content/site";

const ITEMS = [
  `Registered in Nigeria · ${site.cacNumber}`,
  "Payments secured by Paystack",
  "Verifiable certificates",
  "Free preview lesson",
  "Fair refund promise",
];

/** Design: one ruled row of true statements with ticks. */
export function TrustStrip() {
  return (
    <section aria-label="Why you can trust SkillsAir" className="border-b border-neutral-200 bg-white">
      <ul className="container-wide flex flex-wrap justify-between gap-x-8 gap-y-3 py-[22px] text-sm font-medium text-neutral-700">
        {ITEMS.map((item) => (
          <li key={item}>
            <span aria-hidden="true">✓ </span>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
