/**
 * Curated stock photos (Unsplash) until real learner photos exist. Prioritise Black and
 * African people in authentic study and work scenes; avoid glossy posed shots.
 * Preview a photo at https://unsplash.com/photos/<id> before swapping it in.
 */

export interface StockImage {
  id: string;
  alt: string;
}

export function unsplashUrl(id: string, width = 1200): string {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=75`;
}

export const images = {
  hero: { id: "1573496359142-b8d87734a5a2", alt: "Young Black woman working on a laptop" },
  learning: { id: "1580894894513-541e068a3e2b", alt: "Young African learner studying online" },
  collaboration: { id: "1509062522246-3755977927d7", alt: "Learners working together around a laptop" },
  career: { id: "1573497019236-17f8177b81e8", alt: "Black professional woman at work" },
  phone: { id: "1627556704290-2b1f5853ff78", alt: "Young person learning on a smartphone" },
} satisfies Record<string, StockImage>;
