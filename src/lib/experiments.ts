/**
 * Lightweight A/B hooks. The middleware assigns each visitor a stable variant per experiment
 * in the first-party `sa_exp` cookie; pages read it server-side (no layout shift) and report
 * it to GA4 as `experiment_variant`.
 */

export const EXPERIMENT_COOKIE = "sa_exp";

export const EXPERIMENTS = {
  hero: ["A", "B", "C"],
  cta: ["qualify", "apply"],
} as const;

export type ExperimentName = keyof typeof EXPERIMENTS;
export type Assignments = { [K in ExperimentName]: (typeof EXPERIMENTS)[K][number] };

const DEFAULTS: Assignments = { hero: "A", cta: "qualify" };

export function parseAssignments(raw: string | undefined): Assignments {
  const result: Assignments = { ...DEFAULTS };
  if (!raw) return result;
  for (const pair of raw.split(".")) {
    const [name, value] = pair.split("-") as [string, string];
    if (name === "hero" && (EXPERIMENTS.hero as readonly string[]).includes(value)) result.hero = value as Assignments["hero"];
    if (name === "cta" && (EXPERIMENTS.cta as readonly string[]).includes(value)) result.cta = value as Assignments["cta"];
  }
  return result;
}

export function serialiseAssignments(assignments: Assignments): string {
  return `hero-${assignments.hero}.cta-${assignments.cta}`;
}

export function randomAssignments(random: () => number = Math.random): Assignments {
  const pick = <T,>(options: readonly T[]) => options[Math.floor(random() * options.length)] as T;
  return { hero: pick(EXPERIMENTS.hero), cta: pick(EXPERIMENTS.cta) };
}

export const CTA_LABELS: Record<Assignments["cta"], string> = {
  qualify: "Check if you qualify →",
  apply: "Apply now →",
};
