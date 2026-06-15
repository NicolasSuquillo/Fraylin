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

export interface ShippingZonePrice {
  id: string;
  label: string;
  cents: number;
}

export interface PricingSettings {
  zones: ShippingZonePrice[];
  installationCents: number;
  shippingEnabled: boolean;
  installationEnabled: boolean;
  shippingDescription: string;
  installationDescription: string;
}

export async function getPricingSettings(): Promise<PricingSettings> {
  const row = await db.query.pricingSettings.findFirst({
    where: eq(pricingSettings.id, 1),
  });
  const centsOverrides = (row?.shippingZoneCents as Record<string, number> | null) ?? {};
  const labelOverrides = (row?.shippingZoneLabels as Record<string, string> | null) ?? {};

  return {
    zones: SHIPPING_ZONES.map((zone) => ({
      id: zone.id,
      label: labelOverrides[zone.id] ?? zone.label,
      cents: centsOverrides[zone.id] ?? zone.cents,
    })),
    installationCents: row?.installationCents ?? INSTALLATION_CENTS,
    shippingEnabled: row?.shippingEnabled ?? true,
    installationEnabled: row?.installationEnabled ?? true,
    shippingDescription: row?.shippingDescription ?? SHIPPING_DESCRIPTION_DEFAULT,
    installationDescription: row?.installationDescription ?? INSTALLATION_DESCRIPTION_DEFAULT,
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

export async function updatePricingSettings(input: {
  shippingZoneCents: Record<string, number>;
  shippingZoneLabels: Record<string, string>;
  installationCents: number;
  shippingEnabled: boolean;
  installationEnabled: boolean;
  shippingDescription: string;
  installationDescription: string;
}): Promise<void> {
  await db
    .insert(pricingSettings)
    .values({
      id: 1,
      shippingZoneCents: input.shippingZoneCents,
      shippingZoneLabels: input.shippingZoneLabels,
      installationCents: input.installationCents,
      shippingEnabled: input.shippingEnabled,
      installationEnabled: input.installationEnabled,
      shippingDescription: input.shippingDescription,
      installationDescription: input.installationDescription,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: pricingSettings.id,
      set: {
        shippingZoneCents: input.shippingZoneCents,
        shippingZoneLabels: input.shippingZoneLabels,
        installationCents: input.installationCents,
        shippingEnabled: input.shippingEnabled,
        installationEnabled: input.installationEnabled,
        shippingDescription: input.shippingDescription,
        installationDescription: input.installationDescription,
        updatedAt: new Date(),
      },
    });
}
