import { NextRequest, NextResponse } from "next/server";
import { wcHeaders, wcUrl } from "@/lib/server-course-catalog";
import type { Order, OrderLineItem, OrderStatus } from "@/types/order";

interface WooLineItem {
  id: number;
  product_id: number;
  name: string;
  quantity: number;
  subtotal: string;
  total: string;
  price: number;
  image?: { src?: string };
  slug?: string;
}

interface WooOrder {
  id: number;
  order_key: string;
  status: OrderStatus;
  currency: string;
  date_created: string;
  date_completed?: string | null;
  total: string;
  total_tax: string;
  discount_total: string;
  payment_method: string;
  payment_method_title: string;
  transaction_id?: string;
  customer_id: number;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address_1: string;
    address_2?: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  line_items: WooLineItem[];
  coupon_lines: Array<{ id: number; code: string; discount: string }>;
}

function mapOrder(o: WooOrder): Order {
  const lineItems: OrderLineItem[] = o.line_items.map((item) => ({
    id: item.id,
    productId: item.product_id,
    name: item.name,
    quantity: item.quantity,
    subtotal: item.subtotal,
    total: item.total,
    price: item.price,
    image: item.image?.src,
    slug: item.slug,
  }));
  return {
    id: o.id,
    orderKey: o.order_key,
    status: o.status,
    currency: o.currency,
    dateCreated: o.date_created,
    dateCompleted: o.date_completed || undefined,
    total: o.total,
    subtotal: lineItems.reduce((s, i) => s + Number(i.subtotal || 0), 0).toFixed(2),
    totalTax: o.total_tax,
    discountTotal: o.discount_total,
    lineItems,
    billing: {
      firstName: o.billing.first_name,
      lastName: o.billing.last_name,
      email: o.billing.email,
      phone: o.billing.phone,
      address1: o.billing.address_1,
      address2: o.billing.address_2,
      city: o.billing.city,
      state: o.billing.state,
      postcode: o.billing.postcode,
      country: o.billing.country,
    },
    paymentMethod: o.payment_method,
    paymentMethodTitle: o.payment_method_title,
    transactionId: o.transaction_id,
    customerId: o.customer_id,
    couponLines: o.coupon_lines,
  };
}

export async function GET(req: NextRequest) {
  const customerId = req.nextUrl.searchParams.get("customer");
  if (!customerId || !Number.isFinite(Number(customerId))) {
    return NextResponse.json({ message: "Valid customer ID required" }, { status: 400 });
  }

  try {
    const res = await fetch(
      wcUrl("/orders", { customer: customerId, per_page: "100" }),
      { headers: wcHeaders(), cache: "no-store" }
    );
    if (!res.ok) return NextResponse.json([]);
    const raw = await res.json().catch(() => []);
    if (!Array.isArray(raw)) return NextResponse.json([]);
    return NextResponse.json(raw.map(mapOrder));
  } catch {
    return NextResponse.json([]);
  }
}
