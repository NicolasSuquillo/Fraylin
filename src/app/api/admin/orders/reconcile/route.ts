import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/admin-auth";
import {
  cancelStalePendingPayphoneOrders,
  cancelStalePendingTransferOrders,
  reconcileStaleProcessingOrders,
} from "@/lib/orders";
import { touchCatalogVersion } from "@/lib/cache-version";

const STALE_PENDING_MINUTES = 30;
const STALE_PROCESSING_MINUTES = 15;
const STALE_TRANSFER_HOURS = 48;

/**
 * Reconciliación de órdenes colgadas. Gated por sesión admin; puede
 * invocarse manualmente desde el panel o vía un cron autenticado.
 *
 * 1. Payphone `pending` vencidas (nunca se confirmó): `cancelled` — Payphone ya
 *    auto-reversó la retención (sin stock reservado).
 * 2. Transferencia `pending` vencidas (>48h): `cancelled` + stock restaurado.
 * 3. Payphone `processing` vencidas: re-confirmar con Payphone y liquidar.
 */
export async function POST() {
  if (!(await getSession())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const cancelledPayphone = await cancelStalePendingPayphoneOrders(STALE_PENDING_MINUTES);
  const cancelledTransfer = await cancelStalePendingTransferOrders(STALE_TRANSFER_HOURS);
  const processing = await reconcileStaleProcessingOrders(STALE_PROCESSING_MINUTES);

  // Si alguna orden liquidó o restauró stock, invalidar caché del catálogo.
  if (processing.settled > 0 || processing.failed > 0 || cancelledTransfer > 0) {
    await touchCatalogVersion();
    revalidatePath("/");
  }

  return NextResponse.json({
    cancelledPayphone,
    cancelledTransfer,
    processing,
  });
}
