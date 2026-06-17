export function formatUSD(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export function parsePriceInput(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const value = Number(trimmed.replace(",", "."));
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

// Comisión Cajita de Pagos de Payphone: 5% + IVA 15% de esa comisión = 5.75%
// del monto bruto cobrado. Expresado en basis points (575 = 5.75%).
export const PAYPHONE_FEE_BPS_DEFAULT = 575;

// Precio con tarjeta para que el comercio reciba `transferCents` netos tras la
// comisión de Payphone. Ej: 1300 / (1 - 0.0575) = 1379.31 → 1379 ($13.79).
export function transferToCardCents(
  transferCents: number,
  feeBps = PAYPHONE_FEE_BPS_DEFAULT
): number {
  if (transferCents <= 0) return transferCents;
  return Math.round(transferCents / (1 - feeBps / 10000));
}

export function computeTaxBreakdown(totalCents: number): {
  subtotalCents: number;
  taxCents: number;
} {
  const subtotalCents = Math.round(totalCents / 1.15);
  const taxCents = totalCents - subtotalCents;
  return { subtotalCents, taxCents };
}
