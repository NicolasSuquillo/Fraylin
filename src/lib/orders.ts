import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderItems, products } from "@/db/schema";
import { confirmPayphoneTransaction } from "@/lib/payphone";
import { FULFILLMENT_STATUSES, type FulfillmentStatus, type Order, type OrderItem } from "@/types";

export { FULFILLMENT_STATUSES };
export type { FulfillmentStatus };

function toOrder(row: typeof orders.$inferSelect, items?: (typeof orderItems.$inferSelect)[]): Order {
  return {
    id: row.id,
    clientTransactionId: row.clientTransactionId,
    status: row.status,
    paymentMethod: row.paymentMethod,
    fulfillmentStatus: row.fulfillmentStatus,
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
    items: items?.map(
      (item): OrderItem => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        unitPriceCents: item.unitPriceCents,
        quantity: item.quantity,
        lineTotalCents: item.lineTotalCents,
      })
    ),
  };
}

export async function getOrders(): Promise<Order[]> {
  const rows = await db.query.orders.findMany({
    with: { items: true },
    orderBy: desc(orders.createdAt),
  });
  return rows.map((row) => toOrder(row, row.items));
}

export async function getOrderById(id: string): Promise<Order | null> {
  const row = await db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: { items: true },
  });
  if (!row) return null;
  return toOrder(row, row.items);
}

export async function updateFulfillmentStatus(
  orderId: string,
  fulfillmentStatus: FulfillmentStatus
): Promise<Order> {
  const [row] = await db
    .update(orders)
    .set({ fulfillmentStatus })
    .where(eq(orders.id, orderId))
    .returning();
  if (!row) throw new Error("Orden no encontrada");
  const items = await db.query.orderItems.findMany({ where: eq(orderItems.orderId, orderId) });
  return toOrder(row, items);
}

export async function getOrderByClientTransactionId(clientTransactionId: string): Promise<Order | null> {
  const row = await db.query.orders.findFirst({
    where: eq(orders.clientTransactionId, clientTransactionId),
    with: { items: true },
  });
  if (!row) return null;
  return toOrder(row, row.items);
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function decrementStock(tx: Tx, orderId: string) {
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
      throw new Error(`Stock agotado: ${item.productName ?? item.productId}`);
    }
  }
}

/**
 * Confirma una orden con Payphone de forma idempotente.
 * Si la orden ya no está en "pending", no vuelve a llamar a Confirm.
 */
export async function finalizeOrder(orderId: string, payphoneId: number): Promise<Order> {
  const claimed = await db.transaction(async (tx) => {
    const [row] = await tx
      .update(orders)
      .set({ status: "processing" })
      .where(sql`${orders.id} = ${orderId} AND ${orders.status} = 'pending'`)
      .returning();
    return row ?? null;
  });

  if (!claimed) {
    const existing = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: { items: true },
    });
    if (!existing) throw new Error("Orden no encontrada");
    return toOrder(existing, existing.items);
  }

  let confirmation;
  try {
    confirmation = await confirmPayphoneTransaction(payphoneId, claimed.clientTransactionId);
  } catch (error) {
    // Confirm falló (red, timeout, respuesta inválida): liberar la orden para
    // que el cliente pueda reintentar recargando la página de respuesta.
    await db
      .update(orders)
      .set({ status: "pending" })
      .where(sql`${orders.id} = ${orderId} AND ${orders.status} = 'processing'`);
    throw error;
  }
  const approved = confirmation.statusCode === 3;

  let result: Order;
  try {
    result = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(orders)
        .set({
          status: approved ? "paid" : "failed",
          payphoneTransactionId: String(confirmation.transactionId),
          payphoneStatusCode: confirmation.statusCode,
          payphoneRaw: confirmation,
          confirmedAt: new Date(),
        })
        .where(eq(orders.id, orderId))
        .returning();

      if (approved) {
        await decrementStock(tx, orderId);
      }

      const fullItems = await tx.query.orderItems.findMany({
        where: eq(orderItems.orderId, orderId),
      });
      return toOrder(updated, fullItems);
    });
  } catch (txError) {
    // Payphone aprobó pero la transacción DB falló (ej: stock agotado por orden concurrente).
    // Marcar como failed para que no quede atascada en "processing".
    await db
      .update(orders)
      .set({ status: "failed", payphoneStatusCode: confirmation.statusCode, confirmedAt: new Date() })
      .where(sql`${orders.id} = ${orderId} AND ${orders.status} = 'processing'`);
    throw txError;
  }

  return result;
}

/**
 * Marca como pagada una orden de transferencia/Deuna confirmada manualmente por el admin.
 * Idempotente: solo transiciona desde "pending"; descuenta stock una sola vez.
 */
export async function markOrderPaidManually(orderId: string): Promise<Order> {
  const claimed = await db.transaction(async (tx) => {
    const [row] = await tx
      .update(orders)
      .set({ status: "paid", confirmedAt: new Date() })
      .where(sql`${orders.id} = ${orderId} AND ${orders.status} = 'pending'`)
      .returning();
    if (row) {
      await decrementStock(tx, orderId);
    }
    return row ?? null;
  });

  const row =
    claimed ??
    (await db.query.orders.findFirst({ where: eq(orders.id, orderId) }));
  if (!row) throw new Error("Orden no encontrada");

  const items = await db.query.orderItems.findMany({ where: eq(orderItems.orderId, orderId) });
  return toOrder(row, items);
}

/**
 * Marca una orden como cancelada (el usuario canceló en la Cajita, sin llamar a Confirm).
 */
export async function cancelOrder(orderId: string): Promise<Order> {
  const claimed = await db.transaction(async (tx) => {
    const [row] = await tx
      .update(orders)
      .set({ status: "cancelled" })
      .where(sql`${orders.id} = ${orderId} AND ${orders.status} = 'pending'`)
      .returning();
    return row ?? null;
  });

  const row =
    claimed ??
    (await db.query.orders.findFirst({ where: eq(orders.id, orderId) }));
  if (!row) throw new Error("Orden no encontrada");

  const items = await db.query.orderItems.findMany({ where: eq(orderItems.orderId, orderId) });
  return toOrder(row, items);
}
