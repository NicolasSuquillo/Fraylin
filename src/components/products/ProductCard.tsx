"use client";

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
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 text-left hover:-translate-y-1 w-full"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <SafeImage
          src={product.images[0].src}
          alt={product.images[0].alt}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {product.price && (
          <span className="absolute top-2 right-2 bg-brand-dark text-accent-cream text-xs font-semibold px-2.5 py-1 rounded-full">
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
        <h3 className="text-sm font-semibold text-neutral-dark group-hover:text-brand-primary transition-colors line-clamp-2">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-xs text-neutral-mid mt-1 line-clamp-2">
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
