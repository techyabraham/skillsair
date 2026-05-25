import { NextRequest, NextResponse } from "next/server";

const WP_API = process.env.NEXT_PUBLIC_WP_API || "https://api.skillsair.com/wp-json";

export async function POST(req: NextRequest) {
  const authorization = req.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ message: "You must be signed in to upload an avatar" }, { status: 401 });
  }

  const formData = await req.formData();
  const res = await fetch(`${WP_API}/wp/v2/media`, {
    method: "POST",
    headers: { Authorization: authorization },
    body: formData,
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return NextResponse.json(
      { message: data.message || "Avatar upload failed" },
      { status: res.status }
    );
  }

  return NextResponse.json({
    id: data.id,
    url: data.source_url || data.guid?.rendered || "",
  });
}
