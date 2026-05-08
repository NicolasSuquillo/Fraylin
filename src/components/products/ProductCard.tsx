"use client";

import { Sparkles } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export default function ProductCard({ product, onSelect }: ProductCardProps) {
  return (
    <button
      onClick={() => onSelect(product)}
      className="group bg-surface-primary rounded-2xl overflow-hidden border border-stone-200 hover:border-brand-primary/50 hover:shadow-[0_12px_40px_-8px_rgba(201,168,76,0.15)] transition-all duration-300 text-left hover:-translate-y-1 w-full"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-light">
        <SafeImage
          src={product.images[0].src}
          alt={product.images[0].alt}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {product.featured && (
          <span className="absolute top-2 left-2 z-[1] inline-flex items-center gap-1 bg-brand-dark text-accent-cream text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full shadow-md border border-white/20">
            <Sparkles className="w-3 h-3 shrink-0" aria-hidden />
            Destacado
          </span>
        )}
        {product.price && (
          <span className="absolute top-2 right-2 bg-brand-primary/20 text-brand-primary text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm border border-brand-primary/30">
            {product.price}
          </span>
        )}
        {product.images.length > 1 && (
          <span className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
            +{product.images.length - 1} fotos
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-semibold text-text-primary group-hover:text-brand-primary transition-colors line-clamp-2">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-xs text-text-secondary mt-1 line-clamp-2">
            {product.description}
          </p>
        )}
        <span className="inline-block mt-2 text-xs text-brand-primary font-semibold">
          Ver detalles →
        </span>
      </div>
    </button>
  );
}
