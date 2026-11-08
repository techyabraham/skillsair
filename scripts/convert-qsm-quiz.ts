/**
 * One-off conversion of the old WordPress "Tech Quiz" (QSM plugin export) into SkillsAir data.
 *
 *   node scripts/convert-qsm-quiz.ts [path/to/qsm_quizzes_surveys.json]
 *
 * Defaults to docs/legacy/qsm_quizzes_surveys.json. Writes src/content/quiz-qsm.generated.ts:
 * every QSM question with its answers decoded (HTML entities, PHP-serialized label weights
 * mapped to career ids), plus the per-career result copy from QSM's result pages. The v2 quiz
 * in src/content/quiz-v2.ts is hand-edited on top of this file, and quiz-v2.spec.ts checks that
 * the answers kept from QSM still carry the original weights. Re-run this script only to
 * refresh the generated source; it never touches the hand-edited quiz.
 *
 * Deliberately NOT imported: quiz results (empty in the export), the admin email address,
 * QSM's email template and its HTML/CSS. No WordPress URL is called.
 *
 * Runs on Node 22.6+ (type stripping), with no dependencies.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

// ---------------------------------------------------------------------------------------------
// Minimal PHP unserialize (strings are byte-length prefixed, so work on a UTF-8 buffer).
// ---------------------------------------------------------------------------------------------
type PhpValue = string | number | boolean | null | PhpArray;
interface PhpArray {
  [key: string]: PhpValue;
}

export function phpUnserialize(input: string): PhpValue {
  const buf = Buffer.from(input, "utf8");
  let pos = 0;
  const readUntil = (char: string): string => {
    const end = buf.indexOf(char, pos);
    if (end < 0) throw new Error(`Malformed PHP data at ${pos}`);
    const out = buf.toString("utf8", pos, end);
    pos = end + 1;
    return out;
  };
  const parse = (): PhpValue => {
    const type = String.fromCharCode(buf[pos]!);
    pos += 2; // type and ':' (or ';' for N)
    switch (type) {
      case "N":
        return null;
      case "b":
        return readUntil(";") === "1";
      case "i":
      case "d":
        return Number(readUntil(";"));
      case "s": {
        const length = Number(readUntil(":"));
        pos += 1; // opening quote
        const value = buf.toString("utf8", pos, pos + length);
        pos += length + 2; // closing quote and ';'
        return value;
      }
      case "a": {
        const count = Number(readUntil(":"));
        pos += 1; // '{'
        const out: PhpArray = {};
        for (let index = 0; index < count; index += 1) {
          const key = parse();
          out[String(key)] = parse();
        }
        pos += 1; // '}'
        return out;
      }
      default:
        throw new Error(`Unsupported PHP type "${type}" at ${pos}`);
    }
  };
  return parse();
}

export function decodeEntities(text: string): string {
  return text
    .replace(/&#0*39;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&quot;/g, '"')
    .replace(/&rsquo;|&lsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

const stripHtml = (html: string) =>
  decodeEntities(html.replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|li|h\d|div)>/gi, "\n").replace(/<[^>]+>/g, ""))
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

// ---------------------------------------------------------------------------------------------
// QSM label ids → SkillsAir career ids (labels 238–250).
// ---------------------------------------------------------------------------------------------
export const QSM_LABELS: Record<number, string> = {
  238: "frontend",
  239: "backend",
  240: "ethical-hacking",
  241: "smartphone-videography",
  242: "cybersecurity",
  243: "mobile-app",
  244: "content-creation",
  245: "graphics-design",
  246: "product-management",
  247: "data-analysis",
  248: "it-support",
  249: "qa-testing",
  250: "ui-ux",
};

interface QsmQuestion {
  question_id: string;
  question_settings: string;
  answer_array: string;
  question_order: string;
}

interface QsmExport {
  quizzes: Array<{ quiz_name: string; quiz_taken: string; questions: Record<string, QsmQuestion>; message_after: string }>;
}

export interface ConvertedAnswer {
  text: string;
  weights: Record<string, number>;
}

export interface ConvertedQuestion {
  qsmId: number;
  order: number;
  question: string;
  answers: ConvertedAnswer[];
}

export function convertQuestion(raw: QsmQuestion): ConvertedQuestion {
  const settings = phpUnserialize(raw.question_settings) as PhpArray;
  const answers = phpUnserialize(raw.answer_array) as PhpArray;
  return {
    qsmId: Number(raw.question_id),
    order: Number(raw.question_order),
    question: decodeEntities(String(settings.question_title ?? "")).trim(),
    answers: Object.values(answers).map((value) => {
      const answer = value as PhpArray;
      const labels = answer.answer_label ? (phpUnserialize(String(answer.answer_label)) as PhpArray) : {};
      const weights: Record<string, number> = {};
      for (const [label, points] of Object.entries(labels)) {
        const career = QSM_LABELS[Number(label)];
        if (!career) throw new Error(`Unknown QSM label ${label} in question ${raw.question_id}`);
        weights[career] = Number(points);
      }
      return { text: decodeEntities(String(answer["0"] ?? "")).trim(), weights };
    }),
  };
}

/** Each result page is conditioned on one label; keep its text lines as raw copy for editing. */
export function convertResultPages(messageAfter: string): Record<string, string[]> {
  const pages = phpUnserialize(messageAfter) as PhpArray;
  const out: Record<string, string[]> = {};
  for (const value of Object.values(pages)) {
    const page = value as PhpArray;
    const condition = Object.values((page.conditions as PhpArray | undefined) ?? {})[0] as PhpArray | undefined;
    const label = Number(String(condition?.extra_condition ?? "").replace("qsm-label-", ""));
    const career = QSM_LABELS[label];
    if (!career) continue;
    out[career] = stripHtml(String(page.page ?? ""));
  }
  return out;
}

function main(): void {
  const input = resolve(process.argv[2] ?? "docs/legacy/qsm_quizzes_surveys.json");
  const data = JSON.parse(readFileSync(input, "utf8")) as QsmExport;
  const quiz = data.quizzes[0];
  if (!quiz) throw new Error("No quiz in export");
  const questions = Object.values(quiz.questions).map(convertQuestion).sort((a, b) => a.order - b.order || a.qsmId - b.qsmId);
  const resultCopy = convertResultPages(quiz.message_after);

  const header = `/**
 * GENERATED by scripts/convert-qsm-quiz.ts from the QSM export ("${quiz.quiz_name}", taken ${quiz.quiz_taken} times).
 * Do not edit by hand: the v2 quiz (src/content/quiz-v2.ts) is the edited version.
 * Source material only. Result copy contains claims that v2 deliberately drops.
 */
`;
  const body = `export interface QsmAnswer {
  text: string;
  weights: Record<string, number>;
}

export interface QsmQuestion {
  qsmId: number;
  order: number;
  question: string;
  answers: QsmAnswer[];
}

export const qsmQuestions: QsmQuestion[] = ${JSON.stringify(questions, null, 2)};

/** Text lines of each career's QSM result page (unedited). */
export const qsmResultCopy: Record<string, string[]> = ${JSON.stringify(resultCopy, null, 2)};
`;
  const output = resolve("src/content/quiz-qsm.generated.ts");
  writeFileSync(output, header + body);
  console.log(`Wrote ${questions.length} questions and ${Object.keys(resultCopy).length} result pages to ${output}`);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename ?? "")) main();
