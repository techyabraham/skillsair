import type { AttemptResult, CourseAssessments, StartedAttempt } from "@/types/assessment";

/** An assessment call that failed, with the backend's code (QUIZ_COOLDOWN, CERTIFICATE_PURCHASE_REQUIRED…). */
export class AssessmentError extends Error {
  constructor(message: string, readonly code: string, readonly status: number, readonly fields?: Record<string, string>) {
    super(message);
    this.name = "AssessmentError";
  }
}

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { cache: "no-store", ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  } catch {
    throw new AssessmentError("You're offline. We'll keep trying.", "NETWORK", 0);
  }
  const body = (await response.json().catch(() => ({}))) as T & { message?: string; code?: string; fields?: Record<string, string> };
  if (!response.ok) throw new AssessmentError(body.message || "Something went wrong. Please try again.", body.code || "ERROR", response.status, body.fields);
  return body;
}

export const assessmentApi = {
  courseAssessments: (courseId: number) => call<CourseAssessments>(`/api/learning/courses/${courseId}/assessments`),
  start: (quizId: number) => call<StartedAttempt>(`/api/learning/quizzes/${quizId}/start`, { method: "POST", body: "{}" }),
  save: (attemptId: number, answers: Record<string, number[]>) =>
    call<{ saved: boolean; savedAt: string; answered: number }>(`/api/learning/attempts/${attemptId}/answers`, { method: "PUT", body: JSON.stringify({ answers }), keepalive: true }),
  submit: (attemptId: number, answers?: Record<string, number[]>) =>
    call<AttemptResult>(`/api/learning/attempts/${attemptId}/submit`, { method: "POST", body: JSON.stringify(answers ? { answers } : {}) }),
};

/** "04:12" or "1:04:12" -> seconds. */
export function timestampSeconds(value: string | null | undefined): number | null {
  if (!value) return null;
  const parts = value.split(":").map(Number);
  if (parts.some((part) => !Number.isFinite(part))) return null;
  return parts.reduce((total, part) => total * 60 + part, 0);
}

/** "Thursday 3:40pm" in Lagos time. */
export function lagosTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Africa/Lagos" }).format(new Date(iso));
}
