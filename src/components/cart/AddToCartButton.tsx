"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useCart } from "./CartProvider";
import type { Product } from "@/types";

interface AddToCartButtonProps {
  product: Product;
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const stock = product.stock ?? null;
  const soldOut = stock === 0;
  const maxQty = stock != null ? stock : Infinity;

  if (soldOut) {
    return (
      <div className="w-full text-center px-4 py-3 bg-stone-100 text-text-secondary font-semibold rounded-lg">
        Agotado
      </div>
    );
  }

  const handleAdd = () => {
    addItem(
      {
        productId: product.id,
        name: product.name,
        priceCents: product.priceCents!,
        image: product.images[0]?.src ?? "",
        stock: product.stock,
      },
      qty
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center border border-stone-200 rounded-lg">
        <button
          type="button"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          disabled={qty <= 1}
          aria-label="Disminuir cantidad"
          className="w-9 h-10 flex items-center justify-center hover:bg-brand-primary/10 disabled:opacity-40 transition-colors"
        >
          <Minus size={14} />
        </button>
        <span className="w-8 text-center text-sm font-medium">{qty}</span>
        <button
          type="button"
          onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
          disabled={qty >= maxQty}
          aria-label="Aumentar cantidad"
          className="w-9 h-10 flex items-center justify-center hover:bg-brand-primary/10 disabled:opacity-40 transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>
      <button
        type="button"
        onClick={handleAdd}
        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-primary text-neutral-dark hover:bg-brand-dark hover:text-accent-cream font-semibold rounded-lg transition-colors"
      >
        <ShoppingCart size={16} />
        {added ? "¡Agregado!" : "Agregar al carrito"}
      </button>
    </div>
  );
}
