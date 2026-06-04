import { NextRequest, NextResponse } from "next/server";
import { wcHeaders, wcUrl } from "@/lib/server-course-catalog";
import type { Subscription } from "@/types/order";

interface WooSub {
  id: number;
  status: string;
  billing_period: string;
  billing_interval: number;
  start_date: string;
  next_payment_date: string;
  end_date?: string;
  total: string;
  payment_method: string;
  payment_method_title: string;
  line_items?: Array<{ name: string; product_id: number }>;
}

export async function GET(req: NextRequest) {
  const customerId = req.nextUrl.searchParams.get("customer");
  if (!customerId || !Number.isFinite(Number(customerId))) {
    return NextResponse.json({ message: "Valid customer ID required" }, { status: 400 });
  }

  try {
    const res = await fetch(
      wcUrl("/subscriptions", { customer: customerId, per_page: "100" }),
      { headers: wcHeaders(), cache: "no-store" }
    );
    if (!res.ok) return NextResponse.json([]);
    const raw = await res.json().catch(() => []);
    if (!Array.isArray(raw)) return NextResponse.json([]);

    const mapped: Subscription[] = raw.map((s: WooSub) => ({
      id: s.id,
      status: s.status as Subscription["status"],
      planName: s.line_items?.[0]?.name || "Subscription",
      planId: s.line_items?.[0]?.product_id || 0,
      startDate: s.start_date,
      nextPaymentDate: s.next_payment_date,
      endDate: s.end_date || undefined,
      total: s.total,
      billingPeriod: (s.billing_period === "year" ? "year" : "month") as "month" | "year",
      billingInterval: s.billing_interval,
      paymentMethod: s.payment_method,
      paymentMethodTitle: s.payment_method_title,
    }));

    return NextResponse.json(mapped);
  } catch {
    return NextResponse.json([]);
  }
}
