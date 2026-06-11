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

export function computeTaxBreakdown(totalCents: number): {
  subtotalCents: number;
  taxCents: number;
} {
  const subtotalCents = Math.round(totalCents / 1.15);
  const taxCents = totalCents - subtotalCents;
  return { subtotalCents, taxCents };
}
