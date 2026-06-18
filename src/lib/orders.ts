import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderItems, products } from "@/db/schema";
import {
  confirmPayphoneTransaction,
  reversePayphoneTransaction,
  type PayphoneConfirmResponse,
} from "@/lib/payphone";
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
 * Intenta reservar (descontar) el stock de todos los ítems dentro de la
 * transacción `tx`. Devuelve false (sin lanzar) si algún ítem no tiene stock
 * suficiente; el llamador debe hacer rollback de la transacción para deshacer
 * los descuentos parciales. Productos con stock NULL (sin control) se ignoran.
 */
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
    // Si el producto tiene control de stock (NOT NULL) y no alcanza, falla.
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

/**
 * Devuelve al inventario el stock previamente reservado por una orden.
 * Se usa cuando una orden con stock reservado no se concreta (pago declinado,
 * Confirm fallido, etc.). Productos con stock NULL se ignoran.
 */
async function restoreStock(orderId: string): Promise<void> {
  const items = await db.query.orderItems.findMany({
    where: eq(orderItems.orderId, orderId),
  });
  for (const item of items) {
    if (!item.productId) continue;
    await db
      .update(products)
      .set({ stock: sql`${products.stock} + ${item.quantity}` })
      .where(sql`${products.id} = ${item.productId} AND ${products.stock} IS NOT NULL`);
  }
}

/**
 * Marca una orden "processing" como "failed" y, si corresponde, reversa el
 * cargo en Payphone (cuando hubo cobro aprobado que no se puede cumplir).
 * Si el reverso falla, deja rastro en logs para revisión manual: nunca se
 * pierde el evento de un cliente cobrado sin entrega.
 */
async function failOrderAndReverse(
  orderId: string,
  confirmation: PayphoneConfirmResponse,
  reason: string,
  reverse: boolean
): Promise<Order> {
  // Transición terminal atómica processing→failed. SOLO quien gana la transición
  // (UPDATE con fila devuelta) restaura el stock y reversa: garantiza que la
  // reposición de inventario ocurra exactamente una vez aunque se llame dos veces
  // (ej. retry del cliente + reconciliación concurrente).
  const [row] = await db
    .update(orders)
    .set({
      status: "failed",
      payphoneTransactionId: String(confirmation.transactionId),
      payphoneStatusCode: confirmation.statusCode,
      // Se persiste el motivo legible junto a la respuesta de Payphone para que
      // el admin vea en el panel por qué falló, sin tener que leer los logs.
      payphoneRaw: { ...confirmation, _failureReason: reason },
      confirmedAt: new Date(),
    })
    .where(sql`${orders.id} = ${orderId} AND ${orders.status} = 'processing'`)
    .returning();

  if (!row) {
    // Ya estaba en estado terminal (otra ejecución la liquidó): no restaurar ni
    // reversar de nuevo, solo devolver el estado actual.
    const current = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: { items: true },
    });
    if (!current) throw new Error("Orden no encontrada");
    return toOrder(current, current.items);
  }

  // Ganamos la transición: devolver el stock reservado una sola vez.
  await restoreStock(orderId);

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

  const items = await db.query.orderItems.findMany({ where: eq(orderItems.orderId, orderId) });
  return toOrder(row, items);
}

/**
 * Liquida una orden ya en `processing` (con stock reservado) a partir de la
 * respuesta de Confirm de Payphone. Idempotente: las transiciones terminales
 * (`processing→paid` / `processing→failed`) van guardadas por status, así que si
 * otra ejecución ya liquidó la orden, esta devuelve el estado actual sin efectos.
 *
 * Reutilizado por `finalizeOrder` (flujo en vivo) y por
 * `reconcileStaleProcessingOrders` (recuperación de órdenes colgadas).
 */
