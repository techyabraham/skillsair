/** Guided 12-week plan, Monday to Friday (backend: GET /api/courses/:id/plan and GET /api/plans/me). */
/** guided: the daily plan; chapters: chapter view (the whole course by chapter, no daily plan). */
export type PlanPace = "guided" | "chapters";
export type PlanStatus = "finished" | "ahead" | "on_track" | "behind" | "overrun";
export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri";
export type PlanToday = DayKey | "weekend";
export type DayState = "done" | "done_early" | "today" | "missed" | "upcoming" | "free";

export interface PlanItem {
  type: "lesson" | "chapter_quiz" | "final_exam";
  id: number;
  title: string;
  sectionId: number | null;
  sectionTitle: string;
  minutes: number;
  done: boolean;
  plannedDay: DayKey;
  plannedWeek: number;
  /** Path into the course player (?lesson= or ?quiz=) or the exam page. */
  href: string;
}

export interface PlanDay {
  day: DayKey;
  /** Lagos date, YYYY-MM-DD. */
  date: string;
  minutes: number;
  state: DayState;
  doneCount: number;
  totalCount: number;
  items: PlanItem[];
}

export interface PlanWeek {
  week: number;
  /** The chapter most of the week belongs to, e.g. "End-point protection". */
  title: string;
  startsOn: string;
  endsOn: string;
  minutes: number;
  doneCount: number;
  totalCount: number;
  days: PlanDay[];
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
  today: PlanToday;
  /** Guided only. */
  status?: PlanStatus;
  daysAhead?: number;
  daysBehind?: number;
  finishBy: string;
  projectedFinish?: string | null;
  /** One week: the current week, or ?week=N. */
  week: PlanWeek;
  weeksSummary: Array<{ week: number; state: "done" | "current" | "upcoming" | "behind" }>;
  overdue?: PlanItem[];
  todayItems: PlanItem[];
  nextItem: PlanItem | null;
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
  today: PlanToday;
  status?: PlanStatus;
  daysAhead?: number;
  daysBehind?: number;
  days: Array<{ day: DayKey; state: DayState; minutes: number; count: number; doneCount: number }>;
  todayItems: PlanItem[];
  overdue: PlanItem[];
  nextItem: PlanItem | null;
  finishBy: string;
  resetAvailableAt: string | null;
  canReset: boolean;
  lastActivityAt: string | null;
}

export interface MyPlans {
  plans: PlanSummary[];
}
