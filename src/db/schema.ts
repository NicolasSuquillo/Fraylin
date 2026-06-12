import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  serial,
  uuid,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  slug: text("slug").primaryKey(),
  label: text("label").notNull(),
  icon: text("icon").notNull(),
  description: text("description"),
  position: integer("position").notNull().default(0),
});

export const products = pgTable(
  "products",
  {
    id: text("id").primaryKey(),
    categorySlug: text("category_slug")
      .notNull()
      .references(() => categories.slug, { onUpdate: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    priceCents: integer("price_cents"),
    stock: integer("stock"),
    featured: boolean("featured").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("products_category_idx").on(t.categorySlug),
    index("products_featured_idx").on(t.featured),
  ]
);

export const productImages = pgTable(
  "product_images",
  {
    id: serial("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade", onUpdate: "cascade" }),
    src: text("src").notNull(),
    alt: text("alt").notNull(),
    position: integer("position").notNull().default(0),
  },
  (t) => [index("product_images_product_idx").on(t.productId)]
);

export const galleryItems = pgTable("gallery_items", {
  id: serial("id").primaryKey(),
  src: text("src").notNull(),
  alt: text("alt").notNull(),
  caption: text("caption"),
  position: integer("position").notNull().default(0),
});

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "processing",
  "paid",
  "failed",
  "cancelled",
]);

export const paymentMethodEnum = pgEnum("payment_method", ["payphone", "transferencia"]);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientTransactionId: text("client_transaction_id").notNull(),
    status: orderStatusEnum("status").notNull().default("pending"),
    paymentMethod: paymentMethodEnum("payment_method").notNull().default("payphone"),
    fulfillmentStatus: text("fulfillment_status").notNull().default("nuevo"),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone").notNull(),
    customerEmail: text("customer_email").notNull(),
    customerAddress: text("customer_address").notNull(),
    subtotalCents: integer("subtotal_cents").notNull(),
    taxCents: integer("tax_cents").notNull(),
    totalCents: integer("total_cents").notNull(),
    payphoneTransactionId: text("payphone_transaction_id"),
    payphoneStatusCode: integer("payphone_status_code"),
    payphoneRaw: jsonb("payphone_raw"),
    confirmedAt: timestamp("confirmed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("orders_client_tx_idx").on(t.clientTransactionId),
    index("orders_status_idx").on(t.status),
    index("orders_created_idx").on(t.createdAt),
  ]
);

export const orderItems = pgTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: text("product_id"),
    productName: text("product_name").notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
    quantity: integer("quantity").notNull(),
    lineTotalCents: integer("line_total_cents").notNull(),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)]
);

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categorySlug],
    references: [categories.slug],
  }),
  images: many(productImages),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
}));
