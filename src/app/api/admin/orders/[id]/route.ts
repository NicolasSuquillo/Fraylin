import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/admin-auth";
import {
  FULFILLMENT_STATUSES,
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
    const order = await markOrderPaidManually(id).catch(() => null);
    if (!order) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }
    await touchCatalogVersion();
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${id}`);
    revalidatePath("/");
    return NextResponse.json({ order });
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
