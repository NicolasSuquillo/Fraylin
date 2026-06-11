"use client";

import { useState } from "react";
import type { Product, Category } from "@/types";
import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/ui/Reveal";
import CategoryTabs from "@/components/products/CategoryTabs";
import ProductCard from "@/components/products/ProductCard";
import ProductSearch from "@/components/products/ProductSearch";

interface ProductosSectionProps {
  products: Product[];
  categories: Category[];
  onProductSelect: (product: Product) => void;
}

export default function ProductosSection({
  products,
  categories,
  onProductSelect,
}: ProductosSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [query, setQuery] = useState("");

  const filtered = products
    .filter((p) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return `${p.name} ${p.description ?? ""}`.toLowerCase().includes(q);
    })
    .filter((p) => selectedCategory === "todos" || p.category === selectedCategory);

  const sortedProducts = [...filtered].sort(
    (a, b) => Number(!!b.featured) - Number(!!a.featured)
  );

  const hasQuery = query.trim().length > 0;

  return (
    <section id="productos" className="py-16 md:py-20 bg-neutral-light">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal delay={0}>
          <SectionHeading
            title="Nuestros Productos"
            subtitle="Selecciona una categoría y encuentra lo que necesitas para tu proyecto"
            className="mb-8 md:mb-10"
          />
        </Reveal>

        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
          <Reveal delay={0.05}>
            <div className="w-full lg:max-w-md lg:shrink-0">
              <ProductSearch
                products={products}
                categories={categories}
                query={query}
                onQueryChange={setQuery}
                onPickProduct={onProductSelect}
              />
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="min-w-0 w-full lg:flex-1 lg:pt-0.5">
              <CategoryTabs
                categories={categories}
                selected={selectedCategory}
                onSelect={setSelectedCategory}
                totalCount={products.length}
              />
            </div>
          </Reveal>
        </div>

        {sortedProducts.length === 0 ? (
          <div className="text-center py-16 text-text-secondary">
            <p className="text-lg">
              {hasQuery
                ? `No encontramos resultados para “${query.trim()}”.`
                : "No hay productos en esta categoría aún."}
            </p>
            <p className="text-sm mt-2">
              {hasQuery
                ? "Prueba con otras palabras o revisa la categoría seleccionada."
                : "Contáctanos para más información."}
            </p>
            {hasQuery && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="mt-4 text-sm font-semibold text-brand-primary hover:underline"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 items-stretch">
            {sortedProducts.map((product, i) => (
              <Reveal key={product.id} delay={i * 0.05}>
                <ProductCard product={product} onSelect={onProductSelect} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
