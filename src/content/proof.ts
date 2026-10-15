/**
 * Social proof slots. SkillsAir is new: there are no graduates, placements, ratings,
 * partner logos, testimonials or videos yet, so every list starts empty.
 *
 * Only items with `verified: true` are ever rendered, and a section with no verified
 * items is hidden. Never add an item you cannot evidence.
 */

export interface ProofStat {
  value: string;
  label: string;
  source: string;
  verified: boolean;
}

export interface ProofStory {
  name: string;
  programme: string;
  quote: string;
  outcome: string;
  photo?: string;
  /** Written permission from the learner to publish their story. */
  consentOnFile: boolean;
  verified: boolean;
}

export interface ProofPartner {
  name: string;
  logo: string;
  url?: string;
  verified: boolean;
}

export interface ProofVideo {
  title: string;
  youtubeId: string;
  verified: boolean;
}

export interface LaptopWinner {
  firstName: string;
  cohort: string;
  photo?: string;
  story?: string;
  consentToFeature: boolean;
  verified: boolean;
}

export const proof = {
  stats: [] as ProofStat[],
  stories: [] as ProofStory[],
  partners: [] as ProofPartner[],
  videos: [] as ProofVideo[],
  laptopWinners: [] as LaptopWinner[],
};

export function verifiedOnly<T extends { verified: boolean }>(items: readonly T[]): T[] {
  return items.filter((item) => item.verified === true);
}
