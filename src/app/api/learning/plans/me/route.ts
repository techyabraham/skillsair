import { NextRequest } from "next/server";
import { relayLearning } from "@/lib/learning-relay";

/** A summary of every active programme's plan, for the dashboard's This week cards. */
export async function GET(req: NextRequest) {
  return relayLearning(req, "plans/me");
}
