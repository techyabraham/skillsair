import type { MetadataRoute } from "next";
import { getSchools } from "@/lib/catalog";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://skillsair.com";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPaths = ["", "/schools", "/scholarship", "/outcomes", "/about", "/faq", "/contact", "/quiz", "/privacy", "/terms", "/refunds", "/cookies", "/laptop-rules"];
  const entries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${SITE}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
  const schools = await getSchools().catch(() => []);
  const listed = new Set<string>();
  const dateOf = (value: string | null) => (value && !Number.isNaN(Date.parse(value)) ? new Date(value) : null);
  for (const school of schools) {
    // A school page changes when one of its programmes does.
    const latest = school.programmes.map((programme) => dateOf(programme.updatedAt)).filter((date): date is Date => Boolean(date)).sort((a, b) => b.getTime() - a.getTime())[0];
    entries.push({ url: `${SITE}/schools/${school.slug}`, lastModified: latest ?? now, changeFrequency: "weekly", priority: 0.8 });
    for (const programme of school.programmes) {
      if (listed.has(programme.slug)) continue;
      listed.add(programme.slug);
      entries.push({ url: `${SITE}/programmes/${programme.slug}`, lastModified: dateOf(programme.updatedAt) ?? now, changeFrequency: "weekly", priority: 0.9 });
    }
  }
  return entries;
}
