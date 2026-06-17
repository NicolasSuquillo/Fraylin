"use client";

import { useEffect } from "react";
import Link from "next/link";
import { X, Minus, Plus, Trash2, ShoppingCart, Truck, Wrench } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { formatUSD } from "@/lib/money";
import { useCart } from "./CartProvider";

export default function CartDrawer() {
  const { items, isOpen, close, removeItem, setQuantity, totalCents, allFreeShipping, allFreeInstallation, freeShippingCount, freeInstallationCount } = useCart();

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handler);
    };
  }, [isOpen, close]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="w-full max-w-md h-full bg-surface-primary shadow-2xl flex flex-col animate-slide-in-right">
        <div className="flex items-center justify-between gap-3 p-4 border-b border-stone-100">
          <h2
            className="text-lg font-bold text-text-primary flex items-center gap-2"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            <ShoppingCart size={20} className="text-brand-primary" />
            Tu carrito
          </h2>
          <button
            onClick={close}
            aria-label="Cerrar carrito"
            className="w-8 h-8 bg-stone-100 hover:bg-brand-primary/20 text-text-secondary rounded-full flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {items.length === 0 && (
            <p className="text-sm text-text-secondary text-center mt-10">
              Tu carrito está vacío.
            </p>
          )}

          {items.map((item) => (
            <div
              key={item.productId}
              className="flex gap-3 border border-stone-200 rounded-xl p-3"
            >
              <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-neutral-light">
                <SafeImage
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <p className="text-sm font-semibold text-text-primary line-clamp-2">
                  {item.name}
                </p>
                <p className="text-sm text-brand-primary font-bold">
                  {formatUSD(item.priceCents)}
                </p>
                {(item.freeShipping || item.freeInstallation) && (
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {item.freeShipping && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 rounded-full px-1.5 py-0.5">
                        <Truck size={10} aria-hidden />
                        Envío gratis
                      </span>
                    )}
                    {item.freeInstallation && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 rounded-full px-1.5 py-0.5">
                        <Wrench size={10} aria-hidden />
                        Instalación gratis
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => setQuantity(item.productId, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    aria-label="Disminuir cantidad"
                    className="w-7 h-7 flex items-center justify-center rounded-md border border-stone-200 hover:bg-brand-primary/10 disabled:opacity-40 transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="text-sm font-medium w-6 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(item.productId, item.quantity + 1)}
                    disabled={item.stock != null && item.quantity >= item.stock}
                    aria-label="Aumentar cantidad"
                    className="w-7 h-7 flex items-center justify-center rounded-md border border-stone-200 hover:bg-brand-primary/10 disabled:opacity-40 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    onClick={() => removeItem(item.productId)}
                    aria-label="Eliminar del carrito"
                    className="ml-auto w-7 h-7 flex items-center justify-center rounded-md text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div className="border-t border-stone-100 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between text-base font-bold text-text-primary">
              <span>Total</span>
              <span className="text-brand-primary">{formatUSD(totalCents)}</span>
            </div>
            {(freeShippingCount > 0 || freeInstallationCount > 0) && (
              <div className="flex flex-col gap-1">
                {allFreeShipping && (
                  <p className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                    <Truck size={11} aria-hidden />
                    Todos los productos incluyen envío gratis
                  </p>
                )}
                {!allFreeShipping && freeShippingCount > 0 && (
                  <p className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                    <Truck size={11} aria-hidden />
                    {freeShippingCount} de {items.length} producto{items.length !== 1 ? "s" : ""} con envío gratis
                  </p>
                )}
                {allFreeInstallation && (
                  <p className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                    <Wrench size={11} aria-hidden />
                    Todos los productos incluyen instalación gratis
                  </p>
                )}
                {!allFreeInstallation && freeInstallationCount > 0 && (
                  <p className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                    <Wrench size={11} aria-hidden />
                    {freeInstallationCount} de {items.length} producto{items.length !== 1 ? "s" : ""} con instalación gratis
                  </p>
                )}
              </div>
            )}
            <p className="text-xs text-text-secondary text-center">
              El envío se coordina por WhatsApp luego del pago.
            </p>
            <Link
              href="/checkout"
              onClick={close}
              className="w-full text-center px-4 py-3 bg-brand-primary text-neutral-dark hover:bg-brand-dark hover:text-accent-cream font-semibold rounded-lg transition-colors"
            >
              Finalizar compra
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
