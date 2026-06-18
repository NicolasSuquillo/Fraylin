import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session";
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24h

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    // El secreto de dev conocido SOLO se permite en desarrollo local o en tests
    // (NODE_ENV "development"/"test"). Cualquier otro entorno sin SESSION_SECRET
    // (producción, preview/staging https o http) falla cerrado para evitar
    // sesiones forjables con el secreto público.
    if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
      return "fallback_dev_secret";
    }
    throw new Error("SESSION_SECRET es obligatorio fuera de desarrollo");
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export function createSessionToken(): string {
  const expires = Date.now() + SESSION_DURATION_MS;
  const payload = `${expires}`;
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string): boolean {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expires = parseInt(payload, 10);
  if (isNaN(expires) || Date.now() > expires) return false;
  const expected = Buffer.from(sign(payload), "hex");
  let provided: Buffer;
  try {
    provided = Buffer.from(sig, "hex");
  } catch {
    return false;
  }
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(expected, provided);
}

export async function getSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return verifySessionToken(token);
}

export { COOKIE_NAME, SESSION_DURATION_MS };
