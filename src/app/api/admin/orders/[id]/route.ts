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
  const { fulfillmentStatus, action } = body;

  if (action === "markPaid") {
    try {
      const order = await markOrderPaidManually(id);
      await touchCatalogVersion();
      revalidatePath("/admin/orders");
      revalidatePath(`/admin/orders/${id}`);
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

  const order = await updateFulfillmentStatus(id, fulfillmentStatus).catch(() => null);
  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  return NextResponse.json({ order });
}
