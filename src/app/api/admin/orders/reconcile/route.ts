import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/admin-auth";
import {
  cancelStalePendingPayphoneOrders,
  reconcileStaleProcessingOrders,
} from "@/lib/orders";
import { touchCatalogVersion } from "@/lib/cache-version";

const STALE_PENDING_MINUTES = 30;
const STALE_PROCESSING_MINUTES = 15;

/**
 * Reconciliación de órdenes Payphone colgadas. Gated por sesión admin; puede
 * invocarse manualmente desde el panel o vía un cron autenticado.
 *
 * 1. `pending` vencidas (nunca se confirmó): se marcan `cancelled` — Payphone ya
 *    auto-reversó la retención.
 * 2. `processing` vencidas (cayó el proceso entre Confirm y la transición final):
 *    se re-confirma con Payphone y se liquidan (`paid` o `failed`), recuperando el
 *    stock reservado cuando corresponde.
 */
export async function POST() {
  if (!(await getSession())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const cancelled = await cancelStalePendingPayphoneOrders(STALE_PENDING_MINUTES);
  const processing = await reconcileStaleProcessingOrders(STALE_PROCESSING_MINUTES);

  // Si alguna processing se liquidó (paid/failed), el stock cambió → invalidar caché.
  if (processing.settled > 0 || processing.failed > 0) {
    await touchCatalogVersion();
    revalidatePath("/");
  }

  return NextResponse.json({ cancelled, processing });
}
