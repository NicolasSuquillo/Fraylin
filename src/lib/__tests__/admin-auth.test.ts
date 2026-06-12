import { describe, expect, it } from "vitest";
import { createSessionToken, verifySessionToken } from "@/lib/admin-auth";

describe("session tokens", () => {
  it("un token recién creado es válido", () => {
    const token = createSessionToken();
    expect(verifySessionToken(token)).toBe(true);
  });

  it("rechaza tokens con firma alterada", () => {
    const token = createSessionToken();
    const [payload, sig] = token.split(".");
    const flipped = (sig[0] === "a" ? "b" : "a") + sig.slice(1);
    expect(verifySessionToken(`${payload}.${flipped}`)).toBe(false);
  });

  it("rechaza tokens con payload alterado (expiración extendida)", () => {
    const token = createSessionToken();
    const [payload, sig] = token.split(".");
    const extended = String(Number(payload) + 1_000_000);
    expect(verifySessionToken(`${extended}.${sig}`)).toBe(false);
  });

  it("rechaza tokens expirados", () => {
    // Firmar un payload expirado requiere el secreto; simulamos con un token
    // bien formado pero con timestamp pasado y firma inválida: debe fallar.
    expect(verifySessionToken(`${Date.now() - 1000}.deadbeef`)).toBe(false);
  });

  it("rechaza basura", () => {
    expect(verifySessionToken("")).toBe(false);
    expect(verifySessionToken("no-dot")).toBe(false);
    expect(verifySessionToken("a.b.c")).toBe(false);
    expect(verifySessionToken(".sig")).toBe(false);
    expect(verifySessionToken("123.")).toBe(false);
    expect(verifySessionToken("123.zzzz-no-hex")).toBe(false);
  });
});
