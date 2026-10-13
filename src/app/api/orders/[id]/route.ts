import { NextRequest, NextResponse } from "next/server";
import { backendFetch, backendPayload } from "@/lib/backend-api";
import type { Order } from "@/types/order";

interface BackendOrder {
  id: number; reference?: string; status?: string; currency?: string; amount?: number; type?: string;
  createdAt?: string; paidAt?: string; paystackTransactionId?: string;
  user?: { id?: number; email?: string; firstName?: string; lastName?: string } | number;
  course?: { id?: number; title?: string; slug?: string; thumbnail?: { url?: string } } | number;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const response = await backendFetch(req, `orders/${encodeURIComponent(params.id)}?depth=2`);
  if (!response.ok) return NextResponse.json({ message: "Order not found" }, { status: response.status });
  const item = await backendPayload<BackendOrder>(response);
  const user = typeof item.user === "object" && item.user ? item.user : {};
  const course = typeof item.course === "object" && item.course ? item.course : {};
  const total = Number(item.amount || 0).toFixed(2);
  const order: Order = {
    id: item.id, orderKey: item.reference || String(item.id),
    status: item.status === "success" ? "completed" : item.status === "failed" ? "failed" : item.status === "refunded" ? "refunded" : "pending",
    currency: item.currency || "NGN", dateCreated: item.createdAt || "", dateCompleted: item.paidAt,
    total, subtotal: total, totalTax: "0.00", discountTotal: "0.00",
    lineItems: [{ id: item.id, productId: Number(course.id || 0), name: course.title || (item.type === "certificate" ? "Course certificate" : "Course access"), quantity: 1, subtotal: total, total, price: Number(item.amount || 0), image: course.thumbnail?.url, slug: course.slug }],
    billing: { firstName: user.firstName || "", lastName: user.lastName || "", email: user.email || "", phone: "", address1: "", city: "", state: "", postcode: "", country: "NG" },
    paymentMethod: "paystack", paymentMethodTitle: "Paystack", transactionId: item.paystackTransactionId,
    customerId: Number(user.id ?? (typeof item.user === "number" ? item.user : 0)), couponLines: [],
  };
  return NextResponse.json(order);
}
