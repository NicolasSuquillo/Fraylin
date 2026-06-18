"use client";

import { Sparkles, Images, Truck, Wrench } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { formatUSD } from "@/lib/money";
import { labelForSlug } from "@/components/products/ProductSearch";
import type { Product, Category } from "@/types";

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  categories?: Category[];
}

export default function ProductCard({ product, onSelect, categories = [] }: ProductCardProps) {
  const buyable = product.priceCents != null;
  const soldOut = buyable && product.stock === 0;
  const lowStock = buyable && product.stock != null && product.stock > 0 && product.stock <= 3;
  const categoryLabel = categories.length > 0 ? labelForSlug(categories, product.category) : null;
  const transferCents = product.transferPriceCents ?? null;
  const cardCents = product.priceCents ?? null;
  const hasDual = transferCents != null && cardCents != null && cardCents > transferCents;
  const discountPct = hasDual ? Math.round((1 - transferCents! / cardCents!) * 100) : 0;

  return (
    <button
      type="button"
      onClick={() => onSelect(product)}
      className="group relative flex h-full min-h-0 w-full aspect-[3/4] flex-col rounded-2xl overflow-hidden border border-stone-200 hover:border-brand-primary/50 hover:shadow-[0_12px_40px_-8px_rgba(201,168,76,0.15)] transition-all duration-300 text-left hover:-translate-y-1 bg-neutral-light"
    >
      <SafeImage
        src={product.images[0]?.src ?? "/placeholder.svg"}
        alt={product.images[0]?.alt ?? product.name}
        fill
        className="object-cover z-0 group-hover:scale-105 transition-transform duration-500"
        sizes="(max-width: 419px) 100vw, (max-width: 767px) 50vw, (max-width: 1279px) 33vw, 25vw"
      />

      {product.featured && (
        <span className="absolute top-2 left-2 z-[1] inline-flex items-center gap-1 bg-brand-dark text-accent-cream text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full shadow-md border border-white/20">
          <Sparkles className="w-3 h-3 shrink-0" aria-hidden />
          Destacado
        </span>
      )}

      <div className="absolute top-2 right-2 z-[1] flex flex-col items-end gap-1.5">
        {buyable && (
          <span className="inline-flex flex-col items-end rounded-xl bg-white/95 px-3 py-1 shadow-[0_2px_10px_rgba(0,0,0,0.22)] ring-1 ring-black/10 backdrop-blur-sm">
            <span className="text-sm font-bold text-text-primary leading-tight">
              {formatUSD(transferCents ?? cardCents!)}
            </span>
            {hasDual && (
              <span className="text-[10px] font-medium text-text-secondary leading-tight">
                tarjeta <span className="line-through">{formatUSD(cardCents!)}</span>
              </span>
            )}
          </span>
        )}
        {hasDual && discountPct > 0 && (
          <span className="inline-flex items-center rounded-full bg-emerald-500/95 text-white text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 shadow-md">
            −{discountPct}% transf.
          </span>
        )}
        {product.images.length > 1 && (
          <span className="inline-flex items-center gap-1 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
            <Images className="w-3 h-3 shrink-0" aria-hidden />
            {product.images.length}
          </span>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 z-[1] bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 sm:p-4 pt-12">
        <div className="flex flex-wrap items-center gap-1.5 mb-1">
          {categoryLabel && (
            <span className="inline-flex items-center rounded-full bg-white/15 text-accent-cream text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 backdrop-blur-sm">
              {categoryLabel}
            </span>
          )}
          {lowStock && (
            <span className="inline-flex items-center rounded-full bg-brand-primary/90 text-brand-dark text-[10px] font-bold uppercase tracking-wide px-2 py-0.5">
              ¡Últimas {product.stock}!
            </span>
          )}
          {buyable && product.freeShipping && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 text-white text-[10px] font-bold uppercase tracking-wide px-2 py-0.5">
              <Truck className="w-2.5 h-2.5 shrink-0" aria-hidden />
              Envío gratis
            </span>
          )}
          {buyable && product.freeInstallation && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 text-white text-[10px] font-bold uppercase tracking-wide px-2 py-0.5">
              <Wrench className="w-2.5 h-2.5 shrink-0" aria-hidden />
              Instalación gratis
            </span>
          )}
        </div>
        <h3 className="text-sm sm:text-base font-semibold text-white line-clamp-2">
          {product.name}
        </h3>
      </div>

      {soldOut && (
        <div className="absolute inset-0 z-[2] bg-black/50 flex items-center justify-center">
          <span className="bg-white/90 text-text-primary text-sm font-bold uppercase tracking-wide px-4 py-2 rounded-full">
            Agotado
          </span>
        </div>
      )}
    </button>
  );
}
