import type { NextRequest } from "next/server";
import { getSession } from "@/lib/admin-auth";
import { getOrderById } from "@/lib/orders";
import { getPricingSettings } from "@/lib/pricing";
import { buildComprobanteBuffer } from "@/lib/pdf/comprobante";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  if (!(await getSession())) return new Response(null, { status: 401 });

  const { id } = await params;
  const order = await getOrderById(id);
  if (!order || order.status !== "paid") return new Response(null, { status: 404 });

  try {
    const { comprobanteShowRuc } = await getPricingSettings();
    const buffer = await buildComprobanteBuffer(order, { showRuc: comprobanteShowRuc });
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="comprobante-${order.clientTransactionId}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("Error generando comprobante:", err);
    return new Response(null, { status: 500 });
  }
}
