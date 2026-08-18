"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search, X, FileDown, Truck, Wrench, Package,
} from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { formatUSD } from "@/lib/money";
import { BUSINESS } from "@/lib/constants";
import CatalogProductModal from "./CatalogProductModal";
import type { Product, Category } from "@/types";

interface Props {
  products: Product[];
  categories: Category[];
  initialCategory?: string;
}

export default function CatalogClient({
  products,
  categories,
  initialCategory = "",
}: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [selected, setSelected] = useState<Product | null>(null);

  const categoryLabel = (slug: string) =>
    categories.find((c) => c.slug === slug)?.label ?? slug;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (category && p.category !== category) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q) ||
        (p.specs ?? "").toLowerCase().includes(q) ||
        categoryLabel(p.category).toLowerCase().includes(q)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, categories, query, category]);

  const pdfHref = category
    ? `/api/catalogo/pdf?category=${encodeURIComponent(category)}`
    : "/api/catalogo/pdf";

  return (
    <div className="min-h-dvh bg-[var(--accent-cream)]">
      <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-[var(--accent-cream)]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--brand-dark)]">
              {BUSINESS.name}
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              Catálogo · {BUSINESS.tagline}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={pdfHref}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--brand-dark)]"
            >
              <FileDown className="h-4 w-4" aria-hidden />
              {category ? "PDF de esta categoría" : "Descargar PDF"}
            </a>
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-medium text-[var(--text-primary)] hover:bg-stone-50"
            >
              Ir a la web
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar producto…"
              className="w-full min-h-[44px] rounded-xl border border-stone-200 bg-white pl-9 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                aria-label="Limpiar"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="min-h-[44px] rounded-xl border border-stone-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <p className="mb-4 text-sm text-[var(--text-secondary)]">
          {filtered.length} producto{filtered.length === 1 ? "" : "s"}
        </p>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white py-16 text-center">
            <Package className="mx-auto mb-3 h-10 w-10 text-stone-300" />
            <p className="text-sm font-medium text-stone-500">
              No hay productos en este catálogo
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((product) => {
              const transfer = product.transferPriceCents;
              const card = product.priceCents;
              const soldOut = product.stock === 0;
              return (
                <li key={product.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(product)}
                    className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-[var(--brand-primary)]/50 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
                  >
                    <div className="relative aspect-[4/3] w-full bg-stone-100">
                      <SafeImage
                        src={product.images[0]?.src ?? "/placeholder.svg"}
                        alt={product.images[0]?.alt ?? product.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      {soldOut && (
                        <span className="absolute left-2 top-2 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                          Agotado
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--brand-dark)]">
                        {categoryLabel(product.category)}
                      </p>
                      <h2 className="font-[family-name:var(--font-heading)] text-lg font-bold text-[var(--text-primary)]">
                        {product.name}
                      </h2>
                      {product.description && (
                        <p className="line-clamp-2 text-sm text-[var(--text-secondary)]">
                          {product.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1.5">
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
                      </div>
                      <div className="mt-auto border-t border-stone-100 pt-3">
                        {transfer != null || card != null ? (
                          <div className="space-y-1">
                            {transfer != null && (
                              <p className="text-base font-bold text-[var(--text-primary)]">
                                Transferencia / Deuna: {formatUSD(transfer)}
                              </p>
                            )}
                            {card != null && (
                              <p className="text-sm text-[var(--text-secondary)]">
                                Tarjeta: {formatUSD(card)}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-stone-400">Precio a consultar</p>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <footer className="border-t border-stone-200 py-8 text-center text-xs text-[var(--text-secondary)]">
        <p>{BUSINESS.name} · {BUSINESS.address}</p>
        <p className="mt-1">{BUSINESS.phones.join(" · ")}</p>
      </footer>

      {selected && (
        <CatalogProductModal
          product={selected}
          categoryLabel={categoryLabel(selected.category)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
