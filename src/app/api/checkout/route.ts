import { NextRequest, NextResponse } from "next/server";
import {
  normalizeCourseSlug,
  wcHeaders,
  wcUrl,
  type WcProduct,
} from "@/lib/server-course-catalog";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const PAYSTACK_CHANNELS = {
  bank_transfer: ["bank_transfer"],
  paystack: ["card", "bank", "ussd", "qr", "mobile_money", "eft", "payattitude"],
} as const;

type PaymentMethod = keyof typeof PAYSTACK_CHANNELS;

function isPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === "string" && value in PAYSTACK_CHANNELS;
}

function toKobo(amount: string | number): number {
  return Math.round(Number(amount) * 100);
}

async function getHoneypotFields(): Promise<Record<string, string>> {
  try {
    const res = await fetch("https://api.skillsair.com/wp-login.php?action=register", {
      headers: {
        Accept: "text/html",
        "User-Agent": "SkillsAir-NextJS/1.0",
      },
      cache: "no-store",
    });
    const html = await res.text();
    const match = html.match(/wpa_field_info\s*=\s*(\{[^\n<]+\})/);
    if (!match) return {};
    const info = JSON.parse(match[1]) as {
      wpa_field_name?: unknown;
      wpa_field_value?: unknown;
    };
    if (typeof info.wpa_field_name !== "string" || !info.wpa_field_name) return {};
    return {
      wpa_initiator: "",
      alt_s: "",
      [info.wpa_field_name]: String(info.wpa_field_value ?? ""),
    };
  } catch {
    return {};
  }
}

async function fetchProductBySlug(slug: string): Promise<WcProduct | null> {
  const res = await fetch(wcUrl("/products", {
    slug: normalizeCourseSlug(slug),
    type: "subscription",
    status: "publish",
  }), {
    headers: wcHeaders(),
  });
  if (!res.ok) return null;
  const products = (await res.json()) as WcProduct[];
  return Array.isArray(products) ? products[0] || null : null;
}

async function fetchProductById(productId: unknown): Promise<WcProduct | null> {
  const id = Number(productId);
  if (!Number.isFinite(id) || id <= 0) return null;
  const res = await fetch(wcUrl(`/products/${id}`), {
    headers: wcHeaders(),
  });
  if (!res.ok) return null;
  return (await res.json()) as WcProduct;
}

async function resolveCheckoutProduct(productId: unknown, courseSlug: unknown): Promise<WcProduct | null> {
  if (typeof courseSlug === "string" && courseSlug.trim()) {
    const bySlug = await fetchProductBySlug(courseSlug.trim());
    if (bySlug) return bySlug;
  }
  return fetchProductById(productId);
}

async function findCustomerId(email: string): Promise<number> {
  const customerRes = await fetch(wcUrl(`/customers?email=${encodeURIComponent(email)}`), {
    headers: wcHeaders(),
    cache: "no-store",
  });
  const customers = await customerRes.json().catch(() => []);
  return Array.isArray(customers) && customers.length > 0 && typeof customers[0].id === "number"
    ? customers[0].id
    : 0;
}

