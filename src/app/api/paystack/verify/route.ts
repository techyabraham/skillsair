import { NextRequest, NextResponse } from "next/server";
import {
  fetchTutorCourses,
  findTutorCourseForProduct,
  tutorCourseId,
  tutorHeaders,
  tutorUrl,
  wcHeaders,
  wcUrl,
  type WcProduct,
} from "@/lib/server-course-catalog";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";

interface WcOrder {
  id: number;
  customer_id: number;
  billing?: { email?: string };
  line_items?: Array<{ product_id: number }>;
  payment_method?: string;
  payment_method_title?: string;
  meta_data?: Array<{ key: string; value: unknown }>;
}

function orderMeta(order: WcOrder, key: string): string {
  const value = order.meta_data?.find((meta) => meta.key === key)?.value;
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function isCertificateOrder(order: WcOrder): boolean {
  return orderMeta(order, "_skillsair_order_type") === "certificate" ||
    Boolean(orderMeta(order, "_skillsair_certificate_course_slug"));
}

async function findCustomerId(email: string): Promise<number> {
  if (!email) return 0;
  const res = await fetch(wcUrl(`/customers?email=${encodeURIComponent(email)}`), {
    headers: wcHeaders(),
    cache: "no-store",
  });
  const customers = await res.json().catch(() => []);
  return Array.isArray(customers) && typeof customers[0]?.id === "number" ? customers[0].id : 0;
}

async function enrollPaidCourse(order: WcOrder): Promise<{ enrolled: boolean; courseId?: number; message?: string }> {
  const userId = order.customer_id || await findCustomerId(order.billing?.email || "");
  const productId = order.line_items?.[0]?.product_id || 0;
  if (!userId || !productId) {
    return { enrolled: false, message: "Missing customer or product for Tutor enrollment." };
  }

  const productRes = await fetch(wcUrl(`/products/${productId}`), {
    headers: wcHeaders(),
    cache: "no-store",
  });
  if (!productRes.ok) return { enrolled: false, message: "Could not load paid product for Tutor enrollment." };

  const product = (await productRes.json()) as WcProduct;
  const tutorCourse = findTutorCourseForProduct(product, await fetchTutorCourses());
  const courseId = tutorCourseId(tutorCourse);
  if (!courseId) return { enrolled: false, message: "Could not match paid product to a Tutor course." };

  const enrollRes = await fetch(tutorUrl("/enrollments"), {
    method: "POST",
    headers: tutorHeaders(true),
    body: JSON.stringify({
      user_id: userId,
      course_id: courseId,
    }),
  });
  const enrollment = await enrollRes.json().catch(() => ({}));
  if (!enrollRes.ok && !String(enrollment.message || "").toLowerCase().includes("already")) {
    return {
      enrolled: false,
      courseId,
      message: typeof enrollment.message === "string" ? enrollment.message : "Tutor enrollment failed.",
    };
  }

  return { enrolled: true, courseId };
}

async function ensureMonthlySubscription(order: WcOrder): Promise<{ active: boolean; subscriptionId?: number; message?: string }> {
  const userId = order.customer_id || await findCustomerId(order.billing?.email || "");
  const productId = order.line_items?.[0]?.product_id || 0;
  if (!userId || !productId) {
    return { active: false, message: "Missing customer or product for subscription." };
  }

  const existingRes = await fetch(wcUrl("/subscriptions", { customer: String(userId), per_page: "100" }), {
    headers: wcHeaders(),
    cache: "no-store",
  });
  const existing = await existingRes.json().catch(() => []);
  const match = Array.isArray(existing)
    ? existing.find((subscription) =>
        Array.isArray(subscription.line_items) &&
        subscription.line_items.some((item: { product_id?: number }) => item.product_id === productId) &&
        ["active", "pending-cancel"].includes(String(subscription.status))
      )
    : null;

  if (match?.id) return { active: true, subscriptionId: match.id };

  const now = new Date();
  const nextPayment = new Date(now);
  nextPayment.setMonth(nextPayment.getMonth() + 1);

  const createRes = await fetch(wcUrl("/subscriptions"), {
    method: "POST",
    headers: wcHeaders(true),
    body: JSON.stringify({
      customer_id: userId,
      status: "active",
      billing_period: "month",
      billing_interval: 1,
      start_date: now.toISOString(),
      next_payment_date: nextPayment.toISOString(),
      payment_method: order.payment_method || "paystack",
      payment_method_title: order.payment_method_title || "Paystack",
      billing: order.billing || {},
      line_items: [{ product_id: productId, quantity: 1 }],
      parent_id: order.id,
      meta_data: [
        { key: "_skillsair_source_order_id", value: String(order.id) },
        { key: "_skillsair_access_months", value: "1" },
      ],
    }),
  });
  const subscription = await createRes.json().catch(() => ({}));
  if (!createRes.ok || typeof subscription.id !== "number") {
    return {
      active: false,
      message: typeof subscription.message === "string" ? subscription.message : "Subscription creation failed.",
    };
  }

  return { active: true, subscriptionId: subscription.id };
}

export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get("reference");
  const orderId = req.nextUrl.searchParams.get("orderId");

  if (!reference || !orderId) {
    return NextResponse.json({ message: "Missing payment reference or order ID" }, { status: 400 });
  }

  if (!PAYSTACK_SECRET_KEY) {
    return NextResponse.json(
      { message: "Paystack is not configured. Add PAYSTACK_SECRET_KEY to the server environment." },
      { status: 500 }
    );
  }

  const verifyRes = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
      cache: "no-store",
    }
  );
  const verification = await verifyRes.json();

  if (!verifyRes.ok || !verification.status) {
    return NextResponse.json(
      { message: verification.message || "Could not verify Paystack payment" },
      { status: verifyRes.status || 502 }
    );
  }

  const paid = verification.data?.status === "success";
  if (!paid) {
    return NextResponse.json({
      paid: false,
      status: verification.data?.status || "pending",
      message: "Payment has not been completed yet.",
    });
  }

  const updateRes = await fetch(wcUrl(`/orders/${orderId}`), {
    method: "PUT",
    headers: wcHeaders(true),
    body: JSON.stringify({
      set_paid: true,
      status: "completed",
      transaction_id: reference,
      meta_data: [
        { key: "_paystack_reference", value: reference },
        { key: "_paystack_channel", value: verification.data?.channel || "" },
        { key: "_paystack_paid_at", value: verification.data?.paid_at || "" },
      ],
    }),
  });
  const order = (await updateRes.json()) as WcOrder & { message?: string };

  if (!updateRes.ok) {
    return NextResponse.json(
      { message: order.message || "Payment verified, but the order could not be updated" },
      { status: updateRes.status }
    );
  }

  const certificateOrder = isCertificateOrder(order);

  return NextResponse.json({
    paid: true,
    status: verification.data.status,
    orderId: order.id,
    reference,
    subscription: certificateOrder
      ? { active: false, message: "Certificate order does not require a subscription." }
      : await ensureMonthlySubscription(order),
    enrollment: certificateOrder
      ? { enrolled: false, message: "Certificate order does not require course enrollment." }
      : await enrollPaidCourse(order),
    certificate: certificateOrder
      ? { purchased: true, courseSlug: orderMeta(order, "_skillsair_certificate_course_slug") }
      : undefined,
  });
}
