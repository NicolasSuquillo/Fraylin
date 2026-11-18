import { and, asc, desc, eq, inArray, isNotNull, isNull, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  categories,
  orderEvents,
  orderItems,
  orders,
  productImages,
  products,
  reviews,
} from "@/db/schema";
import { computeTaxBreakdown, MAX_PRICE_CENTS } from "@/lib/money";
import { generateClientTransactionId } from "@/lib/order-ids";
import {
  confirmPayphoneTransaction,
  reversePayphoneTransaction,
  type PayphoneConfirmResponse,
} from "@/lib/payphone";
import { syncOrderToPortal } from "@/lib/portal-sync";
import {
  FULFILLMENT_STATUSES,
  type FulfillmentStatus,
  type Order,
  type OrderEvent,
  type OrderItem,
  type OrderStatus,
  type Review,
} from "@/types";

export { FULFILLMENT_STATUSES };
export type { FulfillmentStatus };

export const FULFILLMENT_LABELS: Record<FulfillmentStatus, string> = {
  nuevo: "Recibido",
  preparando: "En preparación",
  coordinado: "Coordinado / En camino",
  entregado: "Entregado",
};

export class OrderActionError extends Error {
  constructor(
    message: string,
    readonly code: "not_found" | "invalid_state" | "stock_unavailable"
  ) {
    super(message);
    this.name = "OrderActionError";
  }
}

type ProductEnrichment = {
  categoryLabel: string | null;
  description: string | null;
  specs: string | null;
  imageSrc: string | null;
};

async function loadProductLookup(
  items: (typeof orderItems.$inferSelect)[]
): Promise<Map<string, ProductEnrichment>> {
  const needsEnrichment = items.some(
    (i) =>
      i.productId &&
      (!i.productImageSrc || !i.productCategory || !i.productDescription || !i.productSpecs)
  );
  const map = new Map<string, ProductEnrichment>();
  if (!needsEnrichment) return map;

  const productIds = [
    ...new Set(items.map((i) => i.productId).filter((id): id is string => Boolean(id))),
  ];
  if (productIds.length === 0) return map;

  const [prodRows, catRows] = await Promise.all([
    db.query.products.findMany({
      where: inArray(products.id, productIds),
      with: {
        images: { orderBy: [asc(productImages.position), asc(productImages.id)] },
      },
    }),
    db.select().from(categories),
  ]);
  const catBySlug = new Map(catRows.map((c) => [c.slug, c.label]));
  for (const p of prodRows) {
    map.set(p.id, {
      categoryLabel: catBySlug.get(p.categorySlug) ?? p.categorySlug,
      description: p.description,
      specs: p.specs,
      imageSrc: p.images[0]?.src ?? null,
    });
  }
  return map;
}

function mapReviewRow(r: typeof reviews.$inferSelect): Review {
  return {
    id: r.id,
    authorName: r.authorName,
    rating: r.rating,
    body: r.body,
    avatarUrl: r.avatarUrl,
    approved: r.approved,
    orderId: r.orderId,
    clientTransactionId: r.clientTransactionId,
    createdAt: r.createdAt.toISOString(),
  };
}

function mapEventRow(ev: typeof orderEvents.$inferSelect): OrderEvent {
  return {
    id: ev.id,
    orderId: ev.orderId,
    statusFrom: (ev.statusFrom as OrderStatus | null) ?? null,
    statusTo: (ev.statusTo as OrderStatus | null) ?? null,
    fulfillmentFrom: (ev.fulfillmentFrom as FulfillmentStatus | null) ?? null,
    fulfillmentTo: (ev.fulfillmentTo as FulfillmentStatus | null) ?? null,
    title: ev.title,
    description: ev.description,
    actor: ev.actor,
    createdAt: ev.createdAt.toISOString(),
  };
}

function toOrder(
  row: typeof orders.$inferSelect,
  items?: (typeof orderItems.$inferSelect)[],
  events?: (typeof orderEvents.$inferSelect)[],
  reviewRow?: typeof reviews.$inferSelect | null,
  productLookup?: Map<string, ProductEnrichment>
): Order {
  return {
    id: row.id,
    clientTransactionId: row.clientTransactionId,
    status: row.status,
    paymentMethod: row.paymentMethod,
    fulfillmentStatus: row.fulfillmentStatus as FulfillmentStatus,
    trackingNote: row.trackingNote ?? null,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    customerEmail: row.customerEmail,
    customerAddress: row.customerAddress,
    subtotalCents: row.subtotalCents,
    taxCents: row.taxCents,
    shippingCents: row.shippingCents,
    installationCents: row.installationCents,
    shippingZoneLabel: row.shippingZoneLabel,
    totalCents: row.totalCents,
    payphoneTransactionId: row.payphoneTransactionId,
    payphoneStatusCode: row.payphoneStatusCode,
    confirmedAt: row.confirmedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    items: items?.map((item): OrderItem => {
      const live = item.productId ? productLookup?.get(item.productId) : undefined;
      return {
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        unitPriceCents: item.unitPriceCents,
        quantity: item.quantity,
        lineTotalCents: item.lineTotalCents,
        productImageSrc: item.productImageSrc ?? live?.imageSrc ?? null,
        productCategory: item.productCategory ?? live?.categoryLabel ?? null,
        productDescription: item.productDescription ?? live?.description ?? null,
        productSpecs: item.productSpecs ?? live?.specs ?? null,
      };
    }),
    events: events?.map(mapEventRow),
    review: reviewRow ? mapReviewRow(reviewRow) : null,
  };
}

