/** Guided 12-week plan (backend: GET /api/courses/:id/plan and GET /api/plans/me). */
export type PlanPace = "guided" | "self_paced";
export type PlanStatus = "finished" | "ahead" | "on_track" | "behind" | "overrun";

export interface PlanItem {
  type: "lesson" | "chapter_quiz" | "final_exam";
  id: number;
  title: string;
  sectionId: number | null;
  sectionTitle: string;
  minutes: number;
  done: boolean;
  /** Path into the course player (?lesson= or ?quiz=) or the exam page. */
  href: string;
}

export interface PlanWeek {
  week: number;
  /** Lagos dates, YYYY-MM-DD. */
  startsOn: string;
  endsOn: string;
  minutes: number;
  doneCount: number;
  totalCount: number;
  items: PlanItem[];
}

export interface CoursePlan {
  courseId: number;
  slug: string;
  title: string;
  pace: PlanPace;
  weeks: number;
  planVersion: string;
  startedAt: string;
  currentWeek: number;
  /** Guided only. */
  status?: PlanStatus;
  weeksBehind?: number;
  finishBy: string;
  projectedFinish?: string | null;
  thisWeek: PlanWeek;
  overdue?: PlanItem[];
  nextItem: PlanItem | null;
  plan: PlanWeek[];
  resetAvailableAt: string | null;
  canReset: boolean;
  resetCount: number;
}

export interface PlanSummary {
  courseId: number;
  slug: string;
  title: string;
  pace: PlanPace;
  currentWeek: number;
  weeks: number;
  status?: PlanStatus;
  weeksBehind?: number;
  thisWeek: { week: number; doneCount: number; totalCount: number; minutesLeft: number };
  nextItem: PlanItem | null;
  resetAvailableAt: string | null;
  canReset: boolean;
}

export interface MyPlans {
  plans: PlanSummary[];
}
