import Link from "next/link";
import type { FaqItem } from "@/content/faq";

/**
 * Design: hairline-ruled list, 18px semibold navy questions with an orange "+".
 * Native <details> keeps it keyboard accessible and working without JavaScript.
 */
export function FAQAccordion({ items }: { items: FaqItem[] }) {
  return (
    <div className="border-t border-neutral-200">
      {items.map((item) => (
        <details key={item.id} id={item.id} className="group border-b border-neutral-200 py-5 md:py-[22px]">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-left text-lg font-semibold text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-800 [&::-webkit-details-marker]:hidden">
            <span>{item.question}</span>
            <span aria-hidden="true" className="shrink-0 text-2xl font-normal leading-none text-accent-700 transition-transform group-open:rotate-45">+</span>
          </summary>
          <div className="mt-3 text-base leading-relaxed text-neutral-700">
            <p>{item.answer}</p>
            {item.link && (
              <p className="mt-2">
                <Link href={item.link.href} className="font-semibold text-navy underline underline-offset-4">
                  {item.link.label}
                </Link>
              </p>
            )}
          </div>
        </details>
      ))}
    </div>
  );
}
