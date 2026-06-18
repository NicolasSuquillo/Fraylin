import type { Product } from "@/types";
import { MAX_PRICE_CENTS } from "@/lib/money";

// Tope superior de stock para atajar errores de tipeo catastróficos.
export const MAX_STOCK = 1_000_000;

/**
 * Valida el payload de creación/edición de producto recibido del panel admin.
 * Devuelve un mensaje de error legible o null si es válido.
 */
export function validateProductPayload(
  product: Product | null,
  opts: { requireId?: boolean } = {}
): string | null {
  if (!product || typeof product !== "object") return "Cuerpo de la petición inválido";
  if (opts.requireId) {
    if (!product.id?.trim()) return "Falta el ID del producto";
    // El form genera IDs en MAYÚSCULAS (ej. "CER-001") y los IDs ya existentes en
    // BD también lo son, así que la validación acepta alfanumérico sin distinguir
    // mayúsculas/minúsculas. Antes solo aceptaba minúsculas → toda alta fallaba.
    if (!/^[A-Za-z0-9]+(-[A-Za-z0-9]+)*$/.test(product.id)) {
      return "ID de producto inválido (usa letras, números y guiones)";
    }
  }
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
    (!Number.isInteger(product.priceCents) ||
      product.priceCents < 0 ||
      product.priceCents > MAX_PRICE_CENTS)
  ) {
    return "Precio online inválido";
  }
  if (
    product.transferPriceCents != null &&
    (!Number.isInteger(product.transferPriceCents) ||
      product.transferPriceCents < 0 ||
      product.transferPriceCents > MAX_PRICE_CENTS)
  ) {
    return "Precio por transferencia inválido";
  }
  // El precio con tarjeta incluye la comisión de Payphone, así que nunca debe ser
  // menor que el de transferencia (rompería la lógica de descuento de ProductCard).
  if (
    product.priceCents != null &&
    product.transferPriceCents != null &&
    product.transferPriceCents > product.priceCents
  ) {
    return "El precio por transferencia no puede superar el precio con tarjeta";
  }
  if (
    product.installationCents != null &&
    (!Number.isInteger(product.installationCents) ||
      product.installationCents < 0 ||
      product.installationCents > MAX_PRICE_CENTS)
  ) {
    return "Precio de instalación inválido";
  }
  if (
    product.installationTransferCents != null &&
    (!Number.isInteger(product.installationTransferCents) ||
      product.installationTransferCents < 0 ||
      product.installationTransferCents > MAX_PRICE_CENTS)
  ) {
    return "Precio de instalación por transferencia inválido";
  }
  if (
    product.installationCents != null &&
    product.installationTransferCents != null &&
    product.installationTransferCents > product.installationCents
  ) {
    return "La instalación por transferencia no puede superar la instalación con tarjeta";
  }
  if (
    product.stock != null &&
    (!Number.isInteger(product.stock) || product.stock < 0 || product.stock > MAX_STOCK)
  ) {
    return "Stock inválido";
  }
  return null;
}
