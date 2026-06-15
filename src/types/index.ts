export interface ProductImage {
  src: string;
  alt: string;
}

export interface Product {
  id: string;
  category: string;
  name: string;
  priceCents?: number | null;
  stock?: number | null;
  description?: string;
  images: ProductImage[];
  featured?: boolean;
}

export interface Category {
  slug: string;
  label: string;
  icon: string;
  description?: string;
}

export interface GalleryItem {
  src: string;
  alt: string;
  caption?: string;
}

export interface Service {
  title: string;
  description: string;
  icon: string;
}

export type OrderStatus = "pending" | "processing" | "paid" | "failed" | "cancelled";

export const PAYMENT_METHODS = ["payphone", "transferencia"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const FULFILLMENT_STATUSES = ["nuevo", "coordinado", "entregado"] as const;
export type FulfillmentStatus = (typeof FULFILLMENT_STATUSES)[number];

export interface OrderItem {
  id: number;
  productId: string | null;
  productName: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
}

export interface Order {
  id: string;
  clientTransactionId: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  fulfillmentStatus: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  subtotalCents: number;
  taxCents: number;
  shippingCents: number;
  installationCents: number;
  shippingZoneLabel: string | null;
  totalCents: number;
  payphoneTransactionId?: string | null;
  payphoneStatusCode?: number | null;
  confirmedAt?: Date | null;
  createdAt: Date;
  items?: OrderItem[];
}

export interface CartItem {
  productId: string;
  name: string;
  priceCents: number;
  image: string;
  quantity: number;
  stock?: number | null;
}

export interface CheckoutCustomer {
  name: string;
  phone: string;
  email: string;
  address: string;
}
