import { NextRequest, NextResponse } from "next/server";
import type { Order, OrderLineItem, OrderStatus } from "@/types/order";

const WC_API = `${(process.env.NEXT_PUBLIC_WP_API || "https://api.skillsair.com/wp-json").replace(/\/$/, "")}/wc/v3`;
const WC_KEY = process.env.WC_CONSUMER_KEY!;
const WC_SECRET = process.env.WC_CONSUMER_SECRET!;

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
  line_items: Array<{
    id: number;
    product_id: number;
    name: string;
    quantity: number;
    subtotal: string;
    total: string;
    price: number;
    image?: { src?: string };
    slug?: string;
  }>;
  coupon_lines: Array<{ id: number; code: string; discount: string }>;
}

function wcUrl(path: string): string {
  const url = new URL(`${WC_API}${path}`);
  url.searchParams.set("consumer_key", WC_KEY);
  url.searchParams.set("consumer_secret", WC_SECRET);
  return url.toString();
}

function mapOrder(order: WooOrder): Order {
  const lineItems: OrderLineItem[] = order.line_items.map((item) => ({
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
    id: order.id,
    orderKey: order.order_key,
    status: order.status,
    currency: order.currency,
    dateCreated: order.date_created,
    dateCompleted: order.date_completed || undefined,
    total: order.total,
    subtotal: lineItems
      .reduce((sum, item) => sum + Number(item.subtotal || 0), 0)
      .toFixed(2),
    totalTax: order.total_tax,
    discountTotal: order.discount_total,
    lineItems,
    billing: {
      firstName: order.billing.first_name,
      lastName: order.billing.last_name,
      email: order.billing.email,
      phone: order.billing.phone,
      address1: order.billing.address_1,
      address2: order.billing.address_2,
      city: order.billing.city,
      state: order.billing.state,
      postcode: order.billing.postcode,
      country: order.billing.country,
    },
    paymentMethod: order.payment_method,
    paymentMethodTitle: order.payment_method_title,
    transactionId: order.transaction_id,
    customerId: order.customer_id,
    couponLines: order.coupon_lines,
  };
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const res = await fetch(wcUrl(`/orders/${params.id}`), { cache: "no-store" });
  const order = await res.json();

  if (!res.ok) {
    return NextResponse.json({ message: order.message || "Order not found" }, { status: res.status });
  }

  return NextResponse.json(mapOrder(order));
}
