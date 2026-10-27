import type { CoursePlan, DayKey, MyPlans, PlanPace, PlanStatus } from "@/types/plan";

/** A plan call that failed, with the backend's code (PLAN_RESET_COOLDOWN, FEATURE_DISABLED…). */
export class PlanError extends Error {
  constructor(message: string, readonly code: string, readonly status: number, readonly fields?: Record<string, string>) {
    super(message);
    this.name = "PlanError";
  }
}

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { cache: "no-store", ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  } catch {
    throw new PlanError("You're offline. Check your connection and try again.", "NETWORK", 0);
  }
  const body = (await response.json().catch(() => ({}))) as T & { message?: string; code?: string; fields?: Record<string, string> };
  if (!response.ok) throw new PlanError(body.message || "Something went wrong. Please try again.", body.code || "ERROR", response.status, body.fields);
  return body;
}

export const planKeys = {
  mine: "/api/learning/plans/me",
  course: (courseId: number, week?: number) => `/api/learning/courses/${courseId}/plan${week ? `?week=${week}` : ""}`,
};

export const planApi = {
  mine: () => call<MyPlans>(planKeys.mine),
  course: (courseId: number, week?: number) => call<CoursePlan>(planKeys.course(courseId, week)),
  setPace: (courseId: number, pace: PlanPace) => call<CoursePlan>(planKeys.course(courseId), { method: "PATCH", body: JSON.stringify({ pace }) }),
  reset: (courseId: number) => call<CoursePlan>(`${planKeys.course(courseId)}/reset`, { method: "POST", body: "{}" }),
};

export const DAY_NAME: Record<DayKey, string> = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday" };
export const DAY_SHORT: Record<DayKey, string> = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri" };

/** "about 2 h 10 min", "about 45 min". */
export function timeLeft(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `about ${hours ? `${hours} h${rest ? ` ${rest} min` : ""}` : `${rest} min`}`;
}

const fromKey = (day: string) => {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, date));
};

/** "22 January 2027" (or "Monday 3 November") from a Lagos YYYY-MM-DD date. */
export function planDate(day: string, withWeekday = false): string {
  return new Intl.DateTimeFormat("en-GB", { ...(withWeekday ? { weekday: "long" } : {}), day: "numeric", month: "long", ...(withWeekday ? {} : { year: "numeric" }), timeZone: "UTC" }).format(fromKey(day));
}

/** "26–30 October", "30 October – 3 November". */
export function weekRange(startsOn: string, endsOn: string): string {
  const start = fromKey(startsOn);
  const end = fromKey(endsOn);
  const month = (date: Date) => new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: "UTC" }).format(date);
  return month(start) === month(end) ? `${start.getUTCDate()}–${end.getUTCDate()} ${month(end)}` : `${start.getUTCDate()} ${month(start)} – ${end.getUTCDate()} ${month(end)}`;
}

/** "Tuesday 3 November" from an ISO timestamp, in Lagos. */
export function lagosDay(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Africa/Lagos" }).format(new Date(iso));
}

/** "1 day", "2 days", "1 week" (from 5 days). */
export function dayGap(days: number): string {
  if (days >= 5) {
    const weeks = Math.floor(days / 5);
    return `${weeks} week${weeks === 1 ? "" : "s"}`;
  }
  return `${days} day${days === 1 ? "" : "s"}`;
}

/** Chip colours (text always says the status too). */
export const STATUS_CHIP: Record<PlanStatus, string> = {
  on_track: "bg-success-light text-success-dark",
  ahead: "bg-blue-100 text-blue-900",
  behind: "bg-warning-light text-amber-900",
  overrun: "bg-warning-light text-amber-900",
  finished: "bg-success-light text-success-dark",
};

/** "On track", "1 day ahead of the class", "2 days behind", "Finished". */
export function statusLabel(status: PlanStatus, daysAhead = 0, daysBehind = 0, short = false): string {
  if (status === "ahead") return `${dayGap(Math.max(1, daysAhead))} ahead${short ? "" : " of the class"}`;
  if (status === "behind") return `${dayGap(Math.max(1, daysBehind))} behind`;
  if (status === "overrun") return "Catching up";
  return status === "finished" ? "Finished" : "On track";
}

/** Fires an analytics event once per key in this browser (plan_week_completed, plan_ahead per day). */
export function once(key: string): boolean {
  try {
    if (window.localStorage.getItem(key)) return false;
    window.localStorage.setItem(key, "1");
    return true;
  } catch {
    return false;
  }
}
