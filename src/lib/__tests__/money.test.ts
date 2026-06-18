import { describe, expect, it } from "vitest";
import { computeTaxBreakdown, formatUSD, parsePriceInput, MAX_PRICE_CENTS } from "@/lib/money";

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
    expect(parsePriceInput("1e3")).toBeNull();
    expect(parsePriceInput("12abc")).toBeNull();
  });

  it("acepta como máximo 2 decimales y rechaza más", () => {
    expect(parsePriceInput("0.5")).toBe(50);
    expect(parsePriceInput("1.99")).toBe(199);
    // Sub-centavo / 3+ decimales se rechazan en vez de redondear en silencio.
    expect(parsePriceInput("0.005")).toBeNull();
    expect(parsePriceInput("1.999")).toBeNull();
  });

  it("rechaza la agrupación de miles (antes '1,000' se leía como $1.00)", () => {
    expect(parsePriceInput("1,000")).toBeNull();
    expect(parsePriceInput("1.000.000")).toBeNull();
    expect(parsePriceInput("1,000,000")).toBeNull();
  });

  it("aplica el tope superior", () => {
    expect(parsePriceInput("1000000")).toBe(MAX_PRICE_CENTS);
    expect(parsePriceInput("1000001")).toBeNull();
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
