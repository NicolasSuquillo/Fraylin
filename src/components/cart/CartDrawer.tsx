"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { X, Minus, Plus, Trash2, ShoppingCart, Truck, Wrench } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { formatUSD } from "@/lib/money";
import { useCart } from "./CartProvider";

export default function CartDrawer() {
  const {
    items,
    isOpen,
    close,
    removeItem,
    setQuantity,
    totalCents,
    transferTotalCents,
    allFreeShipping,
    allFreeInstallation,
    freeShippingCount,
    freeInstallationCount,
  } = useCart();

  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef(close);

  useEffect(() => {
    closeRef.current = close;
  }, [close]);

  useEffect(() => {
    if (!isOpen) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    closeBtnRef.current?.focus();

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeRef.current();
        return;
      }
      if (e.key === "Tab" && panelRef.current) {
        const focusables = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>(
            'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handler);
      previousFocusRef.current?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/55 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        className="flex h-full w-full max-w-md flex-col border-l border-[#E6E1D6] bg-white shadow-xl shadow-black/10 animate-slide-in-right"
      >
        <div className="flex items-center justify-between gap-3 border-b border-[#E6E1D6] p-4 sm:p-5">
          <h2
            id="cart-drawer-title"
            className="flex items-center gap-2 text-lg font-bold text-[#1F1D1A]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            <ShoppingCart size={20} className="text-[#7A6336]" aria-hidden="true" />
            Tu carrito
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={close}
            aria-label="Cerrar carrito"
            className="flex size-8 items-center justify-center rounded-full bg-[#F2EFE9] text-[#6E6A63] transition-colors duration-200 hover:bg-[#C9B079]/30 hover:text-[#1F1D1A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9B079]"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4 sm:p-5">
          {items.length === 0 && (
            <div className="my-auto py-10 text-center space-y-3">
              <p className="text-sm text-[#6E6A63]">Tu carrito está vacío.</p>
              <Link
                href="/catalogo"
                onClick={close}
                className="inline-flex items-center justify-center rounded-lg bg-[#C9B079] px-4 py-2 text-sm font-semibold text-[#1F1D1A] transition-colors duration-200 hover:bg-[#D2BD8A]"
              >
                Explorar catálogo
              </Link>
            </div>
          )}

          {items.map((item) => (
            <div
              key={item.productId}
              className="flex gap-3 rounded-xl border border-[#E6E1D6] bg-white p-3"
            >
              <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-[#E6E1D6] bg-[#F2EFE9]">
                <SafeImage
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="line-clamp-2 text-sm font-semibold text-[#1F1D1A]">
                  {item.name}
                </p>
                <p className="text-sm font-bold text-[#7A6336]">
                  {formatUSD(item.transferPriceCents ?? item.priceCents)}
                  {item.transferPriceCents != null && item.priceCents > item.transferPriceCents && (
                    <span className="ml-1.5 text-[11px] font-medium text-[#6E6A63]">
                      tarjeta {formatUSD(item.priceCents)}
                    </span>
                  )}
                </p>
                {(item.freeShipping || item.freeInstallation) && (
                  <div className="mt-0.5 flex flex-wrap gap-1">
                    {item.freeShipping && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                        <Truck size={10} aria-hidden="true" />
                        Envío gratis
                      </span>
                    )}
                    {item.freeInstallation && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                        <Wrench size={10} aria-hidden="true" />
                        Instalación gratis
                      </span>
                    )}
                  </div>
                )}
                <div className="mt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity(item.productId, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    aria-label={`Disminuir cantidad de ${item.name}`}
                    className="flex size-7 items-center justify-center rounded-md border border-[#E2DDD3] text-[#1F1D1A] transition-colors hover:bg-[#F2EFE9] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9B079]"
                  >
                    <Minus size={14} aria-hidden="true" />
                  </button>
                  <span className="w-6 text-center text-sm font-medium text-[#1F1D1A]">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(item.productId, item.quantity + 1)}
                    disabled={item.stock != null && item.quantity >= item.stock}
                    aria-label={`Aumentar cantidad de ${item.name}`}
                    className="flex size-7 items-center justify-center rounded-md border border-[#E2DDD3] text-[#1F1D1A] transition-colors hover:bg-[#F2EFE9] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9B079]"
                  >
                    <Plus size={14} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    aria-label={`Eliminar ${item.name} del carrito`}
                    className="ml-auto flex size-7 items-center justify-center rounded-md text-[#C2352D] transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9B079]"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-[#E6E1D6] bg-[#F4F1EA]/40 p-4 sm:p-5">
            <div className="flex items-center justify-between text-base font-bold text-[#1F1D1A]">
              <span>Subtotal transferencia</span>
              <span className="text-[#7A6336]">{formatUSD(transferTotalCents)}</span>
            </div>
            {totalCents > transferTotalCents && (
              <div className="-mt-1.5 flex items-center justify-between text-xs text-[#6E6A63]">
                <span>Con tarjeta</span>
                <span>{formatUSD(totalCents)}</span>
              </div>
            )}
            {(freeShippingCount > 0 || freeInstallationCount > 0) && (
              <div className="flex flex-col gap-1">
                {allFreeShipping && (
                  <p className="flex items-center gap-1 text-xs font-medium text-emerald-800">
                    <Truck size={11} aria-hidden="true" />
                    Todos los productos incluyen envío gratis
                  </p>
                )}
                {!allFreeShipping && freeShippingCount > 0 && (
                  <p className="flex items-center gap-1 text-xs font-medium text-emerald-800">
                    <Truck size={11} aria-hidden="true" />
                    {freeShippingCount} de {items.length} producto{items.length !== 1 ? "s" : ""} con envío gratis
                  </p>
                )}
                {allFreeInstallation && (
                  <p className="flex items-center gap-1 text-xs font-medium text-emerald-800">
                    <Wrench size={11} aria-hidden="true" />
                    Todos los productos incluyen instalación gratis
                  </p>
                )}
                {!allFreeInstallation && freeInstallationCount > 0 && (
                  <p className="flex items-center gap-1 text-xs font-medium text-emerald-800">
                    <Wrench size={11} aria-hidden="true" />
                    {freeInstallationCount} de {items.length} producto{items.length !== 1 ? "s" : ""} con instalación gratis
                  </p>
                )}
              </div>
            )}
            <p className="text-center text-xs text-[#6E6A63]">
              El envío se coordina al confirmar tu pedido.
            </p>
            <Link
              href="/checkout"
              onClick={close}
              className="w-full rounded-lg bg-[#C9B079] px-4 py-3 text-center text-sm font-semibold text-[#1F1D1A] shadow-xs transition-colors duration-200 hover:bg-[#D2BD8A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9B079]"
            >
              Continuar a cotización / compra
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
