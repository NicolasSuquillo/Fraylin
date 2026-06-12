"use client";

import { useEffect, useRef } from "react";
import type { Product } from "@/types";
import { useCart } from "./CartProvider";

/**
 * Publica el catálogo vigente (renderizado en el servidor) al CartProvider
 * para reconciliar precio/stock/nombre de los ítems guardados en localStorage.
 */
export default function CartSync({ products }: { products: Product[] }) {
  const { syncProducts } = useCart();
  // El array llega con referencia nueva en cada render del servidor; comparar
  // por firma evita reconciliar el carrito cuando el catálogo no cambió.
  const lastSignature = useRef<string>("");

  useEffect(() => {
    const signature = products
      .map((p) => [p.id, p.priceCents, p.stock, p.name, p.images[0]].join(":"))
      .join("|");
    if (signature === lastSignature.current) return;
    lastSignature.current = signature;
    syncProducts(products);
  }, [products, syncProducts]);

  return null;
}
