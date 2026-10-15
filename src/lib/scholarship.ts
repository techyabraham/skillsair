import { backendUrl } from "@/lib/backend-api";

export interface ScholarshipWindow {
  isOpen: boolean;
  closesAt: string | null;
  cohortLabel: string;
  laptopsPerCohort: number;
}

const CLOSED: ScholarshipWindow = { isOpen: false, closesAt: null, cohortLabel: "", laptopsPerCohort: 2 };

/**
 * The live scholarship window from the backend global (cached 5 minutes). Urgency on the
 * site only ever comes from here; if it can't be loaded, the site shows no deadline.
 */
export async function getScholarshipWindow(): Promise<ScholarshipWindow> {
  try {
    const response = await fetch(backendUrl("globals/scholarship-window?depth=0"), {
      headers: { Accept: "application/json", "User-Agent": "SkillsAir-Frontend/1.0" },
      next: { revalidate: 300 },
    });
    if (!response.ok) return CLOSED;
    const doc = (await response.json()) as {
      isOpen?: boolean;
      opensAt?: string | null;
      closesAt?: string | null;
      cohortLabel?: string | null;
      laptopsPerCohort?: number | null;
    };
    const now = Date.now();
    const open =
      Boolean(doc.isOpen) &&
      Boolean(doc.closesAt) &&
      new Date(doc.closesAt as string).getTime() > now &&
      (!doc.opensAt || new Date(doc.opensAt).getTime() <= now);
    return {
      isOpen: open,
      closesAt: open ? doc.closesAt ?? null : null,
      cohortLabel: doc.cohortLabel ?? "",
      laptopsPerCohort: doc.laptopsPerCohort ?? 2,
    };
  } catch {
    return CLOSED;
  }
}
