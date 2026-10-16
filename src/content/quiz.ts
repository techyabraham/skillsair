/**
 * Career Match quiz: 8 questions with transparent, rules-based weights. Each answer adds
 * points to one or more schools (keys are normalised school names). It is not AI-powered.
 */

export type SchoolKey =
  | "ai"
  | "contentcreation"
  | "data"
  | "design"
  | "engineering"
  | "nocodedevelopment"
  | "products"
  | "salesandmarketing"
  | "security"
  | "smartphonecreators";

export interface QuizOption {
  label: string;
  weights: Partial<Record<SchoolKey, number>>;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
}

export const quizQuestions: QuizQuestion[] = [
  {
    id: "enjoy",
    question: "Which of these sounds most like fun to you?",
    options: [
      { label: "Spotting patterns in numbers", weights: { data: 3, ai: 1 } },
      { label: "Making things look beautiful", weights: { design: 3, contentcreation: 1 } },
      { label: "Figuring out how things work and building them", weights: { engineering: 3, nocodedevelopment: 2 } },
      { label: "Talking to people and persuading them", weights: { salesandmarketing: 3, products: 1 } },
    ],
  },
  {
    id: "device",
    question: "What will you mostly learn on?",
    options: [
      { label: "My phone", weights: { smartphonecreators: 3, contentcreation: 1, data: 1, products: 1 } },
      { label: "A laptop", weights: { engineering: 2, data: 1, design: 1, security: 1 } },
      { label: "Both", weights: {} },
    ],
  },
  {
    id: "problem",
    question: "A small business near you is struggling. What would you do first?",
    options: [
      { label: "Look at their sales records to see what's going wrong", weights: { data: 3 } },
      { label: "Redesign their logo, flyers and social pages", weights: { design: 2, contentcreation: 2 } },
      { label: "Build them a simple website or app", weights: { nocodedevelopment: 3, engineering: 2 } },
      { label: "Run ads and bring in more customers", weights: { salesandmarketing: 3 } },
    ],
  },
  {
    id: "online",
    question: "What do you do most online?",
    options: [
      { label: "Watch and make videos", weights: { contentcreation: 3, smartphonecreators: 2 } },
      { label: "Read about new tech and AI tools", weights: { ai: 3, engineering: 1 } },
      { label: "Follow brands and trends", weights: { salesandmarketing: 2, design: 1 } },
      { label: "Read about scams, hacks and online safety", weights: { security: 3 } },
    ],
  },
  {
    id: "role",
    question: "In a group project, you usually…",
    options: [
      { label: "Plan the work and keep everyone on track", weights: { products: 3 } },
      { label: "Make the slides look great", weights: { design: 3 } },
      { label: "Do the research and the numbers", weights: { data: 3 } },
      { label: "Present and convince the audience", weights: { salesandmarketing: 2, contentcreation: 1 } },
    ],
  },
  {
    id: "ai",
    question: "How do you feel about AI tools like ChatGPT?",
    options: [
      { label: "I use them daily and want to go deeper", weights: { ai: 3 } },
      { label: "I'd like to use them to work faster", weights: { ai: 1, nocodedevelopment: 1, products: 1 } },
      { label: "Not really my thing", weights: {} },
    ],
  },
  {
    id: "detail",
    question: "Which describes you best?",
    options: [
      { label: "Careful, I notice small mistakes", weights: { security: 2, data: 1, engineering: 1 } },
      { label: "Creative, full of ideas", weights: { design: 1, contentcreation: 2 } },
      { label: "Practical, I like quick results", weights: { nocodedevelopment: 2, smartphonecreators: 1 } },
      { label: "A people person", weights: { salesandmarketing: 2, products: 1 } },
    ],
  },
  {
    id: "goal",
    question: "What do you want most in the next year?",
    options: [
      { label: "A stable job in a company", weights: { data: 1, engineering: 1, security: 1, products: 1 } },
      { label: "Freelance clients and side income", weights: { design: 1, contentcreation: 1, nocodedevelopment: 1, smartphonecreators: 1 } },
      { label: "To grow a brand or business", weights: { salesandmarketing: 2, contentcreation: 1 } },
      { label: "To work on the newest technology", weights: { ai: 2, engineering: 1 } },
    ],
  },
];

export function schoolKey(name: string): string {
  return name.toLowerCase().replace(/^school of /, "").replace(/[^a-z]/g, "");
}

/** Scores answers into percentages (share of the maximum possible points for each school). */
export function scoreQuiz(answers: number[]): Array<{ key: SchoolKey; score: number }> {
  const totals = new Map<SchoolKey, number>();
  const maxima = new Map<SchoolKey, number>();
  quizQuestions.forEach((question, index) => {
    const chosen = question.options[answers[index] ?? -1];
    for (const [key, points] of Object.entries(chosen?.weights ?? {}) as Array<[SchoolKey, number]>) {
      totals.set(key, (totals.get(key) ?? 0) + points);
    }
    const questionMax = new Map<SchoolKey, number>();
    for (const option of question.options) {
      for (const [key, points] of Object.entries(option.weights) as Array<[SchoolKey, number]>) {
        questionMax.set(key, Math.max(questionMax.get(key) ?? 0, points));
      }
    }
    questionMax.forEach((points, key) => maxima.set(key, (maxima.get(key) ?? 0) + points));
  });
  return Array.from(maxima.keys())
    .map((key) => ({ key, score: Math.round(((totals.get(key) ?? 0) / (maxima.get(key) || 1)) * 100) }))
    .sort((a, b) => b.score - a.score);
}
