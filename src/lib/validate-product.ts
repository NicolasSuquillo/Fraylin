import type { Product } from "@/types";

/**
 * Valida el payload de creación/edición de producto recibido del panel admin.
 * Devuelve un mensaje de error legible o null si es válido.
 */
export function validateProductPayload(
  product: Product | null,
  opts: { requireId?: boolean } = {}
): string | null {
  if (!product || typeof product !== "object") return "Cuerpo de la petición inválido";
  if (opts.requireId && !product.id?.trim()) return "Falta el ID del producto";
  if (!product.name?.trim()) return "Falta el nombre del producto";
  if (!product.category?.trim()) return "Falta la categoría del producto";
  if (!Array.isArray(product.images) || product.images.length === 0) {
    return "El producto necesita al menos una imagen";
  }
  if (product.images.some((img) => !img?.src?.trim())) {
    return "Hay imágenes sin archivo subido";
  }
  if (
    product.priceCents != null &&
    (!Number.isInteger(product.priceCents) || product.priceCents < 0)
  ) {
    return "Precio online inválido";
  }
  if (
    product.transferPriceCents != null &&
    (!Number.isInteger(product.transferPriceCents) || product.transferPriceCents < 0)
  ) {
    return "Precio por transferencia inválido";
  }
  if (
    product.installationTransferCents != null &&
    (!Number.isInteger(product.installationTransferCents) ||
      product.installationTransferCents < 0)
  ) {
    return "Precio de instalación por transferencia inválido";
  }
  if (
    product.stock != null &&
    (!Number.isInteger(product.stock) || product.stock < 0)
  ) {
    return "Stock inválido";
  }
  return null;
}
