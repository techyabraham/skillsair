import type { CoursePlan, MyPlans, PlanPace, PlanStatus } from "@/types/plan";

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
  course: (courseId: number) => `/api/learning/courses/${courseId}/plan`,
};

export const planApi = {
  mine: () => call<MyPlans>(planKeys.mine),
  course: (courseId: number) => call<CoursePlan>(planKeys.course(courseId)),
  setPace: (courseId: number, pace: PlanPace) => call<CoursePlan>(planKeys.course(courseId), { method: "PATCH", body: JSON.stringify({ pace }) }),
  reset: (courseId: number) => call<CoursePlan>(`${planKeys.course(courseId)}/reset`, { method: "POST", body: "{}" }),
};

/** "about 2 h 10 min", "about 45 min". */
export function timeLeft(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `about ${hours ? `${hours} h${rest ? ` ${rest} min` : ""}` : `${rest} min`}`;
}

/** "Monday 3 November" from a Lagos YYYY-MM-DD date. */
export function planDate(day: string, withYear = false): string {
  const [year, month, date] = day.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", ...(withYear ? { year: "numeric" } : {}), timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, date)));
}

/** "3 November" from an ISO timestamp, in Lagos. */
export function lagosDay(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Africa/Lagos" }).format(new Date(iso));
}

export const STATUS_CHIP: Record<PlanStatus, { label: string; className: string }> = {
  on_track: { label: "On track", className: "bg-success-light text-success-dark" },
  ahead: { label: "Ahead", className: "bg-primary-50 text-primary-800" },
  behind: { label: "Behind", className: "bg-warning-light text-amber-900" },
  overrun: { label: "Catching up", className: "bg-warning-light text-amber-900" },
  finished: { label: "Finished", className: "bg-success-light text-success-dark" },
};

/** The chip text: "On track", "2 weeks behind"… (text, never colour alone). */
export function statusLabel(status: PlanStatus, weeksBehind?: number): string {
  if (status === "behind" && weeksBehind) return `${weeksBehind} week${weeksBehind === 1 ? "" : "s"} behind`;
  return STATUS_CHIP[status].label;
}

/** Fires plan_week_completed once per programme and week, the first time the UI sees the week complete. */
export function weekCompletedOnce(courseId: number, week: number): boolean {
  const key = `sa_plan_week_done:${courseId}:${week}`;
  try {
    if (window.localStorage.getItem(key)) return false;
    window.localStorage.setItem(key, "1");
    return true;
  } catch {
    return false;
  }
}
