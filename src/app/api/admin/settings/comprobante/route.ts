import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/admin-auth";
import { getPricingSettings, updateComprobanteSettings } from "@/lib/pricing";

export async function GET() {
  if (!(await getSession())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const settings = await getPricingSettings();
  return NextResponse.json({
    comprobanteEnabled: settings.comprobanteEnabled,
    comprobanteShowRuc: settings.comprobanteShowRuc,
  });
}

export async function PUT(req: NextRequest) {
  if (!(await getSession())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }
  await updateComprobanteSettings({
    comprobanteEnabled: body.comprobanteEnabled !== false,
    comprobanteShowRuc: body.comprobanteShowRuc !== false,
  });
  return NextResponse.json({ ok: true });
}
