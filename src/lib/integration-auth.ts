import { timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

/**
 * Valida autenticación máquina-a-máquina entre Fraylin y FraylinPortal
 * mediante `Authorization: Bearer <FRAYLIN_INTEGRATION_SECRET>`.
 */
export function verifyIntegrationAuth(req: NextRequest): boolean {
  const secret = process.env.FRAYLIN_INTEGRATION_SECRET?.trim();
  if (!secret) return false;
  const auth = req.headers.get("authorization") ?? "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (!match) return false;

  const provided = Buffer.from(match[1].trim(), "utf8");
  const expected = Buffer.from(secret, "utf8");
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(provided, expected);
}

