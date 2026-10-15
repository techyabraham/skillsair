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
  for (const school of schools) {
    entries.push({ url: `${SITE}/schools/${school.slug}`, lastModified: now, changeFrequency: "weekly", priority: 0.8 });
    for (const programme of school.programmes) {
      entries.push({ url: `${SITE}/programmes/${programme.slug}`, lastModified: now, changeFrequency: "weekly", priority: 0.9 });
    }
  }
  return entries;
}
