import { backendUrl } from "@/lib/backend-api";

/** Lexical rich text as stored by the Payload `pages` collection. */
export interface LexicalNode {
  type?: string;
  tag?: string;
  text?: string;
  format?: number | string;
  url?: string;
  listType?: string;
  fields?: { url?: string; newTab?: boolean };
  children?: LexicalNode[];
}

export interface CmsPage {
  title: string;
  slug: string;
  content: { root?: LexicalNode } | null;
  updatedAt: string;
}

export type CmsPageResult =
  | { status: "published"; page: CmsPage }
  | { status: "missing" }
  | { status: "unavailable" };

/** Published pages only (the backend hides drafts from the public). Cached for 5 minutes. */
export async function getPublishedPage(slug: string): Promise<CmsPageResult> {
  if (!/^[a-z0-9-]{1,100}$/.test(slug)) return { status: "missing" };
  const query = new URLSearchParams({
    limit: "1",
    depth: "0",
    "where[slug][equals]": slug,
    "where[status][equals]": "published",
  });
  try {
    const response = await fetch(backendUrl(`pages?${query}`), {
      headers: { Accept: "application/json", "User-Agent": "SkillsAir-Frontend/1.0" },
      next: { revalidate: 300 },
    });
    if (!response.ok) return { status: "unavailable" };
    const payload = (await response.json()) as { docs?: CmsPage[] };
    const page = payload.docs?.[0];
    return page ? { status: "published", page } : { status: "missing" };
  } catch {
    return { status: "unavailable" };
  }
}
