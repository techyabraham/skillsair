"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { analyticsConfigured, GA_ID, META_PIXEL_ID, readConsent, writeConsent, type ConsentChoice } from "@/lib/analytics";

/** Loads GA4 / Meta Pixel only after consent, and shows the cookie banner while undecided. */
export function Analytics() {
  const [consent, setConsent] = useState<ConsentChoice | null | "unknown">("unknown");

  useEffect(() => {
    setConsent(readConsent());
    const onChange = (event: Event) => setConsent((event as CustomEvent<ConsentChoice>).detail);
    window.addEventListener("sa-consent", onChange);
    return () => window.removeEventListener("sa-consent", onChange);
  }, []);

  if (!analyticsConfigured || consent === "unknown") return null;

  if (consent === null) {
    return (
      <div role="region" aria-label="Cookie choice" className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200 bg-white p-4 shadow-modal">
        <div className="container-wide flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-neutral-700">We use cookies to measure and improve SkillsAir.</p>
          <div className="flex w-full gap-3 sm:w-auto">
            <button type="button" onClick={() => writeConsent("all")} className="min-h-12 flex-1 rounded-xl bg-primary-800 px-5 text-sm font-semibold text-white hover:bg-primary-900 sm:flex-none">
              Accept
            </button>
            <button type="button" onClick={() => writeConsent("essential")} className="min-h-12 flex-1 rounded-xl border-2 border-neutral-300 px-5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 sm:flex-none">
              Only essential
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (consent !== "all") return null;

  return (
    <>
      {GA_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config',${JSON.stringify(GA_ID)});`}
          </Script>
        </>
      )}
      {META_PIXEL_ID && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init',${JSON.stringify(META_PIXEL_ID)});fbq('track','PageView');`}
        </Script>
      )}
    </>
  );
}
