"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { WhatsAppIcon } from "@/components/marketing/WhatsAppButton";
import { whatsappLink } from "@/content/site";

/** Phones only: after 30% of the page, a bottom bar with the one primary action and WhatsApp. */
export function StickyMobileCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setVisible(scrollable > 0 && window.scrollY / scrollable > 0.3);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white p-3 shadow-modal transition-transform duration-200 md:hidden ${visible ? "translate-y-0" : "translate-y-full"}`}
      aria-hidden={!visible}
    >
      <div className="flex gap-3">
        <Link href="/apply" tabIndex={visible ? 0 : -1} className="flex min-h-12 flex-1 items-center justify-center rounded-xl bg-accent-700 px-4 text-sm font-semibold text-white hover:bg-accent-800">
          Apply for a scholarship seat →
        </Link>
        <a
          href={whatsappLink()}
          target="_blank"
          rel="noopener noreferrer"
          tabIndex={visible ? 0 : -1}
          aria-label="Chat with Imisi on WhatsApp"
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#075E54] text-white"
        >
          <WhatsAppIcon className="h-6 w-6" />
        </a>
      </div>
    </div>
  );
}
