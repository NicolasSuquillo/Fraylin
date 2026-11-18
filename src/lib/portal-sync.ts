import postgres from "postgres";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  categories,
  orders,
  productImages,
  products,
  reviews,
} from "@/db/schema";
import type { FulfillmentStatus, OrderStatus } from "@/types";
import { buildPortalUrl } from "@/lib/site";

const globalForPortalDb = globalThis as unknown as {
  portalPgClient?: ReturnType<typeof postgres>;
};

function getPortalSql(): ReturnType<typeof postgres> | null {
  const url = process.env.FRAYLIN_PORTAL_DATABASE_URL;
  if (!url) return null;
  if (!globalForPortalDb.portalPgClient) {
    globalForPortalDb.portalPgClient = postgres(url, {
      prepare: false,
      max: 2,
      idle_timeout: 4,
      max_lifetime: 60,
      connect_timeout: 8,
    });
  }
  return globalForPortalDb.portalPgClient;
}

export interface SyncOrderPayload {
  orderId: string;
  clientTransactionId: string;
  status: OrderStatus;
  paymentMethod: string;
  fulfillmentStatus: FulfillmentStatus;
  trackingNote: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  shippingZoneLabel: string | null;
  subtotalCents: number;
  taxCents: number;
  shippingCents: number;
  installationCents: number;
  totalCents: number;
  payphoneTransactionId: string | null;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    fraylinItemId: number;
    productId: string | null;
    productName: string;
    productCategory: string | null;
    productDescription: string | null;
    productSpecs: string | null;
    productImageSrc: string | null;
    unitPriceCents: number;
    quantity: number;
    lineTotalCents: number;
  }>;
  events: Array<{
    fraylinEventId: number;
    statusFrom: string | null;
    statusTo: string | null;
    fulfillmentFrom: string | null;
    fulfillmentTo: string | null;
    title: string;
    description: string | null;
    actor: string;
    createdAt: string;
  }>;
  review: {
    fraylinReviewId: number;
    authorName: string;
    rating: number;
    body: string;
    avatarUrl: string | null;
    approved: boolean;
    createdAt: string;
  } | null;
}

/** Construye el payload completo de un pedido enriquecido con snapshots de producto. */
export async function buildSyncOrderPayload(orderId: string): Promise<SyncOrderPayload | null> {
  const row = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: {
      items: { orderBy: (item, { asc }) => [asc(item.id)] },
      events: { orderBy: (ev, { asc }) => [asc(ev.createdAt), asc(ev.id)] },
    },
  });
  if (!row) return null;

  const productIds = [
    ...new Set(row.items.map((i) => i.productId).filter((id): id is string => Boolean(id))),
  ];

  const productMap = new Map<
    string,
    {
      categoryLabel: string | null;
      description: string | null;
      specs: string | null;
      imageSrc: string | null;
    }
  >();

  if (productIds.length > 0) {
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
      productMap.set(p.id, {
        categoryLabel: catBySlug.get(p.categorySlug) ?? p.categorySlug,
        description: p.description,
        specs: p.specs,
        imageSrc: p.images[0]?.src ?? null,
      });
    }
  }

  const reviewRow = await db.query.reviews.findFirst({
    where: eq(reviews.orderId, row.id),
    orderBy: [desc(reviews.createdAt)],
  });

  return {
    orderId: row.id,
    clientTransactionId: row.clientTransactionId,
    status: row.status,
    paymentMethod: row.paymentMethod,
    fulfillmentStatus: row.fulfillmentStatus as FulfillmentStatus,
    trackingNote: row.trackingNote ?? null,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    customerEmail: row.customerEmail,
    customerAddress: row.customerAddress,
    shippingZoneLabel: row.shippingZoneLabel ?? null,
    subtotalCents: row.subtotalCents,
    taxCents: row.taxCents,
    shippingCents: row.shippingCents,
    installationCents: row.installationCents,
    totalCents: row.totalCents,
    payphoneTransactionId: row.payphoneTransactionId ?? null,
    confirmedAt: row.confirmedAt ? row.confirmedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    items: row.items.map((item) => {
      const live = item.productId ? productMap.get(item.productId) : undefined;
      return {
        fraylinItemId: item.id,
        productId: item.productId,
        productName: item.productName,
        productCategory: item.productCategory ?? live?.categoryLabel ?? null,
        productDescription: item.productDescription ?? live?.description ?? null,
        productSpecs: item.productSpecs ?? live?.specs ?? null,
        productImageSrc: item.productImageSrc ?? live?.imageSrc ?? null,
        unitPriceCents: item.unitPriceCents,
        quantity: item.quantity,
        lineTotalCents: item.lineTotalCents,
      };
    }),
    events: row.events.map((ev) => ({
      fraylinEventId: ev.id,
      statusFrom: ev.statusFrom,
      statusTo: ev.statusTo,
      fulfillmentFrom: ev.fulfillmentFrom,
      fulfillmentTo: ev.fulfillmentTo,
      title: ev.title,
      description: ev.description,
      actor: ev.actor,
      createdAt: ev.createdAt.toISOString(),
    })),
    review: reviewRow
      ? {
          fraylinReviewId: reviewRow.id,
          authorName: reviewRow.authorName,
          rating: reviewRow.rating,
          body: reviewRow.body,
          avatarUrl: reviewRow.avatarUrl,
          approved: reviewRow.approved,
          createdAt: reviewRow.createdAt.toISOString(),
        }
      : null,
  };
}

