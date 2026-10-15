import { NextResponse } from "next/server";
import { getPublishedPage } from "@/lib/cms-pages";

/** Published legal/content pages from the backend `pages` collection (admin-editable). */
export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const result = await getPublishedPage(params.slug);
  if (result.status === "published") return NextResponse.json(result.page);
  if (result.status === "missing") return NextResponse.json({ message: "This page is being updated." }, { status: 404 });
  return NextResponse.json({ message: "Pages are temporarily unavailable." }, { status: 502 });
}
