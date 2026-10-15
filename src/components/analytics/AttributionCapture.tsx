"use client";

import { useEffect } from "react";
import { ATTRIBUTION_COOKIE } from "@/lib/lead-session";

const MAX_AGE = 90 * 24 * 60 * 60;

/**
 * Stores first-touch attribution (UTMs, referrer, landing path) in a first-party cookie for
 * 90 days, so a lead created later is credited to the visit that brought them.
 */
export function AttributionCapture() {
  useEffect(() => {
    try {
      if (document.cookie.split("; ").some((row) => row.startsWith(`${ATTRIBUTION_COOKIE}=`))) return;
      const params = new URLSearchParams(window.location.search);
      const utm = {
        source: params.get("utm_source") || undefined,
        medium: params.get("utm_medium") || undefined,
        campaign: params.get("utm_campaign") || undefined,
        content: params.get("utm_content") || undefined,
        term: params.get("utm_term") || undefined,
      };
      let referrer = "";
      try {
        if (document.referrer && new URL(document.referrer).host !== window.location.host) referrer = document.referrer;
      } catch {
        referrer = "";
      }
      const value = encodeURIComponent(
        JSON.stringify({ utm, referrer: referrer.slice(0, 500), landingPath: window.location.pathname.slice(0, 500) }),
      );
      document.cookie = `${ATTRIBUTION_COOKIE}=${value}; path=/; max-age=${MAX_AGE}; samesite=lax`;
    } catch {
      // Attribution is best effort.
    }
  }, []);
  return null;
}
