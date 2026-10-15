"use client";

import { useEffect, useState } from "react";

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

function parts(ms: number) {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  return { days: Math.floor(totalMinutes / 1440), hours: Math.floor((totalMinutes % 1440) / 60), minutes: totalMinutes % 60 };
}

/**
 * A live countdown to the real backend closing time, shown only in the last 7 days.
 * It updates every minute and is not announced to screen readers on each tick.
 */
export function DeadlineCountdown({ closesAt }: { closesAt: string }) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const target = new Date(closesAt).getTime();
    const tick = () => setRemaining(target - Date.now());
    tick();
    const timer = window.setInterval(tick, 60000);
    return () => window.clearInterval(timer);
  }, [closesAt]);

  if (remaining === null || remaining <= 0 || remaining > SEVEN_DAYS) return null;
  const { days, hours, minutes } = parts(remaining);
  return (
    <p className="mt-1 text-sm" aria-hidden="true">
      {days > 0 ? `${days} day${days === 1 ? "" : "s"}, ` : ""}
      {hours} hour{hours === 1 ? "" : "s"} and {minutes} minute{minutes === 1 ? "" : "s"} left
    </p>
  );
}
