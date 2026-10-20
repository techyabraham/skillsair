import { NextRequest, NextResponse } from "next/server";
import { backendFetch, backendPayload } from "@/lib/backend-api";
import type { Subscription } from "@/types/order";

interface BackendSubscription {
  id: number; status?: string; currentPeriodStart?: string; currentPeriodEnd?: string; lastFailedAt?: string | null; graceEndsAt?: string | null; billing?: string | null;
  user?: number | { id?: number }; plan?: number | { id?: number; name?: string; price?: number; interval?: string };
  course?: number | { id?: number; title?: string };
}
interface PayloadList { docs?: BackendSubscription[] }

export async function GET(req: NextRequest) {
  const customer = req.nextUrl.searchParams.get("customer");
  if (!customer || !/^\d+$/.test(customer)) return NextResponse.json({ message: "Valid customer ID required" }, { status: 400 });
  const query = new URLSearchParams({ depth: "2", limit: "1000", sort: "-currentPeriodStart", "where[user][equals]": customer });
  const response = await backendFetch(req, `subscriptions?${query}`);
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: { message?: string } } | null;
    return NextResponse.json({ message: body?.error?.message || "Unable to load subscriptions." }, { status: response.status });
  }
  const payload = await backendPayload<PayloadList>(response);
  const subscriptions: Subscription[] = (payload.docs || []).map((item) => {
  const plan = typeof item.plan === "object" && item.plan ? item.plan : {};
  const course = typeof item.course === "object" && item.course ? item.course : {};
    const status = item.status === "active" || item.status === "past_due" || item.status === "cancelled" || item.status === "expired" || item.status === "on-hold"
      ? item.status
      : "pending";
    const manual = item.billing === "manual";
    // The backend's default 3-day grace: after a failed card charge, or after a month-by-month plan's paid month.
    const graceEndsAt = item.graceEndsAt
      || (item.lastFailedAt ? new Date(Date.parse(item.lastFailedAt) + 3 * 86_400_000).toISOString() : undefined)
      || (manual && item.currentPeriodEnd ? new Date(Date.parse(item.currentPeriodEnd) + 3 * 86_400_000).toISOString() : undefined);
    return {
      id: item.id,
      status,
      planName: plan.name || course.title || "Course subscription",
      planId: Number(plan.id || item.plan || 0),
      startDate: item.currentPeriodStart || "",
      nextPaymentDate: item.currentPeriodEnd || "",
      endDate: item.currentPeriodEnd,
      total: Number(plan.price || 0).toFixed(2),
      billingPeriod: plan.interval === "annually" ? "year" : "month",
      billingInterval: 1,
      paymentMethod: manual ? "bank_transfer" : "paystack",
      paymentMethodTitle: manual ? "Bank transfer or OPay" : "Paystack",
      billing: manual ? "manual" : "card",
      ...((status === "past_due" || manual) && graceEndsAt ? { graceEndsAt } : {}),
    };
  });
  return NextResponse.json(subscriptions);
}
