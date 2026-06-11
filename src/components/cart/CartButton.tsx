"use client";

import { ShoppingCart } from "lucide-react";
import { useCart } from "./CartProvider";

export default function CartButton() {
  const { count, open } = useCart();

  return (
    <button
      type="button"
      onClick={open}
      aria-label="Abrir carrito"
      className="relative p-2 rounded-lg text-text-primary hover:bg-brand-primary/10 hover:text-brand-dark transition-colors"
    >
      <ShoppingCart size={22} />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] px-1 flex items-center justify-center bg-brand-primary text-neutral-dark text-[10px] font-bold rounded-full">
          {count}
        </span>
      )}
    </button>
  );
}
