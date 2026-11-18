import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/admin-auth";
import { touchCatalogVersion } from "@/lib/cache-version";
import {
  OrderActionError,
  StockUnavailableError,
  createManualAdminOrder,
  getOrders,
  type CreateManualOrderInput,
} from "@/lib/orders";

export async function GET() {
  if (!(await getSession())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const orders = await getOrders();
  return NextResponse.json({ orders });
}

export async function POST(req: NextRequest) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: CreateManualOrderInput;
  try {
    const raw = await req.json();
    if (!raw || typeof raw !== "object") {
      return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
    }
    body = raw as CreateManualOrderInput;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  try {
    const order = await createManualAdminOrder(body);
    await touchCatalogVersion();
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${order.id}`);
    revalidatePath(`/seguimiento/${order.clientTransactionId}`);
    revalidatePath("/");

    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    if (err instanceof StockUnavailableError) {
      return NextResponse.json(
        { error: "Stock insuficiente para uno o más productos seleccionados." },
        { status: 400 }
      );
    }
    if (err instanceof OrderActionError) {
      const status = err.code === "not_found" ? 404 : 400;
      return NextResponse.json({ error: err.message }, { status });
    }
    console.error("[admin/orders POST] error:", err);
    return NextResponse.json({ error: "No se pudo crear el pedido." }, { status: 500 });
  }
}
