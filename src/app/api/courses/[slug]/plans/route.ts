import { NextRequest, NextResponse } from "next/server";
import { backendFetch, backendPayload } from "@/lib/backend-api";

interface CourseRecord {
  id: number;
}

interface PlanRecord {
  id: number;
  name?: string;
  price?: number;
  paystackPlanCode?: string;
  interval?: "monthly" | "annually";
  kind?: "scholarship" | "standard" | null;
}

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const courseQuery = new URLSearchParams({
    limit: "1",
    depth: "0",
    "where[slug][equals]": params.slug,
    "where[status][equals]": "published",
  });
  const courseResponse = await backendFetch(req, `courses?${courseQuery}`);
  if (!courseResponse.ok) {
    return NextResponse.json({ message: "Unable to load course payment options." }, { status: courseResponse.status });
  }
  const coursePayload = await backendPayload<{ docs?: CourseRecord[] }>(courseResponse);
  const course = coursePayload.docs?.[0];
  if (!course) return NextResponse.json({ message: "Course not found." }, { status: 404 });

  const planQuery = new URLSearchParams({
    limit: "10",
    depth: "0",
    "where[course][equals]": String(course.id),
    "where[isActive][equals]": "true",
  });
  const plansResponse = await backendFetch(req, `plans?${planQuery}`);
  if (!plansResponse.ok) {
    return NextResponse.json({ message: "Unable to load course subscription plans." }, { status: plansResponse.status });
  }
  const plansPayload = await backendPayload<{ docs?: PlanRecord[] }>(plansResponse);
  const plans = (plansPayload.docs || [])
    .filter((plan) =>
      (plan.interval === "monthly" || plan.interval === "annually") &&
      Number(plan.price) > 0 &&
      Boolean(plan.paystackPlanCode) &&
      // The ₦2,000/month scholarship plan is only revealed in the personal offer.
      plan.kind !== "scholarship"
    )
    .map((plan) => ({
      id: plan.id,
      name: plan.name || (plan.interval === "monthly" ? "Monthly" : "Annual"),
      price: Number(plan.price || 0),
      interval: plan.interval as "monthly" | "annually",
    }));

  return NextResponse.json({ plans });
}
