import { NextRequest, NextResponse } from "next/server";
import { getPublicOrderTracking } from "@/lib/orders";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const RATE_LIMIT_MAX = 40;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  if (!checkRateLimit(`tracking:${getClientIp(req)}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Demasiadas consultas seguidas. Intenta de nuevo en unos minutos." },
      { status: 429 }
    );
  }

  const { code } = await params;
  const normalized = code.trim().toUpperCase();
  if (!/^FR[A-Z0-9]{6,32}$/.test(normalized)) {
    return NextResponse.json({ error: "Código de pedido inválido" }, { status: 400 });
  }

  const tracking = await getPublicOrderTracking(normalized);
  if (!tracking) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ tracking });
}

