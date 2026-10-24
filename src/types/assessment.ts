export type QuizKind = "knowledge_check" | "chapter" | "final_exam";
export type QuestionType = "single" | "multiple" | "true_false";

/** A quiz as listed for the learner (GET /api/learning/courses/:id/assessments). */
export interface AssessmentQuiz {
  id: number;
  title: string;
  kind: QuizKind;
  sectionId: number | null;
  lessonId: number | null;
  passingScore: number;
  drawCount: number | null;
  timeLimitMinutes: number | null;
  maxAttempts: number | null;
  passed: boolean;
  bestScore: number | null;
  attempts: number;
  attemptsLeft: number | null;
  nextAttemptAt: string | null;
  inProgress: boolean;
  /** Final exam only: why it can't start yet. */
  locked: null | "finish_programme" | "buy_certificate" | "passed";
}

export interface CourseAssessments {
  complete: boolean;
  certificate: { status: "awaiting_exam" | "passed" } | null;
  quizzes: AssessmentQuiz[];
}

export interface AttemptQuestion {
  id: number;
  type: QuestionType;
  prompt: string;
  /** In the order this learner sees them. */
  options: string[];
}

export interface StartedAttempt {
  attemptId: number;
  attemptNumber: number;
  attemptsLeft: number | null;
  status: "in_progress" | "submitted" | "expired";
  quiz: { id: number; title: string; kind: QuizKind; passingScore: number; timeLimitMinutes: number | null; questionCount: number };
  startedAt: string | null;
  expiresAt: string | null;
  serverTime: string;
  /** Saved answers (question id -> chosen option positions). */
  answers: Record<string, number[]>;
  questions: AttemptQuestion[];
}

export interface SectionScore {
  sectionId: number | null;
  title: string;
  correct: number;
  total: number;
  percent: number;
  firstLessonId: number | null;
}

export interface AttemptResult {
  attemptId: number;
  status: "submitted" | "expired";
  quiz: { id: number; title: string; kind: QuizKind; passingScore: number };
  score: number;
  passed: boolean;
  attemptsLeft: number | null;
  nextAttemptAt: string | null;
  perSection: SectionScore[];
  chaptersToReview: SectionScore[];
  /** Chapter quizzes and knowledge checks only (the final exam never reveals answers). */
  feedback?: Array<{
    questionId: number;
    correct: boolean;
    chosen: number[];
    correctOptions: number[];
    explanation: string;
    lessonId: number | null;
    sourceTimestamp: string | null;
  }>;
  certificate?: { id: number; code: string; pdfUrl: string; scoreBand: "passed" | "distinction" } | null;
}
