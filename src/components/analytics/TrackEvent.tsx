"use client";

import { useEffect } from "react";
import { track, type FunnelEvent } from "@/lib/analytics";

/** Fires one funnel event when a server-rendered page mounts. */
export function TrackEvent({ event, params }: { event: FunnelEvent; params?: Record<string, string | number | boolean> }) {
  const serialised = JSON.stringify(params ?? {});
  useEffect(() => {
    track(event, JSON.parse(serialised) as Record<string, string | number | boolean>);
  }, [event, serialised]);
  return null;
}
