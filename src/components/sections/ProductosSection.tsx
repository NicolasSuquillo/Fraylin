"use client";

import { useState } from "react";
import type { Product, Category } from "@/types";
import SectionHeading from "@/components/ui/SectionHeading";
import CategoryTabs from "@/components/products/CategoryTabs";
import ProductCard from "@/components/products/ProductCard";
import ProductModal from "@/components/products/ProductModal";

interface ProductosSectionProps {
  products: Product[];
  categories: Category[];
}

export default function ProductosSection({
  products,
  categories,
}: ProductosSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const filtered =
    selectedCategory === "todos"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  return (
    <section id="productos" className="py-20 bg-neutral-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Nuestros Productos"
          subtitle="Selecciona una categoría y encuentra lo que necesitas para tu proyecto"
        />

        <div className="mb-8">
          <CategoryTabs
            categories={categories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
            totalCount={products.length}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-neutral-mid">
            <p className="text-lg">No hay productos en esta categoría aún.</p>
            <p className="text-sm mt-2">Contáctanos para más información.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={setSelectedProduct}
              />
            ))}
          </div>
        )}
      </div>

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </section>
  );
}
