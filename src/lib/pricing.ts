import { eq } from "drizzle-orm";
import { db } from "@/db";
import { pricingSettings } from "@/db/schema";
import {
  SHIPPING_ZONES,
  INSTALLATION_CENTS,
  SHIPPING_DESCRIPTION_DEFAULT,
  INSTALLATION_DESCRIPTION_DEFAULT,
  TRANSFER_INSTRUCTIONS_DEFAULT,
} from "@/lib/constants";
import { PAYPHONE_FEE_BPS_DEFAULT } from "@/lib/money";

// Inverso de transferToCardCents: deriva el precio transferencia desde el de
// tarjeta cuando no hay valor transferencia guardado (datos legacy).
function cardToTransferCents(cardCents: number, feeBps: number): number {
  if (cardCents <= 0) return cardCents;
  return Math.round(cardCents * (1 - feeBps / 10000));
}

export interface ShippingZonePrice {
  id: string;
  label: string;
  cents: number;          // precio con tarjeta (incluye comisión Payphone)
  transferCents: number;  // precio con transferencia/Deuna (base)
}

export interface PricingSettings {
  zones: ShippingZonePrice[];
  installationCents: number;         // instalación con tarjeta
  installationTransferCents: number; // instalación con transferencia
  payphoneFeeBps: number;
  shippingEnabled: boolean;
  installationEnabled: boolean;
  shippingDescription: string;
  installationDescription: string;
  comprobanteEnabled: boolean;
  comprobanteShowRuc: boolean;
}

export async function getPricingSettings(): Promise<PricingSettings> {
  const row = await db.query.pricingSettings.findFirst({
    where: eq(pricingSettings.id, 1),
  });
  const centsOverrides = (row?.shippingZoneCents as Record<string, number> | null) ?? {};
  const transferOverrides =
    (row?.shippingZoneTransferCents as Record<string, number> | null) ?? {};
  const labelOverrides = (row?.shippingZoneLabels as Record<string, string> | null) ?? {};
  const feeBps = row?.payphoneFeeBps ?? PAYPHONE_FEE_BPS_DEFAULT;

  return {
    zones: SHIPPING_ZONES.map((zone) => {
      const cents = centsOverrides[zone.id] ?? zone.cents;
      return {
        id: zone.id,
        label: labelOverrides[zone.id] ?? zone.label,
        cents,
        // Si no hay precio transferencia guardado, derivar inverso desde el de tarjeta.
        transferCents: transferOverrides[zone.id] ?? cardToTransferCents(cents, feeBps),
      };
    }),
    installationCents: row?.installationCents ?? INSTALLATION_CENTS,
    installationTransferCents:
      row?.installationTransferCents ??
      cardToTransferCents(row?.installationCents ?? INSTALLATION_CENTS, feeBps),
    payphoneFeeBps: feeBps,
    shippingEnabled: row?.shippingEnabled ?? true,
    installationEnabled: row?.installationEnabled ?? true,
    shippingDescription: row?.shippingDescription ?? SHIPPING_DESCRIPTION_DEFAULT,
    installationDescription: row?.installationDescription ?? INSTALLATION_DESCRIPTION_DEFAULT,
    comprobanteEnabled: row?.comprobanteEnabled ?? true,
    comprobanteShowRuc: row?.comprobanteShowRuc ?? true,
  };
}

export interface TransferSettings {
  enabled: boolean;
  qrImageUrl: string | null;
  bankName: string;
  accountType: string;
  accountNumber: string;
  accountHolder: string;
  accountId: string;
  instructions: string;
}

export async function getTransferSettings(): Promise<TransferSettings> {
  const row = await db.query.pricingSettings.findFirst({
    where: eq(pricingSettings.id, 1),
  });

  return {
    enabled: row?.transferEnabled ?? true,
    qrImageUrl: row?.transferQrImageUrl ?? null,
    bankName: row?.transferBankName ?? "",
    accountType: row?.transferAccountType ?? "",
    accountNumber: row?.transferAccountNumber ?? "",
    accountHolder: row?.transferAccountHolder ?? "",
    accountId: row?.transferAccountId ?? "",
    instructions: row?.transferInstructions ?? TRANSFER_INSTRUCTIONS_DEFAULT,
  };
}

export async function updateTransferSettings(input: TransferSettings): Promise<void> {
  await db
    .insert(pricingSettings)
    .values({
      id: 1,
      transferEnabled: input.enabled,
      transferQrImageUrl: input.qrImageUrl,
      transferBankName: input.bankName,
      transferAccountType: input.accountType,
      transferAccountNumber: input.accountNumber,
      transferAccountHolder: input.accountHolder,
      transferAccountId: input.accountId,
      transferInstructions: input.instructions,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: pricingSettings.id,
      set: {
        transferEnabled: input.enabled,
        transferQrImageUrl: input.qrImageUrl,
        transferBankName: input.bankName,
        transferAccountType: input.accountType,
        transferAccountNumber: input.accountNumber,
        transferAccountHolder: input.accountHolder,
        transferAccountId: input.accountId,
        transferInstructions: input.instructions,
        updatedAt: new Date(),
      },
    });
}

export async function updateComprobanteSettings(input: {
  comprobanteEnabled: boolean;
  comprobanteShowRuc: boolean;
}): Promise<void> {
  await db
    .insert(pricingSettings)
    .values({ id: 1, comprobanteEnabled: input.comprobanteEnabled, comprobanteShowRuc: input.comprobanteShowRuc, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: pricingSettings.id,
      set: { comprobanteEnabled: input.comprobanteEnabled, comprobanteShowRuc: input.comprobanteShowRuc, updatedAt: new Date() },
    });
}

export async function updatePricingSettings(input: {
  shippingZoneCents: Record<string, number>;
  shippingZoneTransferCents: Record<string, number>;
  shippingZoneLabels: Record<string, string>;
  installationCents: number;
  installationTransferCents: number;
  payphoneFeeBps: number;
  shippingEnabled: boolean;
  installationEnabled: boolean;
  shippingDescription: string;
  installationDescription: string;
}): Promise<void> {
  const values = {
    shippingZoneCents: input.shippingZoneCents,
    shippingZoneTransferCents: input.shippingZoneTransferCents,
    shippingZoneLabels: input.shippingZoneLabels,
    installationCents: input.installationCents,
    installationTransferCents: input.installationTransferCents,
    payphoneFeeBps: input.payphoneFeeBps,
    shippingEnabled: input.shippingEnabled,
    installationEnabled: input.installationEnabled,
    shippingDescription: input.shippingDescription,
    installationDescription: input.installationDescription,
    updatedAt: new Date(),
  };
  await db
    .insert(pricingSettings)
    .values({ id: 1, ...values })
    .onConflictDoUpdate({ target: pricingSettings.id, set: values });
}
