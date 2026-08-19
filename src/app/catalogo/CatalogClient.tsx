"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search, X, FileDown, Truck, Wrench, Package, Loader2, AlertTriangle,
} from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { formatUSD } from "@/lib/money";
import { BUSINESS } from "@/lib/constants";
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
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState("");

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

  async function downloadPdf() {
    setPdfBusy(true);
    setPdfError("");
    try {
      const res = await fetch(pdfHref, { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = category
        ? `catalogo-fraylin-${category}.pdf`
        : "catalogo-fraylin.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch {
      setPdfError("No se pudo generar el PDF. Intenta de nuevo en un momento.");
    } finally {
      setPdfBusy(false);
    }
  }

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
            <button
              type="button"
              onClick={() => void downloadPdf()}
              disabled={pdfBusy}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--brand-dark)] disabled:opacity-70"
            >
              {pdfBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <FileDown className="h-4 w-4" aria-hidden />
              )}
              {pdfBusy
                ? "Generando PDF…"
                : category
                  ? "PDF de esta categoría"
                  : "Descargar PDF"}
            </button>
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-medium text-[var(--text-primary)] hover:bg-stone-50"
            >
              Ir a la web
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:px-6 sm:py-8 sm:pb-8">
        {pdfError && (
          <div
            role="alert"
            className="mb-4 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
            {pdfError}
            <button
              type="button"
              onClick={() => setPdfError("")}
              className="ml-auto text-red-400 hover:text-red-600"
              aria-label="Cerrar aviso"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

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
                <li
                  key={product.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
                >
                  <div className="relative aspect-[4/3] bg-stone-100">
                    <SafeImage
                      src={product.images[0]?.src ?? "/placeholder.svg"}
                      alt={product.images[0]?.alt ?? product.name}
                      fill
                      className="object-cover"
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
                      <p className="text-sm text-[var(--text-secondary)]">
                        {product.description}
                      </p>
                    )}
                    {product.specs && (
                      <p className="whitespace-pre-line rounded-lg bg-stone-50 px-2.5 py-2 text-xs text-stone-600">
                        {product.specs}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5 pt-1">
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
                      {product.stock != null && product.stock > 0 && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                          Stock: {product.stock}
                        </span>
                      )}
                    </div>
                    <div className="mt-auto border-t border-stone-100 pt-3">
                      {transfer != null || card != null ? (
                        <div className="space-y-1">
                          {transfer != null && (
                            <p className="text-base font-bold text-emerald-700">
                              Transferencia / Deuna: {formatUSD(transfer)}
                            </p>
                          )}
                          {card != null && (
                            <p className="text-sm text-stone-500">
                              Tarjeta: {formatUSD(card)}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-stone-400">Precio a consultar</p>
                      )}
                    </div>
                  </div>
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

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-[var(--accent-cream)]/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:hidden">
        <button
          type="button"
          onClick={() => void downloadPdf()}
          disabled={pdfBusy}
          className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] text-sm font-semibold text-white active:bg-[var(--brand-dark)] disabled:opacity-70"
        >
          {pdfBusy ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <FileDown className="h-4 w-4" aria-hidden />
          )}
          {pdfBusy
            ? "Generando PDF…"
            : category
              ? `Descargar PDF de ${categoryLabel(category)}`
              : "Descargar catálogo en PDF"}
        </button>
      </div>
    </div>
  );
}
