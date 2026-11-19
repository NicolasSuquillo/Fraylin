"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { formatUSD } from "@/lib/money";
import { labelForSlug } from "@/components/products/ProductSearch";
import type { Product, Category } from "@/types";

interface ProductCardProps {
  product: Product;
  onSelect?: (product: Product) => void;
  categories?: Category[];
  href?: string;
}

export default function ProductCard({
  product,
  onSelect,
  categories = [],
  href,
}: ProductCardProps) {
  const buyable = product.priceCents != null;
  const soldOut = buyable && product.stock === 0;
  const categoryLabel =
    categories.length > 0 ? labelForSlug(categories, product.category) : null;
  const transferCents = product.transferPriceCents ?? null;
  const cardCents = product.priceCents ?? null;
  const hasDual =
    transferCents != null && cardCents != null && cardCents > transferCents;

  const detailHref = href ?? `/producto/${encodeURIComponent(product.id)}`;

  const cardInner = (
    <>
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F2EFE9]">
        <SafeImage
          src={product.images[0]?.src ?? "/placeholder.svg"}
          alt={product.images[0]?.alt ?? product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw"
        />
        {soldOut && (
          <span className="absolute top-3 left-3 rounded-full bg-[#1F1D1A]/85 px-2.5 py-1 text-[10px] font-semibold tracking-wider text-white uppercase backdrop-blur-sm">
            Agotado
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          {categoryLabel ? (
            <span className="text-[11px] font-semibold tracking-[0.12em] text-[#7A6336] uppercase">
              {categoryLabel}
            </span>
          ) : (
            <span />
          )}
          <ArrowUpRight
            className="size-4 shrink-0 text-[#8C877E] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#1F1D1A]"
            aria-hidden="true"
          />
        </div>

        <h3 className="line-clamp-2 font-sans text-base font-semibold leading-snug text-[#1F1D1A]">
          {product.name}
        </h3>

        {product.specs && (
          <p className="line-clamp-1 text-xs text-[#6E6A63]">
            {product.specs}
          </p>
        )}

        <div className="mt-auto border-t border-[#E6E1D6]/80 pt-3">
          {buyable ? (
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-base font-bold text-[#1F1D1A]">
                {formatUSD(transferCents ?? cardCents!)}
              </span>
              {hasDual && (
                <span className="text-xs text-[#6E6A63]">
                  Tarjeta {formatUSD(cardCents!)}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs font-medium text-[#6E6A63]">
              Consultar disponibilidad y precio
            </span>
          )}
        </div>
      </div>
    </>
  );

  const sharedClassName =
    "group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[#E6E1D6] bg-white text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C9B079] hover:shadow-xl hover:shadow-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9B079]";

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={() => onSelect(product)}
        className={sharedClassName}
      >
        {cardInner}
      </button>
    );
  }

  return (
    <Link href={detailHref} className={sharedClassName}>
      {cardInner}
    </Link>
  );
}
