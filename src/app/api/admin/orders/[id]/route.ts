import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/admin-auth";
import {
  FULFILLMENT_STATUSES,
  OrderActionError,
  cancelTransferOrderManually,
  getOrderById,
  markOrderPaidManually,
  updateFulfillmentStatus,
} from "@/lib/orders";
import { touchCatalogVersion } from "@/lib/cache-version";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ order });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { fulfillmentStatus, trackingNote, eventDescription, action } = body;

  if (action === "markPaid") {
    try {
      const order = await markOrderPaidManually(id);
      await touchCatalogVersion();
      revalidatePath("/admin/orders");
      revalidatePath(`/admin/orders/${id}`);
      revalidatePath(`/seguimiento/${order.clientTransactionId}`);
      revalidatePath("/");
      return NextResponse.json({ order });
    } catch (err) {
      if (err instanceof OrderActionError) {
        const status = err.code === "not_found" ? 404 : 400;
        return NextResponse.json({ error: err.message }, { status });
      }
      console.error("[admin/orders] markPaid:", err);
      return NextResponse.json({ error: "No se pudo marcar como pagado" }, { status: 500 });
    }
  }

  if (action === "cancel") {
    try {
      const order = await cancelTransferOrderManually(id);
      await touchCatalogVersion();
      revalidatePath("/admin/orders");
      revalidatePath(`/admin/orders/${id}`);
      revalidatePath(`/seguimiento/${order.clientTransactionId}`);
      revalidatePath("/");
      return NextResponse.json({ order });
    } catch (err) {
      if (err instanceof OrderActionError) {
        const status = err.code === "not_found" ? 404 : 400;
        return NextResponse.json({ error: err.message }, { status });
      }
      console.error("[admin/orders] cancel:", err);
      return NextResponse.json({ error: "No se pudo cancelar el pedido" }, { status: 500 });
    }
  }

  if (!FULFILLMENT_STATUSES.includes(fulfillmentStatus)) {
    return NextResponse.json({ error: "Estado de entrega inválido" }, { status: 400 });
  }

  if (trackingNote !== undefined && trackingNote !== null && typeof trackingNote !== "string") {
    return NextResponse.json({ error: "Nota de seguimiento inválida" }, { status: 400 });
  }
  if (
    eventDescription !== undefined &&
    eventDescription !== null &&
    typeof eventDescription !== "string"
  ) {
    return NextResponse.json({ error: "Detalle del evento inválido" }, { status: 400 });
  }

  try {
    const order = await updateFulfillmentStatus(id, fulfillmentStatus, {
      trackingNote:
        typeof trackingNote === "string"
          ? trackingNote.slice(0, 1000)
          : trackingNote === null
            ? null
            : undefined,
      eventDescription:
        typeof eventDescription === "string" ? eventDescription.slice(0, 500) : undefined,
      actor: "admin",
    });
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${id}`);
    revalidatePath(`/seguimiento/${order.clientTransactionId}`);
    return NextResponse.json({ order });
  } catch (err) {
    if (err instanceof OrderActionError) {
      const status = err.code === "not_found" ? 404 : 400;
      return NextResponse.json({ error: err.message }, { status });
    }
    console.error("[admin/orders] PATCH fulfillment:", err);
    return NextResponse.json({ error: "No se pudo actualizar el pedido" }, { status: 500 });
  }
}
