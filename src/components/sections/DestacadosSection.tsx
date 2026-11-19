import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";
import type { Product, Category } from "@/types";

interface DestacadosSectionProps {
  products: Product[];
  categories: Category[];
  onSelect?: (product: Product) => void;
}

export default function DestacadosSection({
  products,
  categories,
  onSelect,
}: DestacadosSectionProps) {
  if (products.length === 0) return null;

  return (
    <section id="destacados" className="relative z-10 py-14 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-bold tracking-[0.16em] text-[#7A6336] uppercase">
              Selección Editorial
            </p>
            <h2
              className="text-3xl font-bold tracking-tight text-[#1F1D1A] sm:text-4xl"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Destacados de Fraylin Acabados
            </h2>
            <p className="text-sm text-[#6E6A63] sm:text-base">
              Piezas seleccionadas por su formato, resistencia y acabado arquitectónico.
            </p>
          </div>
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E6E1D6] bg-white px-4 py-2.5 text-sm font-semibold text-[#1F1D1A] transition-colors duration-200 hover:border-[#C9B079] hover:bg-[#F2EFE9]"
          >
            <span>Ir al catálogo</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.slice(0, 8).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              categories={categories}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
