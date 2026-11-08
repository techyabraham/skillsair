/**
 * Copies src/content/quiz-v2.ts to the backend, which validates answers and recomputes scores
 * on the server (never trusting client scores).
 *
 *   node scripts/sync-quiz-to-backend.ts [path/to/skillsair-backend]
 *
 * quiz.test.ts fails while the two copies differ.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const backend = resolve(process.argv[2] ?? "../skillsair-backend");
const source = readFileSync(resolve("src/content/quiz-v2.ts"), "utf8");
const target = resolve(backend, "src/content/career-quiz.ts");
writeFileSync(target, `// SYNCED from skillsair/src/content/quiz-v2.ts by scripts/sync-quiz-to-backend.ts. Edit the frontend copy.\n${source}`);
console.log(`Wrote ${target}`);
