export function normalizeExternalUrl(raw?: string | null): string | null {
  const cleaned = raw?.trim().replace(/^["']|["']$/g, "").trim();
  if (!cleaned) return null;

  try {
    const hasScheme = /^https?:\/\//i.test(cleaned);
    const withScheme = hasScheme
      ? cleaned
      : (() => {
          const bare = cleaned.replace(/^\/\//, "");
          const hostname = (bare.split("/")[0] ?? "").replace(/:\d+$/, "");
          const isLocal =
            /^(localhost|127\.0\.0\.1|\[::1\])$/i.test(hostname) ||
            hostname.toLowerCase().endsWith(".localhost");
          return `${isLocal ? "http" : "https"}://${bare}`;
        })();

    return new URL(withScheme).href.replace(/\/+$/, "");
  } catch {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[site] URL externa inválida:", raw);
    }
    return null;
  }
}

export function buildPortalUrl(path = ""): string | null {
  const base = normalizeExternalUrl(process.env.NEXT_PUBLIC_PORTAL_URL);
  if (!base) return null;
  const cleanPath = path.replace(/^\/+/, "");
  if (!cleanPath) return base;
  try {
    return new URL(cleanPath, `${base}/`).href.replace(/\/+$/, "");
  } catch {
    return null;
  }
}

export const SITE_URL =
  normalizeExternalUrl(process.env.NEXT_PUBLIC_SITE_URL) ??
  "https://fraylinacabados.com";
export const SITE_NAME = "Fraylin";
export const SITE_TITLE =
  "Fraylin | Acabados para la Construcción en Quito, Ecuador";
export const SITE_DESCRIPTION =
  "Fraylin — tienda de acabados para la construcción en Quito. Cerámica, porcelanato, grifería, muebles de baño y piedra decorativa. Asesoría e instalación a domicilio.";
