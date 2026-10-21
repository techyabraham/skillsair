import { NextRequest, NextResponse } from "next/server";
import { backendFetch, backendPayload } from "@/lib/backend-api";
import type { Order } from "@/types/order";

interface BackendOrder {
  id: number;
  reference?: string;
  status?: string;
  currency?: string;
  amount?: number;
  type?: string;
  createdAt?: string;
  updatedAt?: string;
  paidAt?: string;
  paystackTransactionId?: string;
  user?: { id?: number; email?: string; firstName?: string; lastName?: string } | number;
  course?: { id?: number; title?: string; slug?: string; thumbnail?: { url?: string } } | number;
  metadata?: { replacedBy?: number; paymentMethod?: string } | null;
}

const METHOD_TITLES: Record<string, string> = { bank_transfer: "Bank transfer", opay: "OPay", paystack: "Paystack" };
interface PayloadList { docs?: BackendOrder[] }

function mapOrder(item: BackendOrder): Order {
  const user = typeof item.user === "object" && item.user ? item.user : {};
  const course = typeof item.course === "object" && item.course ? item.course : {};
  const total = Number(item.amount || 0).toFixed(2);
  const replaced = item.status === "failed" && Boolean(item.metadata?.replacedBy);
  const pending = !item.status || item.status === "pending";
  // A pending order is paid by starting checkout again for the same item; the backend closes this one.
  const completeHref = pending && course.slug
    ? `/checkout?${item.type === "certificate" ? "certificate" : "course"}=${encodeURIComponent(course.slug)}&replaces=${item.id}`
    : undefined;
  return {
    id: item.id,
    orderKey: item.reference || String(item.id),
    status: item.status === "success" ? "completed" : replaced ? "cancelled" : item.status === "failed" ? "failed" : item.status === "refunded" ? "refunded" : "pending",
    currency: item.currency || "NGN",
    dateCreated: item.createdAt || "",
    dateCompleted: item.paidAt,
    total,
    subtotal: total,
    totalTax: "0.00",
    discountTotal: "0.00",
    lineItems: [{ id: item.id, productId: Number(course.id || 0), name: course.title || (item.type === "certificate" ? "Course certificate" : "Course access"), quantity: 1, subtotal: total, total, price: Number(item.amount || 0), image: course.thumbnail?.url, slug: course.slug }],
    billing: { firstName: user.firstName || "", lastName: user.lastName || "", email: user.email || "", phone: "", address1: "", city: "", state: "", postcode: "", country: "NG" },
    paymentMethod: item.metadata?.paymentMethod || "paystack",
    paymentMethodTitle: METHOD_TITLES[item.metadata?.paymentMethod || ""] || "Paystack",
    transactionId: item.paystackTransactionId,
    customerId: Number(user.id ?? (typeof item.user === "number" ? item.user : 0)),
    couponLines: [],
    completeHref,
  };
}

export async function GET(req: NextRequest) {
  const customer = req.nextUrl.searchParams.get("customer");
  if (!customer || !/^\d+$/.test(customer)) return NextResponse.json({ message: "Valid customer ID required" }, { status: 400 });
  const query = new URLSearchParams({ depth: "2", limit: "1000", sort: "-createdAt", "where[user][equals]": customer });
  const response = await backendFetch(req, `orders?${query}`);
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: { message?: string } } | null;
    return NextResponse.json({ message: body?.error?.message || "Unable to load orders." }, { status: response.status });
  }
  const payload = await backendPayload<PayloadList>(response);
  return NextResponse.json((payload.docs || []).map(mapOrder));
}
