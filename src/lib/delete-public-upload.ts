import { existsSync, unlinkSync } from "fs";
import { join, relative, resolve } from "path";
import { del } from "@vercel/blob";

const PUBLIC_ROOT = resolve(process.cwd(), "public");
const BLOB_HOST_RE = /^[a-z0-9-]+\.public\.blob\.vercel-storage\.com$/i;

/**
 * Elimina un archivo subido por el admin:
 * - URLs de Vercel Blob -> `del()` del store.
 * - Rutas legacy `/products/*` o `/gallery/*` (estáticas del repo): solo se
 *   borran en dev local; en producción el filesystem es de solo lectura y
 *   esos archivos siguen versionados en git, así que es no-op.
 */
export async function tryDeletePublicUpload(src: string | undefined): Promise<void> {
  if (!src || typeof src !== "string") return;
  const trimmed = src.trim();
  if (!trimmed) return;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      if (BLOB_HOST_RE.test(url.hostname)) {
        await del(trimmed);
      }
    } catch {
      /* URL inválida o error del store: no romper la petición */
    }
    return;
  }

  if (process.env.NODE_ENV === "production") return;
  if (!trimmed.startsWith("/")) return;

  const parts = trimmed
    .slice(1)
    .split(/[/\\]/)
    .filter(Boolean);

  if (parts.some((p) => p === ".." || p === ".")) return;
  const root = parts[0];
  if (root !== "gallery" && root !== "products") return;

  const absolute = resolve(join(PUBLIC_ROOT, ...parts));
  const rel = relative(PUBLIC_ROOT, absolute);
  if (rel.startsWith("..") || rel === "") return;

  if (!existsSync(absolute)) return;
  try {
    unlinkSync(absolute);
  } catch {
    /* archivo bloqueado u otro error: no romper la petición */
  }
}

export async function tryDeletePublicUploads(srcs: Iterable<string>): Promise<void> {
  await Promise.all([...srcs].map((s) => tryDeletePublicUpload(s)));
}