/** Persiste el payload directamente en la BD Neon de FraylinPortal de forma idempotente. */
async function syncPayloadDirectToPortalDb(payload: SyncOrderPayload): Promise<boolean> {
  const sql = getPortalSql();
  if (!sql) return true;

  const phoneDigits = String(payload.customerPhone ?? "").replace(/\D/g, "");
  const phoneKey = phoneDigits.length >= 9 ? phoneDigits.slice(-9) : "";
  const emailRaw = String(payload.customerEmail ?? "").trim().toLowerCase();
  const validEmailKey = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailRaw) ? emailRaw : "";

  const [pedido] = await sql<{ id: string }[]>`
    INSERT INTO pedidos (
      fraylin_order_id,
      codigo,
      cliente_id,
      estado_pago,
      estado_entrega,
      metodo_pago,
      cliente_nombre,
      cliente_telefono,
      cliente_email,
      cliente_direccion,
      zona_envio,
      subtotal_cents,
      iva_cents,
      envio_cents,
      instalacion_cents,
      total_cents,
      nota_publica,
      payphone_transaction_id,
      confirmado_en,
      created_at,
      updated_at,
      fraylin_updated_at
    )
    VALUES (
      ${payload.orderId}::uuid,
      ${payload.clientTransactionId},
      (
        SELECT CASE WHEN count(*) = 1 THEN max(u.id::text)::uuid ELSE NULL END
        FROM usuarios u
        WHERE u.rol = 'cliente'
          AND u.activo = true
          AND (
            (
              ${phoneKey}::text <> ''
              AND length(regexp_replace(coalesce(u.telefono, ''), '\D', '', 'g')) >= 9
              AND right(regexp_replace(coalesce(u.telefono, ''), '\D', '', 'g'), 9) = ${phoneKey}::text
              AND (
                ${validEmailKey}::text = ''
                OR trim(coalesce(u.email, '')) = ''
                OR lower(trim(u.email)) = ${validEmailKey}::text
              )
            )
            OR (
              ${validEmailKey}::text <> ''
              AND lower(trim(coalesce(u.email, ''))) = ${validEmailKey}::text
              AND (
                ${phoneKey}::text = ''
                OR length(regexp_replace(coalesce(u.telefono, ''), '\D', '', 'g')) < 9
                OR right(regexp_replace(coalesce(u.telefono, ''), '\D', '', 'g'), 9) = ${phoneKey}::text
              )
            )
          )
      ),
      ${payload.status}::estado_pago_pedido,
      ${payload.fulfillmentStatus}::estado_entrega_pedido,
      ${payload.paymentMethod},
      ${payload.customerName},
      ${payload.customerPhone},
      ${payload.customerEmail},
      ${payload.customerAddress},
      ${payload.shippingZoneLabel},
      ${payload.subtotalCents},
      ${payload.taxCents},
      ${payload.shippingCents},
      ${payload.installationCents},
      ${payload.totalCents},
      ${payload.trackingNote},
      ${payload.payphoneTransactionId},
      ${payload.confirmedAt ? new Date(payload.confirmedAt) : null},
      ${new Date(payload.createdAt)},
      ${new Date(payload.updatedAt)},
      ${new Date(payload.updatedAt)}
    )
    ON CONFLICT (fraylin_order_id) DO UPDATE SET
      codigo = EXCLUDED.codigo,
      estado_pago = EXCLUDED.estado_pago,
      estado_entrega = EXCLUDED.estado_entrega,
      metodo_pago = EXCLUDED.metodo_pago,
      cliente_nombre = EXCLUDED.cliente_nombre,
      cliente_telefono = EXCLUDED.cliente_telefono,
      cliente_email = EXCLUDED.cliente_email,
      cliente_direccion = EXCLUDED.cliente_direccion,
      zona_envio = EXCLUDED.zona_envio,
      subtotal_cents = EXCLUDED.subtotal_cents,
      iva_cents = EXCLUDED.iva_cents,
      envio_cents = EXCLUDED.envio_cents,
      instalacion_cents = EXCLUDED.instalacion_cents,
      total_cents = EXCLUDED.total_cents,
      nota_publica = EXCLUDED.nota_publica,
      payphone_transaction_id = EXCLUDED.payphone_transaction_id,
      confirmado_en = EXCLUDED.confirmado_en,
      fraylin_updated_at = EXCLUDED.fraylin_updated_at,
      updated_at = GREATEST(pedidos.updated_at, EXCLUDED.updated_at)
    WHERE pedidos.fraylin_updated_at IS NULL
       OR pedidos.fraylin_updated_at <= EXCLUDED.fraylin_updated_at
    RETURNING id
  `;

  if (!pedido) {
    // El registro en Portal tiene una versión de tienda más reciente; no pisar con estado stale.
    return false;
  }

  const pedidoId = pedido.id;
  const keepItemIds = payload.items.map((i) => i.fraylinItemId);

  await (keepItemIds.length > 0
    ? sql`
        DELETE FROM pedido_items
        WHERE pedido_id = ${pedidoId}::uuid
          AND NOT (fraylin_item_id = ANY(${keepItemIds}::int[]))
      `
    : sql`DELETE FROM pedido_items WHERE pedido_id = ${pedidoId}::uuid`);

  await Promise.all([
    ...payload.items.map((item) => sql`
      INSERT INTO pedido_items (
        pedido_id,
        fraylin_item_id,
        producto_id,
        nombre,
        categoria,
        descripcion,
        especificaciones,
        imagen_url,
        precio_unitario_cents,
        cantidad,
        total_linea_cents
      )
      VALUES (
        ${pedidoId}::uuid,
        ${item.fraylinItemId},
        ${item.productId},
        ${item.productName},
        ${item.productCategory},
        ${item.productDescription},
        ${item.productSpecs},
        ${item.productImageSrc},
        ${item.unitPriceCents},
        ${item.quantity},
        ${item.lineTotalCents}
      )
      ON CONFLICT (pedido_id, fraylin_item_id) DO UPDATE SET
        producto_id = EXCLUDED.producto_id,
        nombre = EXCLUDED.nombre,
        categoria = COALESCE(EXCLUDED.categoria, pedido_items.categoria),
        descripcion = COALESCE(EXCLUDED.descripcion, pedido_items.descripcion),
        especificaciones = COALESCE(EXCLUDED.especificaciones, pedido_items.especificaciones),
        imagen_url = COALESCE(EXCLUDED.imagen_url, pedido_items.imagen_url),
        precio_unitario_cents = EXCLUDED.precio_unitario_cents,
        cantidad = EXCLUDED.cantidad,
        total_linea_cents = EXCLUDED.total_linea_cents
    `),
    ...payload.events.map((ev) => sql`
      INSERT INTO pedido_eventos (
        pedido_id,
        fraylin_event_id,
        estado_pago_anterior,
        estado_pago_nuevo,
        estado_entrega_anterior,
        estado_entrega_nuevo,
        titulo,
        detalle,
        actor,
        created_at
      )
      VALUES (
        ${pedidoId}::uuid,
        ${ev.fraylinEventId},
        ${ev.statusFrom ? ev.statusFrom : null}::estado_pago_pedido,
        ${ev.statusTo ? ev.statusTo : null}::estado_pago_pedido,
        ${ev.fulfillmentFrom ? ev.fulfillmentFrom : null}::estado_entrega_pedido,
        ${ev.fulfillmentTo ? ev.fulfillmentTo : null}::estado_entrega_pedido,
        ${ev.title},
        ${ev.description},
        ${ev.actor},
        ${new Date(ev.createdAt)}
      )
      ON CONFLICT (pedido_id, fraylin_event_id) WHERE fraylin_event_id IS NOT NULL DO NOTHING
    `),
    payload.review
      ? sql`
          INSERT INTO pedido_resenas (
            pedido_id,
            fraylin_review_id,
            autor_nombre,
            rating,
            comentario,
            avatar_url,
            aprobada,
            created_at
          )
          VALUES (
            ${pedidoId}::uuid,
            ${payload.review.fraylinReviewId},
            ${payload.review.authorName},
            ${payload.review.rating},
            ${payload.review.body},
            ${payload.review.avatarUrl},
            ${payload.review.approved},
            ${new Date(payload.review.createdAt)}
          )
          ON CONFLICT (pedido_id) DO UPDATE SET
            fraylin_review_id = EXCLUDED.fraylin_review_id,
            autor_nombre = EXCLUDED.autor_nombre,
            rating = EXCLUDED.rating,
            comentario = EXCLUDED.comentario,
            avatar_url = EXCLUDED.avatar_url,
            aprobada = EXCLUDED.aprobada
        `
      : sql`DELETE FROM pedido_resenas WHERE pedido_id = ${pedidoId}::uuid`,
  ]);
  return true;
}

