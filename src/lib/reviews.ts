import { db } from "@/db";
import { orders, reviews } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { syncOrderToPortal } from "@/lib/portal-sync";
import type { Review } from "@/types";

function mapRow(r: typeof reviews.$inferSelect): Review {
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

export async function getApprovedReviews(): Promise<Review[]> {
  const rows = await db
    .select()
    .from(reviews)
    .where(eq(reviews.approved, true))
    .orderBy(desc(reviews.createdAt));
  return rows.map(mapRow);
}

export async function getAllReviews(): Promise<Review[]> {
  const rows = await db.select().from(reviews).orderBy(desc(reviews.createdAt));
  return rows.map(mapRow);
}

export async function createReview(data: {
  authorName: string;
  rating: number;
  body: string;
  avatarUrl?: string;
  orderId?: string;
  clientTransactionId?: string;
  approved?: boolean;
}): Promise<Review> {
  const [row] = await db
    .insert(reviews)
    .values({
      authorName: data.authorName,
      rating: data.rating,
      body: data.body,
      avatarUrl: data.avatarUrl,
      orderId: data.orderId,
      clientTransactionId: data.clientTransactionId,
      approved: data.approved ?? false,
    })
    .returning();
  return mapRow(row);
}

export async function createOrderVerifiedReview(data: {
  orderId: string;
  clientTransactionId: string;
  authorName: string;
  rating: number;
  body: string;
  avatarUrl?: string;
  actor?: string;
  skipPortalSync?: boolean;
}): Promise<Review> {
  const authorName = data.authorName.trim();
  const body = data.body.trim();
  const clientTransactionId = data.clientTransactionId.trim().toUpperCase();
  if (
    !Number.isInteger(data.rating) ||
    data.rating < 1 ||
    data.rating > 5 ||
    body.length < 10 ||
    body.length > 1000 ||
    !authorName ||
    authorName.length > 80 ||
    !clientTransactionId
  ) {
    throw new Error("INVALID_REVIEW");
  }

  const rows = await db.execute<{
    id: number;
    author_name: string;
    rating: number;
    body: string;
    avatar_url: string | null;
    approved: boolean;
    order_id: string | null;
    client_transaction_id: string | null;
    created_at: Date | string;
  }>(sql`
    WITH ord AS (
      SELECT id, status::text AS status, fulfillment_status
      FROM orders
      WHERE id = ${data.orderId}::uuid
        AND client_transaction_id = ${clientTransactionId}
        AND status = 'paid'::order_status
        AND fulfillment_status = 'entregado'
    ),
    rev AS (
      INSERT INTO reviews (
        author_name, rating, body, avatar_url, order_id, client_transaction_id, approved
      )
      SELECT
        ${authorName},
        ${data.rating},
        ${body},
        ${data.avatarUrl ?? null},
        ord.id,
        ${clientTransactionId},
        false
      FROM ord
      ON CONFLICT (order_id) WHERE order_id IS NOT NULL DO NOTHING
      RETURNING id, author_name, rating, body, avatar_url, approved, order_id, client_transaction_id, created_at
    ),
    touch AS (
      UPDATE orders
      SET updated_at = now()
      FROM rev
      WHERE orders.id = rev.order_id
      RETURNING orders.id
    ),
    ev AS (
      INSERT INTO order_events (
        order_id, status_from, status_to, fulfillment_from, fulfillment_to, title, description, actor
      )
      SELECT
        ord.id,
        ord.status,
        ord.status,
        ord.fulfillment_status,
        ord.fulfillment_status,
        ${`Reseña enviada (${data.rating}/5 ★)`},
        ${body.slice(0, 140)},
        ${data.actor ?? "cliente"}
      FROM ord
      JOIN rev ON rev.order_id = ord.id
      RETURNING id
    )
    SELECT rev.* FROM rev JOIN ev ON true JOIN touch ON true
  `);

  const created = rows[0];
  if (!created) {
    // Distinguir motivo exacto si no insertó
    const check = await db.execute<{
      status: string;
      fulfillment_status: string;
      has_review: boolean;
      client_ok: boolean;
    }>(sql`
      SELECT
        o.status::text AS status,
        o.fulfillment_status,
        EXISTS(SELECT 1 FROM reviews r WHERE r.order_id = o.id) AS has_review,
        (o.client_transaction_id = ${clientTransactionId}) AS client_ok
      FROM orders o
      WHERE o.id = ${data.orderId}::uuid
      LIMIT 1
    `);
    const row = check[0];
    if (!row) throw new Error("ORDER_NOT_FOUND");
    if (!row.client_ok) throw new Error("ORDER_CODE_MISMATCH");
    if (row.has_review) throw new Error("REVIEW_ALREADY_EXISTS");
    throw new Error("ORDER_NOT_DELIVERED");
  }

  if (!data.skipPortalSync) {
    await syncOrderToPortal(data.orderId);
  }

  return {
    id: Number(created.id),
    authorName: created.author_name,
    rating: Number(created.rating),
    body: created.body,
    avatarUrl: created.avatar_url,
    approved: Boolean(created.approved),
    orderId: created.order_id,
    clientTransactionId: created.client_transaction_id,
    createdAt: new Date(created.created_at).toISOString(),
  };
}

export async function setReviewApproval(
  id: number,
  approved: boolean
): Promise<{ found: boolean; orderId: string | null; clientTransactionId: string | null }> {
  const row = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(reviews)
      .set({ approved })
      .where(eq(reviews.id, id))
      .returning({
        orderId: reviews.orderId,
        clientTransactionId: reviews.clientTransactionId,
      });
    if (!updated) return null;
    if (updated.orderId) {
      await tx
        .update(orders)
        .set({ updatedAt: new Date() })
        .where(eq(orders.id, updated.orderId));
    }
    return updated;
  });

  if (!row) {
    return { found: false, orderId: null, clientTransactionId: null };
  }
  if (row.orderId) {
    await syncOrderToPortal(row.orderId);
  }
  return {
    found: true,
    orderId: row.orderId ?? null,
    clientTransactionId: row.clientTransactionId ?? null,
  };
}

export async function deleteReview(id: number): Promise<{
  found: boolean;
  avatarUrl: string | null;
  orderId: string | null;
  clientTransactionId: string | null;
}> {
  const row = await db.transaction(async (tx) => {
    const [deleted] = await tx.delete(reviews).where(eq(reviews.id, id)).returning();
    if (!deleted) return null;
    if (deleted.orderId) {
      await tx
        .update(orders)
        .set({ updatedAt: new Date() })
        .where(eq(orders.id, deleted.orderId));
    }
    return deleted;
  });

  if (!row) {
    return { found: false, avatarUrl: null, orderId: null, clientTransactionId: null };
  }
  if (row.orderId) {
    await syncOrderToPortal(row.orderId);
  }
  return {
    found: true,
    avatarUrl: row.avatarUrl ?? null,
    orderId: row.orderId ?? null,
    clientTransactionId: row.clientTransactionId ?? null,
  };
}