async function loadFullOrder(orderId: string): Promise<Order | null> {
  const row = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: {
      items: { orderBy: (i, { asc }) => [asc(i.id)] },
      events: { orderBy: (ev, { desc }) => [desc(ev.createdAt), desc(ev.id)] },
      reviews: { orderBy: (r, { desc }) => [desc(r.createdAt)], limit: 1 },
    },
  });
  if (!row) return null;
  const lookup = await loadProductLookup(row.items);
  return toOrder(row, row.items, row.events, row.reviews[0] ?? null, lookup);
}

export async function getOrders(): Promise<Order[]> {
  const rows = await db.query.orders.findMany({
    with: { items: true },
    orderBy: desc(orders.createdAt),
  });
  return rows.map((row) => toOrder(row, row.items));
}

export async function getOrderById(id: string): Promise<Order | null> {
  return loadFullOrder(id);
}

export async function getOrderByClientTransactionId(
  clientTransactionId: string
): Promise<Order | null> {
  const normalized = clientTransactionId.trim().toUpperCase();
  const row = await db.query.orders.findFirst({
    where: eq(orders.clientTransactionId, normalized),
    with: {
      items: { orderBy: (i, { asc }) => [asc(i.id)] },
      events: { orderBy: (ev, { desc }) => [desc(ev.createdAt), desc(ev.id)] },
      reviews: { orderBy: (r, { desc }) => [desc(r.createdAt)], limit: 1 },
    },
  });
  if (!row) return null;
  const lookup = await loadProductLookup(row.items);
  return toOrder(row, row.items, row.events, row.reviews[0] ?? null, lookup);
}

export async function updateFulfillmentStatus(
  orderId: string,
  fulfillmentStatus: FulfillmentStatus,
  options?: {
    trackingNote?: string | null;
    eventDescription?: string | null;
    actor?: string;
    skipPortalSync?: boolean;
    expectedFrom?: FulfillmentStatus;
  }
): Promise<Order> {
  if (!FULFILLMENT_STATUSES.includes(fulfillmentStatus)) {
    throw new OrderActionError("Estado de entrega inválido", "invalid_state");
  }

  const current = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!current) {
    throw new OrderActionError("Pedido no encontrado", "not_found");
  }

  const from = current.fulfillmentStatus as FulfillmentStatus;
  if (options?.expectedFrom && from !== options.expectedFrom) {
    throw new OrderActionError("Estado de entrega desactualizado", "invalid_state");
  }

  const nextNote =
    options?.trackingNote !== undefined
      ? options.trackingNote?.trim() || null
      : current.trackingNote ?? null;
  const statusChanged = from !== fulfillmentStatus;
  const noteChanged = nextNote !== (current.trackingNote ?? null);
  const customDesc = options?.eventDescription?.trim() || null;

  if (statusChanged || noteChanged || customDesc) {
    const title = statusChanged
      ? `Estado de entrega: ${FULFILLMENT_LABELS[fulfillmentStatus]}`
      : "Actualización de seguimiento";
    const description =
      customDesc ?? (noteChanged && nextNote ? `Nota para el cliente: ${nextNote}` : null);
    const expectedNote = current.trackingNote ?? null;

    const rows = await db.execute<{ id: string }>(sql`
      WITH upd AS (
        UPDATE orders
        SET fulfillment_status = ${fulfillmentStatus},
            tracking_note = ${nextNote},
            updated_at = now()
        WHERE id = ${orderId}::uuid
          AND fulfillment_status = ${from}
          AND tracking_note IS NOT DISTINCT FROM ${expectedNote}
        RETURNING id
      ),
      ev AS (
        INSERT INTO order_events (
          order_id, status_from, status_to, fulfillment_from, fulfillment_to, title, description, actor
        )
        SELECT
          id,
          ${current.status},
          ${current.status},
          ${from},
          ${fulfillmentStatus},
          ${title},
          ${description},
          ${options?.actor ?? "admin"}
        FROM upd
        RETURNING order_id AS id
      )
      SELECT id FROM ev
    `);

    if (rows.length === 0) {
      throw new OrderActionError("Estado de entrega desactualizado", "invalid_state");
    }

    if (!options?.skipPortalSync) {
      await syncOrderToPortal(orderId);
    }
  }

  const full = await loadFullOrder(orderId);
  if (!full) throw new OrderActionError("Pedido no encontrado", "not_found");
  return full;
}

export interface PublicOrderEvent {
  id: number;
  statusFrom: OrderStatus | null;
  statusTo: OrderStatus | null;
  fulfillmentFrom: FulfillmentStatus | null;
  fulfillmentTo: FulfillmentStatus | null;
  title: string;
  description: string | null;
  createdAt: string;
}