async function notifyPortalWebhook(payload: SyncOrderPayload): Promise<void> {
  const endpoint = buildPortalUrl("/api/integration/orders-webhook");
  const secret = process.env.FRAYLIN_INTEGRATION_SECRET?.trim();
  if (!endpoint) {
    if (process.env.NEXT_PUBLIC_PORTAL_URL?.trim()) {
      console.warn("[PortalSync] NEXT_PUBLIC_PORTAL_URL inválida; webhook omitido");
    }
    return;
  }
  if (!secret) return;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1500);
  try {
    const res = await Promise.race([
      fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify({ source: "fraylin", order: payload }),
        signal: controller.signal,
      }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 1600)),
    ]);
    if (res && !res.ok) {
      console.error(`[PortalSync] Webhook HTTP ${res.status} order=${payload.orderId}`);
    }
  } catch {
    // El Portal puede estar apagado en local; la BD compartida de sync ya persistió el cambio.
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Sincroniza un pedido de Fraylin hacia FraylinPortal sin bloquear ni fallar
 * el flujo principal si Portal no está disponible temporalmente.
 */
export async function syncOrderToPortal(
  orderId: string,
  opts?: { skipWebhook?: boolean }
): Promise<void> {
  try {
    const payload = await buildSyncOrderPayload(orderId);
    if (!payload) return;
    const applied = await syncPayloadDirectToPortalDb(payload);
    if (applied && !opts?.skipWebhook) {
      await notifyPortalWebhook(payload);
    }
  } catch (err) {
    console.error(`[PortalSync] Error sincronizando pedido=${orderId}:`, err);
  }
}

/** Sincroniza todos los pedidos existentes en Fraylin hacia FraylinPortal. */
export async function syncAllOrdersToPortal(): Promise<number> {
  const rows = await db
    .select({ id: orders.id })
    .from(orders)
    .orderBy(asc(orders.createdAt));
  let synced = 0;
  for (const row of rows) {
    await syncOrderToPortal(row.id, { skipWebhook: true });
    synced++;
  }
  return synced;
}

