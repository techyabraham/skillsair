import { NextRequest, NextResponse } from "next/server";

const WP_API = process.env.NEXT_PUBLIC_WP_API || "https://api.skillsair.com/wp-json";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ message: "Enter a valid email address" }, { status: 400 });
  }

  const res = await fetch(`${WP_API}/wp/v2/newsletter`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return NextResponse.json(
      { message: data.message || "Newsletter signup is not available right now" },
      { status: res.status }
    );
  }

  return NextResponse.json({ success: true });
}
