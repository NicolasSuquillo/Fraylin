import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/admin-auth";
import { getPricingSettings, updatePricingSettings } from "@/lib/pricing";
import { SHIPPING_ZONES } from "@/lib/constants";

export async function GET() {
  if (!(await getSession())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return NextResponse.json(await getPricingSettings());
}

export async function PUT(req: NextRequest) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Cuerpo de la petición inválido" }, { status: 400 });
  }

  const {
    zones,
    zonesTransfer,
    zoneLabels,
    installationCents,
    installationTransferCents,
    payphoneFeeBps,
    shippingEnabled,
    installationEnabled,
    shippingDescription,
    installationDescription,
  } = body as {
    zones?: Record<string, number>;
    zonesTransfer?: Record<string, number>;
    zoneLabels?: Record<string, string>;
    installationCents?: number;
    installationTransferCents?: number;
    payphoneFeeBps?: number;
    shippingEnabled?: boolean;
    installationEnabled?: boolean;
    shippingDescription?: string;
    installationDescription?: string;
  };

  if (!zones || typeof zones !== "object") {
    return NextResponse.json({ error: "Faltan los precios de envío" }, { status: 400 });
  }

  if (!zonesTransfer || typeof zonesTransfer !== "object") {
    return NextResponse.json({ error: "Faltan los precios de envío por transferencia" }, { status: 400 });
  }

  if (typeof shippingDescription !== "string" || !shippingDescription.trim()) {
    return NextResponse.json({ error: "Falta el texto de envío" }, { status: 400 });
  }

  if (typeof installationDescription !== "string" || !installationDescription.trim()) {
    return NextResponse.json({ error: "Falta el texto de instalación" }, { status: 400 });
  }

  if (!zoneLabels || typeof zoneLabels !== "object") {
    return NextResponse.json({ error: "Faltan los nombres de las zonas de envío" }, { status: 400 });
  }

  const shippingZoneCents: Record<string, number> = {};
  const shippingZoneTransferCents: Record<string, number> = {};
  const shippingZoneLabels: Record<string, string> = {};
  for (const zone of SHIPPING_ZONES) {
    const cents = zones[zone.id];
    if (!Number.isInteger(cents) || cents < 0) {
      return NextResponse.json({ error: `Precio inválido para ${zone.label}` }, { status: 400 });
    }
    shippingZoneCents[zone.id] = cents;

    const transferCents = zonesTransfer[zone.id];
    if (!Number.isInteger(transferCents) || transferCents < 0) {
      return NextResponse.json({ error: `Precio transferencia inválido para ${zone.label}` }, { status: 400 });
    }
    shippingZoneTransferCents[zone.id] = transferCents;

    const label = zoneLabels[zone.id];
    if (typeof label !== "string" || !label.trim()) {
      return NextResponse.json({ error: `Falta el nombre para "${zone.label}"` }, { status: 400 });
    }
    shippingZoneLabels[zone.id] = label.trim();
  }

  if (!Number.isInteger(installationCents) || installationCents! < 0) {
    return NextResponse.json({ error: "Precio de instalación inválido" }, { status: 400 });
  }

  if (!Number.isInteger(installationTransferCents) || installationTransferCents! < 0) {
    return NextResponse.json({ error: "Precio de instalación por transferencia inválido" }, { status: 400 });
  }

  if (!Number.isInteger(payphoneFeeBps) || payphoneFeeBps! < 0 || payphoneFeeBps! > 10000) {
    return NextResponse.json({ error: "Comisión Payphone inválida" }, { status: 400 });
  }

  await updatePricingSettings({
    shippingZoneCents,
    shippingZoneTransferCents,
    shippingZoneLabels,
    installationCents: installationCents!,
    installationTransferCents: installationTransferCents!,
    payphoneFeeBps: payphoneFeeBps!,
    shippingEnabled: shippingEnabled !== false,
    installationEnabled: installationEnabled !== false,
    shippingDescription: shippingDescription.trim(),
    installationDescription: installationDescription.trim(),
  });
  revalidatePath("/checkout");
  return NextResponse.json({ ok: true });
}
