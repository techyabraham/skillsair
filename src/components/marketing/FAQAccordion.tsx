import Link from "next/link";
import type { FaqItem } from "@/content/faq";

/** Native <details> accordion: keyboard accessible and works without JavaScript. */
export function FAQAccordion({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white">
      {items.map((item) => (
        <details key={item.id} id={item.id} className="group px-5 py-1 md:px-6">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-3 text-left font-semibold text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-800 [&::-webkit-details-marker]:hidden">
            <span>{item.question}</span>
            <svg className="h-5 w-5 shrink-0 text-neutral-500 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="pb-5 text-neutral-600 leading-relaxed">
            <p>{item.answer}</p>
            {item.link && (
              <p className="mt-2">
                <Link href={item.link.href} className="font-medium text-primary-800 underline underline-offset-2">
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
