import { existsSync, unlinkSync } from "fs";
import { join, relative, resolve } from "path";

const PUBLIC_ROOT = resolve(process.cwd(), "public");

/**
 * Elimina un archivo subido por el admin si la URL es segura y está bajo
 * `public/gallery/` o `public/products/` (evita borrar rutas arbitrarias).
 */
export function tryDeletePublicUpload(src: string | undefined): void {
  if (!src || typeof src !== "string") return;
  const trimmed = src.trim();
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

export function tryDeletePublicUploads(srcs: Iterable<string>): void {
  for (const s of srcs) {
    tryDeletePublicUpload(s);
  }
}
