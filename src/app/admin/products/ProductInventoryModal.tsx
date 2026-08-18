"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen, ChevronLeft, ChevronRight, Globe, NotebookPen,
  Package, Pencil, Ruler, Star, Truck, Wrench, X,
} from "lucide-react";
import { formatUSD } from "@/lib/money";
import type { Product } from "@/types";

interface Props {
  product: Product;
  categoryLabel: string;
  onClose: () => void;
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-gray-100 py-2.5 last:border-b-0">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <span className="text-right text-sm text-gray-800">{children}</span>
    </div>
  );
}

function VisibilityPill({
  on,
  label,
  icon: Icon,
}: {
  on: boolean;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        on
          ? "bg-emerald-50 text-emerald-700"
          : "bg-gray-100 text-gray-500"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}: {on ? "sí" : "no"}
    </span>
  );
}

export default function ProductInventoryModal({
  product,
  categoryLabel,
  onClose,
}: Props) {
  const [index, setIndex] = useState(0);
  const images = product.images.filter((img) => img.src?.trim());
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
  const cost = product.costCents ?? null;
  const margin = cost != null && transfer != null ? transfer - cost : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={product.name}
    >
      <div className="relative flex max-h-[92dvh] min-h-0 w-full max-w-[min(96vw,640px)] flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-md transition-colors hover:bg-white"
          aria-label="Cerrar"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {/* Imagen grande arriba */}
          <div className="relative aspect-[4/3] w-full bg-gray-100">
            {active ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={active.src}
                alt={active.alt || product.name}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Package className="h-10 w-10 text-gray-300" aria-hidden />
              </div>
            )}

            {product.stock === 0 && (
              <span className="absolute left-3 top-3 rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                Agotado
              </span>
            )}

            {isMulti && (
              <>
                <button
                  type="button"
                  onClick={() => go(index - 1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/95 p-2 text-gray-700 shadow-md hover:bg-white"
                  aria-label="Imagen anterior"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => go(index + 1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/95 p-2 text-gray-700 shadow-md hover:bg-white"
                  aria-label="Imagen siguiente"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white">
                  {index + 1} / {images.length}
                </span>
              </>
            )}
          </div>

          {/* Información de inventario */}
          <div className="space-y-4 p-4 pb-6 sm:p-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                  {categoryLabel}
                </span>
                {product.featured && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold uppercase text-amber-800">
                    <Star className="h-3 w-3 fill-current" /> Destacado
                  </span>
                )}
              </div>
              <h2 className="mt-2 text-xl font-bold leading-snug text-gray-900">
                {product.name}
              </h2>
              <p className="mt-0.5 font-mono text-xs text-gray-400">{product.id}</p>
            </div>

            {/* Precios */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
              {transfer != null || card != null ? (
                <div className="space-y-0.5">
                  {transfer != null && (
                    <p className="text-2xl font-bold text-emerald-600">
                      {formatUSD(transfer)}
                      <span className="ml-2 text-xs font-semibold uppercase tracking-wide text-emerald-700/80">
                        transferencia
                      </span>
                    </p>
                  )}
                  {card != null && (
                    <p className="text-sm text-gray-500">
                      {formatUSD(card)} con tarjeta
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Sin precio online — se cotiza por WhatsApp
                </p>
              )}
            </div>

            {/* Visibilidad */}
            <div className="flex flex-wrap gap-2">
              <VisibilityPill
                on={product.showOnWeb !== false}
                label="Web"
                icon={Globe}
              />
              <VisibilityPill
                on={product.showInCatalog !== false}
                label="Catálogo"
                icon={BookOpen}
              />
            </div>

            {/* Datos de inventario */}
            <div className="rounded-2xl border border-gray-100 px-4">
              <Row label="Stock">
                {product.stock == null ? (
                  <span className="text-gray-400">Sin control</span>
                ) : product.stock === 0 ? (
                  <span className="font-semibold text-red-600">Agotado</span>
                ) : (
                  <span className="font-semibold">{product.stock} unidades</span>
                )}
              </Row>
              <Row label="Costo de compra">
                {cost != null ? formatUSD(cost) : <span className="text-gray-400">—</span>}
              </Row>
              <Row label="Margen (vs transferencia)">
                {margin != null ? (
                  <span
                    className={
                      margin >= 0
                        ? "font-semibold text-emerald-600"
                        : "font-semibold text-red-600"
                    }
                  >
                    {formatUSD(margin)}
                  </span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </Row>
              <Row label="Envío / instalación">
                <span className="inline-flex flex-wrap justify-end gap-1.5">
                  {product.freeShipping && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700">
                      <Truck className="h-3 w-3" /> Envío gratis
                    </span>
                  )}
                  {product.freeInstallation && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">
                      <Wrench className="h-3 w-3" /> Instalación gratis
                    </span>
                  )}
                  {!product.freeShipping && !product.freeInstallation && (
                    <span className="text-gray-400">Estándar</span>
                  )}
                </span>
              </Row>
              <Row label="Imágenes">{images.length}</Row>
            </div>

            {product.description && (
              <div>
                <h3 className="mb-1 text-sm font-semibold text-gray-800">
                  Descripción
                </h3>
                <p className="text-sm leading-relaxed text-gray-600">
                  {product.description}
                </p>
              </div>
            )}

            {product.specs && (
              <div>
                <h3 className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                  <Ruler className="h-3.5 w-3.5 text-gray-400" aria-hidden />
                  Medidas y especificaciones
                </h3>
                <p className="whitespace-pre-line rounded-xl bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
                  {product.specs}
                </p>
              </div>
            )}

            {product.internalNotes && (
              <div>
                <h3 className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                  <NotebookPen className="h-3.5 w-3.5 text-gray-400" aria-hidden />
                  Notas internas
                </h3>
                <p className="whitespace-pre-line rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
                  {product.internalNotes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-2 border-t border-gray-100 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cerrar
          </button>
          <Link
            href={`/admin/products/${product.id}/edit`}
            className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 text-sm font-semibold text-white hover:bg-amber-700"
          >
            <Pencil className="h-4 w-4" aria-hidden />
            Editar producto
          </Link>
        </div>
      </div>
    </div>
  );
}
