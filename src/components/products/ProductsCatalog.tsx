"use client";

import { useState } from "react";
import DestacadosSection from "@/components/sections/DestacadosSection";
import ProductosSection from "@/components/sections/ProductosSection";
import ProductModal from "@/components/products/ProductModal";
import type { Product, Category } from "@/types";

interface ProductsCatalogProps {
  products: Product[];
  categories: Category[];
  featuredProducts: Product[];
}

export default function ProductsCatalog({
  products,
  categories,
  featuredProducts,
}: ProductsCatalogProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  return (
    <>
      <DestacadosSection products={featuredProducts} onSelect={setSelectedProduct} />
      <ProductosSection
        products={products}
        categories={categories}
        onProductSelect={setSelectedProduct}
      />
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </>
  );
}