async function createCustomer(billing: Record<string, string>): Promise<number> {
  const email = billing.email;
  const username = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "") + Math.floor(Math.random() * 1000);
  const password = `SA${Math.random().toString(36).slice(2, 10)}!`;
  const form = new URLSearchParams({
    email,
    username,
    password,
    first_name: billing.firstName || "",
    last_name: billing.lastName || "",
    ...(await getHoneypotFields()),
  });
  form.set("billing[first_name]", billing.firstName || "");
  form.set("billing[last_name]", billing.lastName || "");
  form.set("billing[email]", email);
  form.set("billing[phone]", billing.phone || "");

  const res = await fetch(wcUrl("/customers"), {
    method: "POST",
    headers: {
      ...wcHeaders(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
  });
  const customer = await res.json().catch(() => ({}));
  if (!res.ok || typeof customer.id !== "number") return 0;
  return customer.id;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { billing, productId, courseSlug, paymentMethod, paymentMethodTitle } = body;

  if (!billing?.email || (!productId && !courseSlug)) {
    return NextResponse.json({ message: "Missing billing email or product" }, { status: 400 });
  }

  if (!PAYSTACK_SECRET_KEY) {
    return NextResponse.json(
      { message: "Paystack is not configured. Add PAYSTACK_SECRET_KEY to the server environment." },
      { status: 500 }
    );
  }

  const selectedPaymentMethod: PaymentMethod = isPaymentMethod(paymentMethod)
    ? paymentMethod
    : "paystack";
  const selectedPaymentTitle =
    typeof paymentMethodTitle === "string" && paymentMethodTitle.length > 0
      ? paymentMethodTitle
      : selectedPaymentMethod === "bank_transfer"
      ? "Paystack Bank Transfer"
      : "Paystack";
  const product = await resolveCheckoutProduct(productId, courseSlug);
  if (!product) {
    return NextResponse.json({ message: "Selected course product was not found" }, { status: 404 });
  }
  if (product.purchasable === false || product.status === "trash") {
    return NextResponse.json({ message: "Selected course product is not available for purchase" }, { status: 400 });
  }

  let customerId = await findCustomerId(billing.email);
  let newAccount = false;
  if (customerId === 0) {
    customerId = await createCustomer(billing);
    newAccount = customerId > 0;
  }

  // Create the WooCommerce order
  const orderRes = await fetch(wcUrl("/orders"), {
    method: "POST",
    headers: wcHeaders(true),
    body: JSON.stringify({
      payment_method: selectedPaymentMethod,
      payment_method_title: selectedPaymentTitle,
      set_paid: false,
      customer_id: customerId || 0,
      billing: {
        first_name: billing.firstName,
        last_name: billing.lastName,
        email: billing.email,
        phone: billing.phone || "",
        address_1: billing.address1 || "",
        city: billing.city || "",
        state: billing.state || "",
        postcode: billing.postcode || "",
        country: billing.country || "NG",
      },
      line_items: [{ product_id: product.id, quantity: 1 }],
    }),
  });

  const order = await orderRes.json();

  if (!orderRes.ok) {
    return NextResponse.json({ message: order.message || "Order creation failed" }, { status: orderRes.status });
  }

  const amount = toKobo(order.total);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ message: "Invalid order total" }, { status: 400 });
  }

  const reference = `SA-${order.id}-${Date.now()}`;
  const callbackUrl = new URL(`/order-confirmation/${order.id}`, SITE_URL);
  callbackUrl.searchParams.set("reference", reference);

  const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: billing.email,
      amount,
      currency: order.currency || "NGN",
      reference,
      callback_url: callbackUrl.toString(),
      channels: PAYSTACK_CHANNELS[selectedPaymentMethod],
      metadata: {
        order_id: order.id,
        customer_id: customerId,
        product_id: product.id,
        course_slug: product.slug,
        payment_method: selectedPaymentMethod,
        custom_fields: [
          {
            display_name: "Order ID",
            variable_name: "order_id",
            value: String(order.id),
          },
        ],
      },
    }),
  });
  const paystack = await paystackRes.json();

  if (!paystackRes.ok || !paystack.status || !paystack.data?.authorization_url) {
    return NextResponse.json(
      { message: paystack.message || "Could not initialize Paystack payment" },
      { status: paystackRes.status || 502 }
    );
  }

  await fetch(wcUrl(`/orders/${order.id}`), {
    method: "PUT",
    headers: wcHeaders(true),
    body: JSON.stringify({
      transaction_id: reference,
      meta_data: [
        { key: "_paystack_reference", value: reference },
        { key: "_skillsair_payment_method", value: selectedPaymentMethod },
      ],
    }),
  });

  return NextResponse.json({
    orderId: order.id,
    authorizationUrl: paystack.data.authorization_url,
    reference,
    accessCode: paystack.data.access_code,
    newAccount,
  });
}
