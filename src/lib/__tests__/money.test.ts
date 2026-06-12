import { describe, expect, it } from "vitest";
import { computeTaxBreakdown, formatUSD, parsePriceInput } from "@/lib/money";

describe("formatUSD", () => {
  it("formatea centavos como dólares", () => {
    expect(formatUSD(0)).toBe("$0.00");
    expect(formatUSD(150)).toBe("$1.50");
    expect(formatUSD(123456)).toBe("$1,234.56");
  });
});

describe("parsePriceInput", () => {
  it("convierte dólares a centavos", () => {
    expect(parsePriceInput("10")).toBe(1000);
    expect(parsePriceInput("10.55")).toBe(1055);
    expect(parsePriceInput("10,55")).toBe(1055);
  });

  it("rechaza entradas inválidas", () => {
    expect(parsePriceInput("")).toBeNull();
    expect(parsePriceInput("   ")).toBeNull();
    expect(parsePriceInput("abc")).toBeNull();
    expect(parsePriceInput("-5")).toBeNull();
    expect(parsePriceInput("Infinity")).toBeNull();
  });

  it("redondea a centavo", () => {
    expect(parsePriceInput("0.005")).toBe(1);
    expect(parsePriceInput("1.999")).toBe(200);
  });
});

describe("computeTaxBreakdown", () => {
  it("extrae base e IVA 15% de un total con IVA incluido", () => {
    const { subtotalCents, taxCents } = computeTaxBreakdown(11500);
    expect(subtotalCents).toBe(10000);
    expect(taxCents).toBe(1500);
  });

  it("subtotal + tax siempre suman el total (sin perder centavos)", () => {
    for (const total of [1, 99, 100, 115, 333, 9999, 123457]) {
      const { subtotalCents, taxCents } = computeTaxBreakdown(total);
      expect(subtotalCents + taxCents).toBe(total);
      expect(subtotalCents).toBeGreaterThanOrEqual(0);
      expect(taxCents).toBeGreaterThanOrEqual(0);
    }
  });

  it("maneja cero", () => {
    expect(computeTaxBreakdown(0)).toEqual({ subtotalCents: 0, taxCents: 0 });
  });
});
