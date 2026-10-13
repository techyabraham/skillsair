import { NextRequest, NextResponse } from "next/server";
import { backendFetch, backendToken } from "@/lib/backend-api";

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get("sa_backend_refresh")?.value;
  if (backendToken(req)) {
    await backendFetch(req, "auth/logout", {
      method: "POST",
      body: JSON.stringify({ ...(refreshToken ? { refreshToken } : {}) }),
    }).catch(() => undefined);
  }
  const response = NextResponse.json({ success: true });
  response.cookies.delete("sa_backend_access");
  response.cookies.delete("sa_backend_refresh");
  response.cookies.delete("sa_user_id");
  response.cookies.delete("sa_persistent");
  return response;
}
