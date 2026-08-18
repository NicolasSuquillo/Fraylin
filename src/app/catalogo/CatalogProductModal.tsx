"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Truck, Wrench, X } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { formatUSD } from "@/lib/money";
import type { Product } from "@/types";

interface Props {
  product: Product;
  categoryLabel: string;
  onClose: () => void;
}

export default function CatalogProductModal({
  product,
  categoryLabel,
  onClose,
}: Props) {
  const [index, setIndex] = useState(0);
  const images = product.images.length > 0 ? product.images : [];
  const isMulti = images.length > 1;
  const active = images[Math.min(index, images.length - 1)];

  const go = useCallback(
    (next: number) => {
      if (images.length === 0) return;
      setIndex(((next % images.length) + images.length) % images.length);
    },
    [images.length]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (isMulti && e.key === "ArrowLeft") go(index - 1);
      if (isMulti && e.key === "ArrowRight") go(index + 1);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handler);
    };
  }, [onClose, go, index, isMulti]);

  const transfer = product.transferPriceCents ?? null;
  const card = product.priceCents ?? null;
  const soldOut = product.stock === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={product.name}
    >
      <div className="relative flex max-h-[92dvh] w-full max-w-[min(96vw,720px)] min-h-0 flex-col overflow-hidden rounded-t-3xl border border-stone-200 bg-white shadow-2xl sm:rounded-3xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[var(--text-secondary)] shadow-md transition-colors hover:bg-white sm:right-6 sm:top-6"
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {/* Imagen grande arriba */}
          <div className="relative aspect-[4/3] w-full shrink-0 bg-stone-100">
            {active ? (
              <SafeImage
                key={active.src}
                src={active.src}
                alt={active.alt || product.name}
                fill
                className="object-contain"
                sizes="(max-width: 640px) 100vw, 720px"
                priority
              />
            ) : null}

            {soldOut && (
              <span className="absolute left-3 top-3 rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                Agotado
              </span>
            )}

            {isMulti && (
              <>
                <button
                  type="button"
                  onClick={() => go(index - 1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/95 p-2 text-[var(--brand-dark)] shadow-md hover:bg-white"
                  aria-label="Imagen anterior"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => go(index + 1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/95 p-2 text-[var(--brand-dark)] shadow-md hover:bg-white"
                  aria-label="Imagen siguiente"
                >
                  <ChevronRight size={20} />
                </button>
                <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                  {index + 1} / {images.length}
                </span>
              </>
            )}
          </div>

          {isMulti && (
            <div className="flex gap-2 overflow-x-auto px-4 pt-3 sm:px-6">
              {images.map((img, i) => (
                <button
                  key={img.src}
                  type="button"
                  onClick={() => go(i)}
                  className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl transition-all ${
                    i === index
                      ? "ring-2 ring-[var(--brand-primary)] ring-offset-2"
                      : "opacity-60 hover:opacity-100"
                  }`}
                  aria-label={`Ver imagen ${i + 1}`}
                >
                  <SafeImage
                    src={img.src}
                    alt={img.alt}
                    fill
                    className="bg-stone-100 object-contain"
                    sizes="64px"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Información abajo */}
          <div className="space-y-4 p-4 pb-8 sm:p-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--brand-dark)]">
                {categoryLabel}
              </p>
              <h2 className="mt-1 font-[family-name:var(--font-heading)] text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
                {product.name}
              </h2>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-[var(--accent-cream)] p-4">
              {transfer != null || card != null ? (
                <div className="space-y-1">
                  {transfer != null && (
                    <p className="text-xl font-bold text-[var(--text-primary)]">
                      Transferencia / Deuna: {formatUSD(transfer)}
                    </p>
                  )}
                  {card != null && (
                    <p className="text-sm text-[var(--text-secondary)]">
                      Tarjeta: {formatUSD(card)}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-stone-500">Precio a consultar</p>
              )}
            </div>

            {product.description && (
              <div>
                <h3 className="mb-1 text-sm font-semibold text-[var(--text-primary)]">
                  Descripción
                </h3>
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                  {product.description}
                </p>
              </div>
            )}

            {product.specs && (
              <div>
                <h3 className="mb-1 text-sm font-semibold text-[var(--text-primary)]">
                  Medidas y especificaciones
                </h3>
                <p className="whitespace-pre-line rounded-xl bg-stone-50 px-3 py-2.5 text-sm text-stone-600">
                  {product.specs}
                </p>
              </div>
            )}

            {(product.freeShipping ||
              product.freeInstallation ||
              (product.stock != null && product.stock > 0)) && (
              <div className="flex flex-wrap gap-2">
                {product.freeShipping && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                    <Truck className="h-3.5 w-3.5" aria-hidden /> Envío gratis
                  </span>
                )}
                {product.freeInstallation && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
                    <Wrench className="h-3.5 w-3.5" aria-hidden /> Instalación gratis
                  </span>
                )}
                {product.stock != null && product.stock > 0 && (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    Stock: {product.stock}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