export interface PublicOrderReview {
  id: number;
  authorName: string;
  rating: number;
  body: string;
  avatarUrl?: string | null;
  approved: boolean;
  createdAt: string;
}

export interface PublicOrderTracking {
  clientTransactionId: string;
  status: OrderStatus;
  paymentMethod: Order["paymentMethod"];
  fulfillmentStatus: FulfillmentStatus;
  trackingNote: string | null;
  customerFirstName: string;
  customerPhoneMasked: string;
  customerEmailMasked: string;
  shippingZoneLabel: string | null;
  subtotalCents: number;
  taxCents: number;
  shippingCents: number;
  installationCents: number;
  totalCents: number;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  events: PublicOrderEvent[];
  review: PublicOrderReview | null;
  canSubmitReview: boolean;
}

function maskName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "Cliente Fraylin";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1][0]?.toUpperCase() ?? ""}.`;
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const visible = digits.length >= 6 ? digits.slice(0, 2) : "";
  return visible ? `${visible}•• ••••••` : "•••• ••••";
}

function maskEmail(email: string): string {
  const trimmed = email.trim();
  if (!trimmed) return "No registrado";
  const [user, domain] = trimmed.split("@");
  if (!user || !domain) return "•••@•••";
  const prefix = user.slice(0, Math.min(2, user.length));
  return `${prefix}•••@${domain}`;
}

export async function getPublicOrderTracking(code: string): Promise<PublicOrderTracking | null> {
  const order = await getOrderByClientTransactionId(code);
  if (!order) return null;

  return {
    clientTransactionId: order.clientTransactionId,
    status: order.status,
    paymentMethod: order.paymentMethod,
    fulfillmentStatus: order.fulfillmentStatus,
    trackingNote: order.trackingNote ?? null,
    customerFirstName: maskName(order.customerName),
    customerPhoneMasked: maskPhone(order.customerPhone),
    customerEmailMasked: maskEmail(order.customerEmail),
    shippingZoneLabel: order.shippingZoneLabel,
    subtotalCents: order.subtotalCents,
    taxCents: order.taxCents,
    shippingCents: order.shippingCents,
    installationCents: order.installationCents,
    totalCents: order.totalCents,
    confirmedAt: order.confirmedAt ? new Date(order.confirmedAt).toISOString() : null,
    createdAt: new Date(order.createdAt).toISOString(),
    updatedAt: new Date(order.updatedAt ?? order.createdAt).toISOString(),
    items: order.items ?? [],
    events: (order.events ?? []).map((ev) => ({
      id: ev.id,
      statusFrom: ev.statusFrom,
      statusTo: ev.statusTo,
      fulfillmentFrom: ev.fulfillmentFrom,
      fulfillmentTo: ev.fulfillmentTo,
      title: ev.title,
      description: ev.description,
      createdAt: ev.createdAt,
    })),
    review: order.review
      ? {
          id: order.review.id,
          authorName: order.review.authorName,
          rating: order.review.rating,
          body: order.review.body,
          avatarUrl: order.review.avatarUrl,
          approved: order.review.approved,
          createdAt: order.review.createdAt,
        }
      : null,
    canSubmitReview:
      order.status === "paid" &&
      order.fulfillmentStatus === "entregado" &&
      !order.review,
  };
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function tryDecrementStock(tx: Tx, orderId: string): Promise<boolean> {
  const items = await tx.query.orderItems.findMany({
    where: eq(orderItems.orderId, orderId),
  });
  for (const item of items) {
    if (!item.productId) continue;
    const updated = await tx
      .update(products)
      .set({ stock: sql`${products.stock} - ${item.quantity}` })
      .where(
        sql`${products.id} = ${item.productId}
            AND ${products.stock} IS NOT NULL
            AND ${products.stock} >= ${item.quantity}`
      )
      .returning({ id: products.id });
    if (updated.length === 0) {
      const ctrl = await tx.query.products.findFirst({
        where: eq(products.id, item.productId),
        columns: { stock: true },
      });
      if (ctrl && ctrl.stock !== null) return false;
    }
  }
  return true;
}

async function restoreStock(tx: Tx, orderId: string): Promise<void> {
  const items = await tx.query.orderItems.findMany({
    where: eq(orderItems.orderId, orderId),
  });
  for (const item of items) {
    if (!item.productId) continue;
    await tx
      .update(products)
      .set({ stock: sql`${products.stock} + ${item.quantity}` })
      .where(sql`${products.id} = ${item.productId} AND ${products.stock} IS NOT NULL`);
  }
}

async function failOrderAndReverse(
  orderId: string,
  confirmation: PayphoneConfirmResponse,
  reason: string,
  reverse: boolean
): Promise<Order> {
  const row = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(orders)
      .set({
        status: "failed",
        payphoneTransactionId: String(confirmation.transactionId),
        payphoneStatusCode: confirmation.statusCode,
        payphoneRaw: { ...confirmation, _failureReason: reason },
        confirmedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(sql`${orders.id} = ${orderId} AND ${orders.status} = 'processing'`)
      .returning();

    if (!updated) return null;

    await tx.insert(orderEvents).values({
      orderId,
      statusFrom: "processing",
      statusTo: "failed",
      fulfillmentFrom: updated.fulfillmentStatus,
      fulfillmentTo: updated.fulfillmentStatus,
      title: "Pago no completado",
      description: `No se pudo completar el cobro (${reason}).`,
      actor: "payphone",
    });

    await restoreStock(tx, orderId);
    return updated;
  });

  if (!row) {
    const current = await loadFullOrder(orderId);
    if (!current) throw new Error("Orden no encontrada");
    return current;
  }

  if (reverse) {
    try {
      await reversePayphoneTransaction(confirmation.transactionId);
      console.error(
        `[Payphone] Cargo reversado (${reason}) orden=${orderId} tx=${confirmation.transactionId}`
      );
    } catch (revErr) {
      console.error(
        `[Payphone] ⚠ REVERSO FALLÓ orden=${orderId} tx=${confirmation.transactionId} (${reason}). ` +
          `Revisar y anular manualmente en el panel de Payphone.`,
        revErr
      );
    }
  }

  await syncOrderToPortal(orderId);
  const full = await loadFullOrder(orderId);
  if (!full) throw new Error("Orden no encontrada");
  return full;
}

async function settleConfirmedOrder(
  order: typeof orders.$inferSelect,
  confirmation: PayphoneConfirmResponse
): Promise<Order> {
  const approvedByPayphone = confirmation.statusCode === 3;

  if (!approvedByPayphone) {
    return failOrderAndReverse(order.id, confirmation, "pago no aprobado", false);
  }

  const paidAmount = typeof confirmation.amount === "number" ? confirmation.amount : null;
  const amountMatches = paidAmount !== null && paidAmount === order.totalCents;
  if (!amountMatches) {
    console.error(
      "[Payphone] Monto capturado no coincide con el total de la orden (posible manipulación).",
      { orderId: order.id, esperadoCents: order.totalCents, recibidoCents: paidAmount, raw: confirmation }
    );
    return failOrderAndReverse(order.id, confirmation, "monto no coincide", true);
  }

  const updated = await db.transaction(async (tx) => {
    const [row] = await tx
      .update(orders)
      .set({
        status: "paid",
        payphoneTransactionId: String(confirmation.transactionId),
        payphoneStatusCode: confirmation.statusCode,
        payphoneRaw: confirmation,
        confirmedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(sql`${orders.id} = ${order.id} AND ${orders.status} = 'processing'`)
      .returning();

    if (!row) return null;

    await tx.insert(orderEvents).values({
      orderId: order.id,
      statusFrom: "processing",
      statusTo: "paid",
      fulfillmentFrom: row.fulfillmentStatus,
      fulfillmentTo: row.fulfillmentStatus,
      title: "Pago confirmado",
      description: "Pago en línea confirmado con Payphone. Tu pedido pasa a preparación.",
      actor: "payphone",
    });

    return row;
  });

  if (!updated) {
    const current = await loadFullOrder(order.id);
    if (!current) throw new Error("Orden no encontrada");
    return current;
  }

  await syncOrderToPortal(order.id);
  const full = await loadFullOrder(order.id);
  if (!full) throw new Error("Orden no encontrada");
  return full;
}

export class StockUnavailableError extends Error {
  constructor() {
    super("Stock insuficiente");
    this.name = "StockUnavailableError";
  }
}

export async function reserveOrderStock(tx: Tx, orderId: string): Promise<void> {
  const ok = await tryDecrementStock(tx, orderId);
  if (!ok) throw new StockUnavailableError();
}

export async function finalizeOrder(orderId: string, payphoneId: number): Promise<Order> {
  let claimed: typeof orders.$inferSelect | null = null;
  let stockUnavailable = false;
  try {
    claimed = await db.transaction(async (tx) => {
      const [row] = await tx
        .update(orders)
        .set({
          status: "processing",
          payphoneTransactionId: String(payphoneId),
          updatedAt: new Date(),
        })
        .where(
          sql`${orders.id} = ${orderId} AND ${orders.status} = 'pending' AND ${orders.paymentMethod} = 'payphone'`
        )
        .returning();
      if (!row) return null;
      const ok = await tryDecrementStock(tx, orderId);
      if (!ok) throw new StockUnavailableError();
      return row;
    });
  } catch (e) {
    if (e instanceof StockUnavailableError) {
      stockUnavailable = true;
    } else {
      throw e;
    }
  }

  if (stockUnavailable) {
    console.error(
      `[Payphone] Stock insuficiente para orden=${orderId}; no se confirma (Payphone auto-reversa).`
    );
    const failedRow = await db.transaction(async (tx) => {
      const [row] = await tx
        .update(orders)
        .set({ status: "failed", confirmedAt: new Date(), updatedAt: new Date() })
        .where(
          sql`${orders.id} = ${orderId} AND ${orders.status} = 'pending' AND ${orders.paymentMethod} = 'payphone'`
        )
        .returning();
      if (!row) return null;
      await tx.insert(orderEvents).values({
        orderId,
        statusFrom: "pending",
        statusTo: "failed",
        fulfillmentFrom: row.fulfillmentStatus,
        fulfillmentTo: row.fulfillmentStatus,
        title: "Pedido fallido por falta de stock",
        description: "Uno o más productos agotaron inventario al confirmar el pago.",
        actor: "sistema",
      });
      return row;
    });
    if (failedRow) {
      await syncOrderToPortal(orderId);
    }
    const full = await loadFullOrder(orderId);
    if (!full) throw new Error("Orden no encontrada");
    return full;
  }

  if (!claimed) {
    const existing = await loadFullOrder(orderId);
    if (!existing) throw new Error("Orden no encontrada");
    return existing;
  }

  let confirmation;
  try {
    confirmation = await confirmPayphoneTransaction(payphoneId, claimed.clientTransactionId);
  } catch (error) {
    await db.transaction(async (tx) => {
      const [reverted] = await tx
        .update(orders)
        .set({ status: "pending", payphoneTransactionId: null, updatedAt: new Date() })
        .where(sql`${orders.id} = ${orderId} AND ${orders.status} = 'processing'`)
        .returning();
      if (reverted) await restoreStock(tx, orderId);
    });
    throw error;
  }

  return settleConfirmedOrder(claimed, confirmation);
}

export async function markOrderPaidManually(
  orderId: string,
  options?: { actor?: string; skipPortalSync?: boolean }
): Promise<Order> {
  const claimed = await db.transaction(async (tx) => {
    const [row] = await tx
      .update(orders)
      .set({ status: "paid", confirmedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(orders.id, orderId),
          eq(orders.status, "pending"),
          eq(orders.paymentMethod, "transferencia")
        )
      )
      .returning();

    if (!row) return null;

    await tx.insert(orderEvents).values({
      orderId,
      statusFrom: "pending",
      statusTo: "paid",
      fulfillmentFrom: row.fulfillmentStatus,
      fulfillmentTo: row.fulfillmentStatus,
      title: "Pago por transferencia verificado",
      description: "El pago por transferencia / Deuna fue confirmado por el equipo de Fraylin.",
      actor: options?.actor ?? "admin",
    });
    return row;
  });

  if (claimed) {
    if (!options?.skipPortalSync) {
      await syncOrderToPortal(orderId);
    }
    const full = await loadFullOrder(orderId);
    if (!full) throw new OrderActionError("Pedido no encontrado", "not_found");
    return full;
  }

  const existing = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!existing) {
    throw new OrderActionError("Pedido no encontrado", "not_found");
  }
  if (existing.status === "paid" && existing.paymentMethod === "transferencia") {
    const full = await loadFullOrder(orderId);
    if (!full) throw new OrderActionError("Pedido no encontrado", "not_found");
    return full;
  }
  throw new OrderActionError(
    "Solo se pueden marcar pedidos pendientes de transferencia o Deuna.",
    "invalid_state"
  );
}

export async function cancelStalePendingPayphoneOrders(olderThanMinutes = 30): Promise<number> {
  const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000);
  const stale = await db.query.orders.findMany({
    where: and(
      eq(orders.status, "pending"),
      eq(orders.paymentMethod, "payphone"),
      isNull(orders.payphoneTransactionId),
      lt(orders.createdAt, cutoff)
    ),
    columns: { id: true },
  });

  let cancelled = 0;
  for (const row of stale) {
    const updated = await db.transaction(async (tx) => {
      const [upd] = await tx
        .update(orders)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(
          and(
            eq(orders.id, row.id),
            eq(orders.status, "pending"),
            eq(orders.paymentMethod, "payphone")
          )
        )
        .returning({ id: orders.id, fulfillmentStatus: orders.fulfillmentStatus });
      if (!upd) return null;
      await tx.insert(orderEvents).values({
        orderId: row.id,
        statusFrom: "pending",
        statusTo: "cancelled",
        fulfillmentFrom: upd.fulfillmentStatus,
        fulfillmentTo: upd.fulfillmentStatus,
        title: "Pedido cancelado por tiempo expirado",
        description: "La sesión de pago no se completó dentro del plazo.",
        actor: "sistema",
      });
      return upd;
    });
    if (updated) {
      await syncOrderToPortal(row.id, { skipWebhook: true });
      cancelled++;
    }
  }

  if (cancelled > 0) {
    console.warn(
      `[Reconciliación] ${cancelled} orden(es) Payphone pending vencida(s) marcadas cancelled.`
    );
  }
  return cancelled;
}

export async function cancelStalePendingTransferOrders(olderThanHours = 48): Promise<number> {
  const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
  const stale = await db.query.orders.findMany({
    where: and(
      eq(orders.status, "pending"),
      eq(orders.paymentMethod, "transferencia"),
      lt(orders.createdAt, cutoff)
    ),
    columns: { id: true },
  });

  let cancelled = 0;
  for (const row of stale) {
    const updated = await db.transaction(async (tx) => {
      const [upd] = await tx
        .update(orders)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(
          and(
            eq(orders.id, row.id),
            eq(orders.status, "pending"),
            eq(orders.paymentMethod, "transferencia")
          )
        )
        .returning({ id: orders.id, fulfillmentStatus: orders.fulfillmentStatus });
      if (!upd) return null;
      await restoreStock(tx, row.id);
      await tx.insert(orderEvents).values({
        orderId: row.id,
        statusFrom: "pending",
        statusTo: "cancelled",
        fulfillmentFrom: upd.fulfillmentStatus,
        fulfillmentTo: upd.fulfillmentStatus,
        title: "Pedido cancelado por vencimiento de transferencia",
        description: "No se registró el comprobante dentro de las 48 horas; el stock fue liberado.",
        actor: "sistema",
      });
      return upd;
    });
    if (updated) {
      await syncOrderToPortal(row.id, { skipWebhook: true });
      cancelled++;
    }
  }

  if (cancelled > 0) {
    console.warn(
      `[Reconciliación] ${cancelled} orden(es) transferencia pending vencida(s) canceladas (stock restaurado).`
    );
  }
  return cancelled;
}

export async function cancelTransferOrderManually(
  orderId: string,
  options?: { actor?: string; skipPortalSync?: boolean }
): Promise<Order> {
  const claimed = await db.transaction(async (tx) => {
    const [row] = await tx
      .update(orders)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(
        and(
          eq(orders.id, orderId),
          eq(orders.status, "pending"),
          eq(orders.paymentMethod, "transferencia")
        )
      )
      .returning();

    if (!row) return null;

    await restoreStock(tx, orderId);
    await tx.insert(orderEvents).values({
      orderId,
      statusFrom: "pending",
      statusTo: "cancelled",
      fulfillmentFrom: row.fulfillmentStatus,
      fulfillmentTo: row.fulfillmentStatus,
      title: "Pedido cancelado",
      description: "Pedido por transferencia cancelado y stock restaurado al inventario.",
      actor: options?.actor ?? "admin",
    });
    return row;
  });

  if (claimed) {
    if (!options?.skipPortalSync) {
      await syncOrderToPortal(orderId);
    }
    const full = await loadFullOrder(orderId);
    if (!full) throw new OrderActionError("Pedido no encontrado", "not_found");
    return full;
  }

  const existing = await loadFullOrder(orderId);
  if (!existing) {
    throw new OrderActionError("Pedido no encontrado", "not_found");
  }
  if (existing.status === "cancelled" && existing.paymentMethod === "transferencia") {
    return existing;
  }
  throw new OrderActionError(
    "Solo se pueden cancelar pedidos pendientes de transferencia o Deuna.",
    "invalid_state"
  );
}

export async function reconcileStaleProcessingOrders(
  olderThanMinutes = 15
): Promise<{ settled: number; failed: number; skipped: number }> {
  const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000);
  const stale = await db.query.orders.findMany({
    where: and(
      eq(orders.status, "processing"),
      eq(orders.paymentMethod, "payphone"),
      isNotNull(orders.payphoneTransactionId),
      lt(orders.createdAt, cutoff)
    ),
  });

  let settled = 0;
  let failed = 0;
  let skipped = 0;
  for (const row of stale) {
    const payphoneId = Number(row.payphoneTransactionId);
    if (!Number.isFinite(payphoneId) || payphoneId <= 0) {
      skipped++;
      continue;
    }
    try {
      const confirmation = await confirmPayphoneTransaction(payphoneId, row.clientTransactionId);
      const result = await settleConfirmedOrder(row, confirmation);
      if (result.status === "paid") settled++;
      else failed++;
    } catch (err) {
      console.error(
        `[Reconciliación] No se pudo re-confirmar orden processing=${row.id}; se reintentará.`,
        err
      );
      skipped++;
    }
  }

  if (stale.length > 0) {
    console.warn(
      `[Reconciliación] processing vencidas=${stale.length} (paid=${settled}, failed=${failed}, skip=${skipped}).`
    );
  }
  return { settled, failed, skipped };
}

export async function cancelOrder(orderId: string): Promise<Order> {
  const claimed = await db.transaction(async (tx) => {
    const [row] = await tx
      .update(orders)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(
        sql`${orders.id} = ${orderId} AND ${orders.status} = 'pending' AND ${orders.paymentMethod} = 'payphone'`
      )
      .returning();
    if (row) {
      await tx.insert(orderEvents).values({
        orderId,
        statusFrom: "pending",
        statusTo: "cancelled",
        fulfillmentFrom: row.fulfillmentStatus,
        fulfillmentTo: row.fulfillmentStatus,
        title: "Pago cancelado por el cliente",
        description: "El cliente canceló la transacción en la pasarela de pago.",
        actor: "cliente",
      });
    }
    return row ?? null;
  });

  if (claimed) {
    await syncOrderToPortal(orderId);
  }

  const full = await loadFullOrder(orderId);
  if (!full) throw new Error("Orden no encontrada");
  if (!claimed && !(full.status === "cancelled" && full.paymentMethod === "payphone")) {
    throw new OrderActionError("No se pudo cancelar el pedido", "invalid_state");
  }
  return full;
}

export interface CreateManualOrderItemInput {
  productId: string;
  quantity: number;
  unitPriceCents?: number | null;
}

export interface CreateManualOrderInput {
  customer: {
    name: string;
    phone: string;
    email?: string | null;
    address: string;
  };
  items: CreateManualOrderItemInput[];
  initialStatus?: "paid" | "pending";
  fulfillmentStatus?: FulfillmentStatus;
  shippingCents?: number;
  installationCents?: number;
  shippingZoneLabel?: string | null;
  trackingNote?: string | null;
}

const MANUAL_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MANUAL_MAX_ITEMS = 50;
const MANUAL_MAX_QUANTITY = 99;
const INT32_MAX = 2_147_483_647;

function normalizeManualPhone(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("593")) {
    digits = `0${digits.slice(3)}`;
  }
  if (digits.length === 9 && digits.startsWith("9")) {
    digits = `0${digits}`;
  }
  if (digits.length < 7 || digits.length > 15) {
    return null;
  }
  return digits;
}

/**
 * Registra un pedido manual / venta externa desde Fraylin Admin seleccionando productos
 * del inventario, descuenta stock y lo sincroniza automáticamente con FraylinPortal.
 */
export async function createManualAdminOrder(
  input: CreateManualOrderInput
): Promise<Order> {
  const rawName = input.customer?.name;
  const rawPhone = input.customer?.phone;
  const rawEmail = input.customer?.email;
  const rawAddress = input.customer?.address;

  if (
    typeof rawName !== "string" ||
    typeof rawPhone !== "string" ||
    typeof rawAddress !== "string" ||
    (rawEmail !== undefined && rawEmail !== null && typeof rawEmail !== "string")
  ) {
    throw new OrderActionError("Datos del cliente inválidos.", "invalid_state");
  }

  const customerName = rawName.trim();
  if (customerName.length < 2 || customerName.length > 120) {
    throw new OrderActionError(
      "Ingresa el nombre completo del cliente (mínimo 2 caracteres).",
      "invalid_state"
    );
  }

  const customerPhone = normalizeManualPhone(rawPhone);
  if (!customerPhone) {
    throw new OrderActionError(
      "Ingresa un número de teléfono válido (entre 7 y 15 dígitos).",
      "invalid_state"
    );
  }

  const customerEmail = (rawEmail ?? "").trim().toLowerCase();
  if (customerEmail && !MANUAL_EMAIL_PATTERN.test(customerEmail)) {
    throw new OrderActionError("El correo electrónico ingresado no es válido.", "invalid_state");
  }

  const customerAddress = rawAddress.trim();
  if (customerAddress.length < 3 || customerAddress.length > 400) {
    throw new OrderActionError(
      "Ingresa la dirección de entrega o modalidad (mínimo 3 caracteres).",
      "invalid_state"
    );
  }

  if (
    input.initialStatus !== undefined &&
    input.initialStatus !== "paid" &&
    input.initialStatus !== "pending"
  ) {
    throw new OrderActionError("Estado de pago inicial inválido.", "invalid_state");
  }
  const initialStatus: "paid" | "pending" = input.initialStatus === "pending" ? "pending" : "paid";
  const fulfillmentStatus: FulfillmentStatus = input.fulfillmentStatus ?? "nuevo";
  if (!FULFILLMENT_STATUSES.includes(fulfillmentStatus)) {
    throw new OrderActionError("Estado de entrega inválido.", "invalid_state");
  }
  if (initialStatus === "pending" && fulfillmentStatus === "entregado") {
    throw new OrderActionError(
      "Un pedido pendiente de cobro no puede registrarse como Entregado.",
      "invalid_state"
    );
  }

  const shippingCents = input.shippingCents ?? 0;
  const installationCents = input.installationCents ?? 0;
  if (
    !Number.isInteger(shippingCents) ||
    shippingCents < 0 ||
    shippingCents > MAX_PRICE_CENTS ||
    !Number.isInteger(installationCents) ||
    installationCents < 0 ||
    installationCents > MAX_PRICE_CENTS
  ) {
    throw new OrderActionError("Los costos de envío o instalación son inválidos.", "invalid_state");
  }

  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new OrderActionError("Selecciona al menos un producto para el pedido.", "invalid_state");
  }
  if (input.items.length > MANUAL_MAX_ITEMS) {
    throw new OrderActionError("El pedido supera el máximo de 50 líneas de producto.", "invalid_state");
  }

  const seenProductIds = new Set<string>();
  for (const item of input.items) {
    if (!item || typeof item.productId !== "string" || !item.productId.trim()) {
      throw new OrderActionError("Producto inválido en el pedido.", "invalid_state");
    }
    if (seenProductIds.has(item.productId)) {
      throw new OrderActionError(
        "Cada producto solo puede agregarse una vez; ajusta su cantidad.",
        "invalid_state"
      );
    }
    seenProductIds.add(item.productId);

    if (
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > MANUAL_MAX_QUANTITY
    ) {
      throw new OrderActionError(
        "La cantidad de cada producto debe ser un entero entre 1 y 99.",
        "invalid_state"
      );
    }
    if (
      item.unitPriceCents !== undefined &&
      item.unitPriceCents !== null &&
      (!Number.isInteger(item.unitPriceCents) ||
        item.unitPriceCents < 0 ||
        item.unitPriceCents > MAX_PRICE_CENTS)
    ) {
      throw new OrderActionError("El precio unitario ingresado es inválido.", "invalid_state");
    }
  }

  const productIds = input.items.map((i) => i.productId);
  const [dbProducts, categoryRows] = await Promise.all([
    db.query.products.findMany({
      where: inArray(products.id, productIds),
      with: {
        images: { orderBy: [asc(productImages.position), asc(productImages.id)] },
      },
    }),
    db.select().from(categories),
  ]);

  const productMap = new Map(dbProducts.map((p) => [p.id, p]));
  const categoryLabelBySlug = new Map(categoryRows.map((c) => [c.slug, c.label]));

  const resolvedLines = input.items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) {
      throw new OrderActionError(`Producto no encontrado: ${item.productId}`, "not_found");
    }
    if (product.stock != null && product.stock < item.quantity) {
      throw new OrderActionError(
        `Stock insuficiente para "${product.name}" (disponible: ${product.stock}).`,
        "stock_unavailable"
      );
    }

    const catalogUnit = product.transferPriceCents ?? product.priceCents ?? null;
    const unitPriceCents =
      item.unitPriceCents !== undefined && item.unitPriceCents !== null
        ? item.unitPriceCents
        : catalogUnit;

    if (unitPriceCents == null) {
      throw new OrderActionError(
        `Ingresa un precio unitario para "${product.name}".`,
        "invalid_state"
      );
    }

    const lineTotalCents = unitPriceCents * item.quantity;
    if (!Number.isInteger(lineTotalCents) || lineTotalCents > INT32_MAX) {
      throw new OrderActionError(
        `El total de línea de "${product.name}" excede el máximo permitido.`,
        "invalid_state"
      );
    }

    return {
      product,
      quantity: item.quantity,
      unitPriceCents,
      lineTotalCents,
    };
  });

  const productSubtotalCents = resolvedLines.reduce((sum, l) => sum + l.lineTotalCents, 0);
  const totalCents = productSubtotalCents + shippingCents + installationCents;
  if (!Number.isInteger(totalCents) || totalCents < 0 || totalCents > INT32_MAX) {
    throw new OrderActionError("El total del pedido excede el límite permitido.", "invalid_state");
  }
  const { subtotalCents, taxCents } = computeTaxBreakdown(totalCents);
  const clientTransactionId = generateClientTransactionId();
  const trackingNote =
    typeof input.trackingNote === "string" ? input.trackingNote.trim().slice(0, 1000) || null : null;
  const shippingZoneLabel =
    typeof input.shippingZoneLabel === "string"
      ? input.shippingZoneLabel.trim().slice(0, 120) || null
      : null;
  const now = new Date();

  const createdOrder = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(orders)
      .values({
        clientTransactionId,
        status: initialStatus,
        paymentMethod: "transferencia",
        fulfillmentStatus,
        trackingNote,
        customerName,
        customerPhone,
        customerEmail,
        customerAddress,
        subtotalCents,
        taxCents,
        shippingCents,
        installationCents,
        shippingZoneLabel,
        totalCents,
        confirmedAt: initialStatus === "paid" ? now : null,
      })
      .returning();

    await tx.insert(orderItems).values(
      resolvedLines.map((line) => ({
        orderId: created.id,
        productId: line.product.id,
        productName: line.product.name,
        unitPriceCents: line.unitPriceCents,
        quantity: line.quantity,
        lineTotalCents: line.lineTotalCents,
        productImageSrc: line.product.images[0]?.src ?? null,
        productCategory:
          categoryLabelBySlug.get(line.product.categorySlug) ?? line.product.categorySlug,
        productDescription: line.product.description ?? null,
        productSpecs: line.product.specs ?? null,
      }))
    );

    const eventTitle =
      initialStatus === "paid"
        ? "Pedido externo registrado (pago confirmado)"
        : "Pedido externo registrado";
    const eventDesc =
      initialStatus === "paid"
        ? "Pedido creado manualmente desde Fraylin Admin con pago confirmado."
        : "Pedido creado manualmente desde Fraylin Admin pendiente de confirmación de pago.";

    await tx.insert(orderEvents).values({
      orderId: created.id,
      statusFrom: null,
      statusTo: initialStatus,
      fulfillmentFrom: null,
      fulfillmentTo: fulfillmentStatus,
      title: eventTitle,
      description: eventDesc,
      actor: "admin",
    });

    await reserveOrderStock(tx, created.id);
    return created;
  });

  await syncOrderToPortal(createdOrder.id);
  const full = await loadFullOrder(createdOrder.id);
  if (!full) {
    throw new OrderActionError("Pedido no encontrado tras crearlo.", "not_found");
  }
  return full;
}
