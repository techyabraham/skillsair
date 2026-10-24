import { NextRequest, NextResponse } from "next/server";
import { backendFetch, backendToken } from "@/lib/backend-api";

/** Certificates the learner has paid for whose final exam is still to pass (the dashboard card). */
export async function GET(req: NextRequest) {
  if (!backendToken(req)) return NextResponse.json({ exams: [] });
  const query = new URLSearchParams({ "where[status][equals]": "awaiting_exam", depth: "1", limit: "20" });
  const upstream = await backendFetch(req, `certificate-entitlements?${query}`).catch(() => null);
  if (!upstream?.ok) return NextResponse.json({ exams: [] });
  const body = (await upstream.json().catch(() => null)) as { docs?: Array<{ id: number; paidAt?: string; course?: { title?: string; slug?: string } | number }> } | null;
  const exams = (body?.docs ?? [])
    .map((doc) => (typeof doc.course === "object" && doc.course?.slug ? { id: doc.id, title: doc.course.title ?? "", slug: doc.course.slug, paidAt: doc.paidAt ?? null } : null))
    .filter(Boolean);
  return NextResponse.json({ exams });
}
