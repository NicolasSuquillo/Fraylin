import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { touchCatalogVersion } from "@/lib/cache-version";
import { verifyIntegrationAuth } from "@/lib/integration-auth";
import {
  FULFILLMENT_STATUSES,
  OrderActionError,
  cancelTransferOrderManually,
  getOrderByClientTransactionId,
  markOrderPaidManually,
  updateFulfillmentStatus,
} from "@/lib/orders";
import { buildSyncOrderPayload } from "@/lib/portal-sync";
import { createOrderVerifiedReview } from "@/lib/reviews";
import type { FulfillmentStatus } from "@/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  if (!verifyIntegrationAuth(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { code } = await params;
  const existing = await getOrderByClientTransactionId(code);
  if (!existing) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  const payload = await buildSyncOrderPayload(existing.id);
  if (!payload) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }
  return NextResponse.json({ order: payload });
}

const ALLOWED_INTEGRATION_ACTIONS = new Set([
  "updateFulfillment",
  "markPaid",
  "cancel",
  "submitReview",
]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  if (!verifyIntegrationAuth(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { code } = await params;
  const existing = await getOrderByClientTransactionId(code);
  if (!existing) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    const raw = await req.json();
    body = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const action = typeof body.action === "string" ? body.action : "updateFulfillment";
  if (!ALLOWED_INTEGRATION_ACTIONS.has(action)) {
    return NextResponse.json({ error: "Acción no soportada" }, { status: 400 });
  }
  const actor = typeof body.actor === "string" && body.actor.trim() ? body.actor.trim().slice(0, 120) : "portal";

  try {
    if (action === "markPaid") {
      await markOrderPaidManually(existing.id, { actor, skipPortalSync: true });
      await touchCatalogVersion();
      revalidatePath("/");
    } else if (action === "cancel") {
      await cancelTransferOrderManually(existing.id, { actor, skipPortalSync: true });
      await touchCatalogVersion();
      revalidatePath("/");
    } else if (action === "submitReview") {
      const rating = typeof body.rating === "number" ? body.rating : NaN;
      const reviewBody = typeof body.body === "string" ? body.body.trim() : "";
      const authorName = (
        typeof body.authorName === "string" && body.authorName.trim()
          ? body.authorName.trim()
          : existing.customerName
      )
        .trim()
        .slice(0, 80);
      if (
        !authorName ||
        !Number.isInteger(rating) ||
        rating < 1 ||
        rating > 5 ||
        reviewBody.length < 10 ||
        reviewBody.length > 1000
      ) {
        return NextResponse.json({ error: "Datos de reseña inválidos" }, { status: 400 });
      }
      await createOrderVerifiedReview({
        orderId: existing.id,
        clientTransactionId: existing.clientTransactionId,
        authorName,
        rating,
        body: reviewBody,
        actor,
        skipPortalSync: true,
      });
      revalidatePath("/admin/reviews");
    } else {
      const fulfillmentStatus =
        typeof body.fulfillmentStatus === "string"
          ? (body.fulfillmentStatus as FulfillmentStatus)
          : undefined;
      if (!fulfillmentStatus || !FULFILLMENT_STATUSES.includes(fulfillmentStatus)) {
        return NextResponse.json({ error: "Estado de entrega inválido" }, { status: 400 });
      }
      await updateFulfillmentStatus(existing.id, fulfillmentStatus, {
        trackingNote:
          typeof body.trackingNote === "string"
            ? body.trackingNote.slice(0, 1000)
            : body.trackingNote === null
              ? null
              : undefined,
        eventDescription:
          typeof body.eventDescription === "string" ? body.eventDescription.slice(0, 500) : undefined,
        actor,
        skipPortalSync: true,
      });
    }

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${existing.id}`);
    revalidatePath(`/seguimiento/${existing.clientTransactionId}`);

    const updatedPayload = await buildSyncOrderPayload(existing.id);
    if (!updatedPayload) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, order: updatedPayload });
  } catch (err) {
    if (err instanceof OrderActionError) {
      const status = err.code === "not_found" ? 404 : 400;
      return NextResponse.json({ error: err.message }, { status });
    }
    if (err instanceof Error && err.message === "ORDER_NOT_FOUND") {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }
    if (err instanceof Error && err.message === "REVIEW_ALREADY_EXISTS") {
      return NextResponse.json({ error: "El pedido ya tiene reseña" }, { status: 409 });
    }
    if (err instanceof Error && (err.message === "INVALID_REVIEW" || err.message === "ORDER_CODE_MISMATCH")) {
      return NextResponse.json({ error: "Datos de reseña inválidos" }, { status: 400 });
    }
    if (err instanceof Error && err.message === "ORDER_NOT_DELIVERED") {
      return NextResponse.json(
        { error: "El pedido debe estar pagado y entregado para recibir una reseña." },
        { status: 400 }
      );
    }
    console.error("[integration/orders PATCH] error:", err);
    return NextResponse.json({ error: "Error procesando actualización" }, { status: 500 });
  }
}

