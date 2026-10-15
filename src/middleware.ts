import { NextResponse, type NextRequest } from "next/server";
import { EXPERIMENT_COOKIE, randomAssignments, serialiseAssignments } from "@/lib/experiments";

/** Assigns a stable A/B variant on the first page view (first-party cookie, 90 days). */
export function middleware(req: NextRequest) {
  if (req.cookies.get(EXPERIMENT_COOKIE)) return NextResponse.next();
  const value = serialiseAssignments(randomAssignments());
  // Make the assignment visible to this same request's server render.
  const headers = new Headers(req.headers);
  const cookie = req.headers.get("cookie");
  headers.set("cookie", `${cookie ? `${cookie}; ` : ""}${EXPERIMENT_COOKIE}=${value}`);
  const response = NextResponse.next({ request: { headers } });
  response.cookies.set(EXPERIMENT_COOKIE, value, { path: "/", maxAge: 90 * 24 * 60 * 60, sameSite: "lax" });
  return response;
}

export const config = {
  matcher: ["/", "/schools/:path*", "/programmes/:path*"],
};
