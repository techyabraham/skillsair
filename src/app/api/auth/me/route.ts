import { NextRequest, NextResponse } from "next/server";
import { backendFetch, backendPayload, backendToken } from "@/lib/backend-api";

interface BackendUser {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  avatar?: { url?: string } | number | null;
}

export async function GET(req: NextRequest) {
  if (!backendToken(req)) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  const userId = req.cookies.get("sa_user_id")?.value;
  if (!userId || !/^\d+$/.test(userId)) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  const upstream = await backendFetch(req, `users/${userId}?depth=1`);
  if (!upstream.ok) return NextResponse.json({ message: "Not authenticated" }, { status: upstream.status });
  const user = await backendPayload<BackendUser>(upstream);
  return NextResponse.json({
    user: {
      databaseId: user.id,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
      email: user.email,
      avatar: { url: user.avatar && typeof user.avatar === "object" ? user.avatar.url || "" : "" },
      roles: { nodes: [{ name: user.role || "student" }] },
    },
  });
}
