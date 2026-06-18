/**
 * Detección de tipo de imagen por firma de bytes (magic numbers), no por el
 * Content-Type declarado por el cliente (que es falsificable). Centraliza la
 * lógica usada por las subidas de archivos (admin y endpoints públicos).
 */

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Extensión segura derivada del MIME REAL detectado por bytes. Las subidas usan
// esto en lugar de la extensión del nombre original (controlada por el cliente),
// evitando guardar p. ej. una imagen válida con extensión ".html"/".svg" (polyglot).
const IMAGE_TYPE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export function extensionForImageType(mime: string): string {
  return IMAGE_TYPE_EXTENSIONS[mime] ?? ".jpg";
}

/**
 * Devuelve el MIME real detectado por los primeros bytes del archivo, o null si
 * no corresponde a un formato de imagen permitido.
 */
export function sniffImageType(bytes: Uint8Array): string | null {
  // JPEG: FF D8 FF
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  // GIF: "GIF8"
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38
  ) {
    return "image/gif";
  }
  // WEBP: "RIFF"...."WEBP"
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

/**
 * Lee los primeros bytes de un File y valida que sea una imagen permitida.
 * Devuelve el MIME detectado, o null si no es válida.
 */
export async function detectImageType(file: File): Promise<string | null> {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const detected = sniffImageType(bytes);
  if (!detected || !ALLOWED_IMAGE_TYPES.includes(detected)) return null;
  return detected;
}