async function settleConfirmedOrder(
  order: typeof orders.$inferSelect,
  confirmation: PayphoneConfirmResponse
): Promise<Order> {
  const approvedByPayphone = confirmation.statusCode === 3;

  // Rechazo/cancelación: no se capturó cobro. failOrderAndReverse devuelve stock.
  if (!approvedByPayphone) {
    return failOrderAndReverse(order.id, confirmation, "pago no aprobado", false);
  }

  // Anti-fraude (C1): el monto capturado debe coincidir con el total persistido.
  // La Cajita se renderiza en el cliente y su `amount` es manipulable.
  const paidAmount = typeof confirmation.amount === "number" ? confirmation.amount : null;
  const amountMatches = paidAmount !== null && paidAmount === order.totalCents;
  if (!amountMatches) {
    console.error(
      "[Payphone] Monto capturado no coincide con el total de la orden (posible manipulación).",
      { orderId: order.id, esperadoCents: order.totalCents, recibidoCents: paidAmount, raw: confirmation }
    );
    // Ya se capturó un monto distinto: devolver stock + intentar reverso.
    return failOrderAndReverse(order.id, confirmation, "monto no coincide", true);
  }

  // Aprobado y monto correcto: marcar pagada (el stock ya está reservado).
  // Guardado por status='processing' para que sea idempotente ante reintentos.
  const [updated] = await db
    .update(orders)
    .set({
      status: "paid",
      payphoneTransactionId: String(confirmation.transactionId),
      payphoneStatusCode: confirmation.statusCode,
      payphoneRaw: confirmation,
      confirmedAt: new Date(),
    })
    .where(sql`${orders.id} = ${order.id} AND ${orders.status} = 'processing'`)
    .returning();

  if (!updated) {
    // Otra ejecución ya la liquidó: devolver el estado actual sin re-tocar stock.
    const current = await db.query.orders.findFirst({
      where: eq(orders.id, order.id),
      with: { items: true },
    });
    if (!current) throw new Error("Orden no encontrada");
    return toOrder(current, current.items);
  }

  const fullItems = await db.query.orderItems.findMany({
    where: eq(orderItems.orderId, order.id),
  });
  return toOrder(updated, fullItems);
}

// Sentinela para abortar (rollback) la transacción de reclamo cuando no hay stock.
class StockUnavailableError extends Error {}

/**
 * Confirma una orden con Payphone de forma idempotente.
 *
 * Modelo de la Cajita (2 fases): el pago se RETIENE al pagar y Confirm lo
 * CAPTURA. Si no se confirma, Payphone reversa solo en ~5 min. Por eso el stock
 * se RESERVA antes de Confirm: si no hay stock, NO se confirma y Payphone
 * libera la retención automáticamente — el cliente nunca queda cobrado sin
 * entrega (C2), sin depender de la API de reverso.
 */
export async function finalizeOrder(orderId: string, payphoneId: number): Promise<Order> {
  // 1. Reclamar (pending→processing) Y reservar stock en una sola transacción.
  //    Si falta stock, se lanza para hacer rollback de la reserva parcial y del
  //    reclamo (la orden queda pending y se marca failed más abajo).
  let claimed: typeof orders.$inferSelect | null = null;
  let stockUnavailable = false;
  try {
    claimed = await db.transaction(async (tx) => {
      const [row] = await tx
        .update(orders)
        // Se persiste el payphoneId YA en el reclamo: si el proceso cae entre
        // Confirm y la transición terminal, la orden queda en `processing` pero
        // conserva el id necesario para que la reconciliación pueda re-confirmar
        // (sin esto el id solo existía en la URL de respuesta y se perdía).
        .set({ status: "processing", payphoneTransactionId: String(payphoneId) })
        .where(sql`${orders.id} = ${orderId} AND ${orders.status} = 'pending'`)
        .returning();
      if (!row) return null; // ya no estaba pending (idempotencia)
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
    // No confirmamos: Payphone reversa la retención automáticamente. Marcar
    // failed para no dejar la orden colgada en pending.
    console.error(
      `[Payphone] Stock insuficiente para orden=${orderId}; no se confirma (Payphone auto-reversa).`
    );
    await db
      .update(orders)
      .set({ status: "failed", confirmedAt: new Date() })
      .where(sql`${orders.id} = ${orderId} AND ${orders.status} = 'pending'`);
    const row = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: { items: true },
    });
    if (!row) throw new Error("Orden no encontrada");
    return toOrder(row, row.items);
  }

  if (!claimed) {
    const existing = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: { items: true },
    });
    if (!existing) throw new Error("Orden no encontrada");
    return toOrder(existing, existing.items);
  }

  // 2. Confirmar (capturar) con Payphone. El stock ya está reservado.
  let confirmation;
  try {
    confirmation = await confirmPayphoneTransaction(payphoneId, claimed.clientTransactionId);
  } catch (error) {
    // Confirm falló (red, timeout): liberar la orden a pending y devolver stock
    // para que el cliente pueda reintentar recargando la página de respuesta.
    // Se limpia payphoneTransactionId para que, si la orden se abandona, la
    // reconciliación de pendientes pueda cancelarla. La restauración va atada a
    // ganar la transición (returning) para no devolver stock dos veces.
    const [reverted] = await db
      .update(orders)
      .set({ status: "pending", payphoneTransactionId: null })
      .where(sql`${orders.id} = ${orderId} AND ${orders.status} = 'processing'`)
      .returning();
    if (reverted) await restoreStock(orderId);
    throw error;
  }

  // 3. Liquidar según la respuesta de Confirm (idempotente, guardado por status).
  return settleConfirmedOrder(claimed, confirmation);
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
      // CRÍTICO (anti-estafa): solo transferencia. Una orden Payphone NUNCA se
      // marca pagada manualmente — debe pasar por el Confirm server-side. Sin
      // este filtro, el endpoint admin markPaid (o un CSRF) podría dar por pagada
      // una orden Payphone sin cobro real.
      .where(
        sql`${orders.id} = ${orderId}
            AND ${orders.status} = 'pending'
            AND ${orders.paymentMethod} = 'transferencia'`
      )
      .returning();
    if (row) {
      await decrementStock(tx, orderId);
    }
    return row ?? null;
  });

  if (claimed) {
    const items = await db.query.orderItems.findMany({ where: eq(orderItems.orderId, orderId) });
    return toOrder(claimed, items);
  }

  // No transicionó. Si ya está pagada por transferencia (re-click idempotente),
  // devolver sin error. En cualquier otro caso (Payphone, inexistente, cancelada)
  // lanzar: la ruta responde error y nunca se confunde con un pago aplicado.
  const existing = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (existing && existing.status === "paid" && existing.paymentMethod === "transferencia") {
    const items = await db.query.orderItems.findMany({ where: eq(orderItems.orderId, orderId) });
    return toOrder(existing, items);
  }
  throw new Error("La orden no puede marcarse pagada manualmente (solo transferencia pendiente)");
}

