"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/ui/Reveal";
import ProductCard from "@/components/products/ProductCard";
import type { Product, Category } from "@/types";

interface DestacadosSectionProps {
  products: Product[];
  categories: Category[];
  onSelect: (product: Product) => void;
}

export default function DestacadosSection({
  products,
  categories,
  onSelect,
}: DestacadosSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (products.length === 0) return null;

  const scrollByViewport = (dir: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    const step = Math.max(240, el.clientWidth * 0.55);
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <section
      aria-label="Productos destacados"
      className="py-12 md:py-16 bg-accent-cream border-y border-brand-primary/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            title="Selección destacada"
            subtitle="Productos que recomendamos por su demanda y calidad"
          />
        </Reveal>

        <div className="relative mt-2">
          <button
            type="button"
            onClick={() => scrollByViewport(-1)}
            aria-label="Desplazar destacados hacia la izquierda"
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 h-11 w-11 items-center justify-center rounded-full border border-brand-primary/30 bg-surface-primary text-brand-dark shadow-md hover:bg-brand-primary/10 transition-colors -translate-x-1/2"
          >
            <ChevronLeft className="w-5 h-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => scrollByViewport(1)}
            aria-label="Desplazar destacados hacia la derecha"
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 h-11 w-11 items-center justify-center rounded-full border border-brand-primary/30 bg-surface-primary text-brand-dark shadow-md hover:bg-brand-primary/10 transition-colors translate-x-1/2"
          >
            <ChevronRight className="w-5 h-5" aria-hidden />
          </button>

          <div
            ref={scrollRef}
            className="flex gap-4 md:gap-5 overflow-x-auto overflow-y-hidden pb-2 scroll-smooth snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:thin] md:[scrollbar-gutter:stable_both-edges]"
          >
            {products.map((p) => (
              <div
                key={p.id}
                className="snap-start shrink-0 w-[86%] min-w-0 sm:w-[38%] md:w-[31%] lg:w-[24%]"
              >
                <ProductCard product={p} onSelect={onSelect} categories={categories} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
