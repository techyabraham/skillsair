/**
 * Curated stock photos (Unsplash, free licence) until real learner photos exist. They show
 * young Black and African people learning and working in authentic settings, not posed
 * studio shots. Each was checked by eye; alt text describes what is actually in the picture.
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
  hero: { id: "1716654718430-c7f54c3125c8", alt: "Smiling young woman with braids studying on a laptop in a classroom" },
  learning: { id: "1541178735493-479c1a27ed24", alt: "Young man working on a laptop at a desk" },
  career: { id: "1675250719891-37d4747c9e3d", alt: "Young woman in a blue blazer working on a laptop" },
  focus: { id: "1604933762021-54a5858c9832", alt: "Young woman with long braids using a laptop at a desk" },
  phone: { id: "1714327676544-48dafc3ffa41", alt: "Young woman using her smartphone" },
  support: { id: "1758876202167-f81c995c3fdc", alt: "Young woman on a phone call at her desk with a laptop and notebook" },
} satisfies Record<string, StockImage>;
