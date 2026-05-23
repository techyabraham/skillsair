export type OrderStatus =
  | "pending"
  | "processing"
  | "on-hold"
  | "completed"
  | "cancelled"
  | "refunded"
  | "failed";

export interface OrderLineItem {
  id: number;
  productId: number;
  name: string;
  quantity: number;
  subtotal: string;
  total: string;
  price: number;
  image?: string;
  slug?: string;
}

export interface OrderBillingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

export interface Order {
  id: number;
  orderKey: string;
  status: OrderStatus;
  currency: string;
  dateCreated: string;
  dateCompleted?: string;
  total: string;
  subtotal: string;
  totalTax: string;
  discountTotal: string;
  lineItems: OrderLineItem[];
  billing: OrderBillingAddress;
  paymentMethod: string;
  paymentMethodTitle: string;
  transactionId?: string;
  customerId: number;
  couponLines: CouponLine[];
}

export interface CouponLine {
  id: number;
  code: string;
  discount: string;
}

export interface CheckoutData {
  billing: OrderBillingAddress;
  paymentMethod: string;
  couponCode?: string;
  lineItems: {
    productId: number;
    quantity: number;
  }[];
}

export interface Subscription {
  id: number;
  status: "active" | "cancelled" | "expired" | "pending" | "on-hold";
  planName: string;
  planId: number;
  startDate: string;
  nextPaymentDate: string;
  endDate?: string;
  total: string;
  billingPeriod: "month" | "year";
  billingInterval: number;
  paymentMethod: string;
  paymentMethodTitle: string;
}

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  slug?: string;
}

export interface WooProduct {
  id: number;
  name: string;
  slug: string;
  type: string;
  status: string;
  price: string;
  regularPrice: string;
  salePrice?: string;
  description: string;
  shortDescription: string;
  images: { src: string; alt: string }[];
  categories: { id: number; name: string; slug: string }[];
}