/**
 * Reconciliación de órdenes Payphone colgadas en `pending`.
 *
 * Si el cliente cierra el navegador tras pagar (o nunca completa la Cajita), la
 * orden queda `pending` y nunca se ejecuta Confirm. Como Payphone reversa la
 * retención automáticamente (~5 min) cuando no se captura, esas órdenes no
 * representan un cobro: se marcan `cancelled` para no dejarlas colgadas.
 *
 * NO toca órdenes de transferencia (esperan confirmación manual del admin) ni
 * órdenes con `payphoneTransactionId` (esas ya entraron al flujo de Confirm).
 * Devuelve el número de órdenes canceladas.
 */
export async function cancelStalePendingPayphoneOrders(olderThanMinutes = 30): Promise<number> {
  const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000);
  const updated = await db
    .update(orders)
    .set({ status: "cancelled" })
    .where(
      sql`${orders.status} = 'pending'
          AND ${orders.paymentMethod} = 'payphone'
          AND ${orders.payphoneTransactionId} IS NULL
          AND ${orders.createdAt} < ${cutoff}`
    )
    .returning({ id: orders.id });
  if (updated.length > 0) {
    console.warn(
      `[Reconciliación] ${updated.length} orden(es) Payphone pending vencida(s) marcadas cancelled.`
    );
  }
  return updated.length;
}

/**
 * Recupera órdenes Payphone colgadas en `processing` (stock reservado).
 *
 * Ventana de riesgo: si el proceso cae entre Confirm y la transición terminal, la
 * orden queda en `processing` con stock retenido y el cobro PUDO capturarse. No se
 * puede cancelar a ciegas. Esta función re-ejecuta Confirm (idempotente en
 * Payphone) sobre las `processing` vencidas y las liquida vía `settleConfirmedOrder`:
 * si Payphone aprobó → `paid` (stock se mantiene); si no → `failed` (stock se
 * restaura exactamente una vez). Si Confirm no responde, se deja en `processing`
 * para reintentar en la siguiente pasada.
 *
 * Solo toca `payphone` con `payphoneTransactionId` ya persistido (lo fija el
 * reclamo en `finalizeOrder`). Gated por sesión admin en la ruta que la invoca.
 */
export async function reconcileStaleProcessingOrders(
  olderThanMinutes = 15
): Promise<{ settled: number; failed: number; skipped: number }> {
  const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000);
  const stale = await db.query.orders.findMany({
    where: sql`${orders.status} = 'processing'
        AND ${orders.paymentMethod} = 'payphone'
        AND ${orders.payphoneTransactionId} IS NOT NULL
        AND ${orders.createdAt} < ${cutoff}`,
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
      // Confirm no disponible (red/timeout): dejar en processing y reintentar luego.
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
