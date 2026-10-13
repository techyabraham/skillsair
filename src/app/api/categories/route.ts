import { NextRequest, NextResponse } from "next/server";
import { backendFetch, backendPayload } from "@/lib/backend-api";

interface BackendCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  courses?: unknown[];
}

interface PayloadList {
  docs?: BackendCategory[];
}

export async function GET(req: NextRequest) {
  const response = await backendFetch(req, "categories?limit=100&depth=1&sort=name");
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: { message?: string } } | null;
    return NextResponse.json({ message: body?.error?.message || "Categories are temporarily unavailable." }, { status: response.status });
  }
  const payload = await backendPayload<PayloadList>(response);
  const categories = (payload.docs || []).map((item) => ({
    id: item.id,
    name: item.name,
    slug: item.slug,
    count: Array.isArray(item.courses) ? item.courses.length : 0,
    description: item.description || undefined,
  }));
  return NextResponse.json({ categories, total: categories.length });
}
