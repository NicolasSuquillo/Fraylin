"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X, FileDown, Package, Loader2, AlertTriangle } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ArchitecturalBackground from "@/components/ui/ArchitecturalBackground";
import ProductCard from "@/components/products/ProductCard";
import type { Product, Category } from "@/types";

interface Props {
  products: Product[];
  categories: Category[];
  initialCategory?: string;
}

type FeatureFilter = "all" | "freeShipping" | "freeInstallation" | "inStock";

export default function CatalogClient({
  products,
  categories,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState("");
  const [featureFilter, setFeatureFilter] = useState<FeatureFilter>("all");
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState("");

  const urlCategory = searchParams.get("category") ?? "";
  const category =
    urlCategory && categories.some((c) => c.slug === urlCategory)
      ? urlCategory
      : "";

  const categoryLabel = (slug: string) =>
    categories.find((c) => c.slug === slug)?.label ?? slug;

  function handleCategoryChange(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next) {
      params.set("category", next);
    } else {
      params.delete("category");
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (category && p.category !== category) return false;
      if (featureFilter === "freeShipping" && !p.freeShipping) return false;
      if (featureFilter === "freeInstallation" && !p.freeInstallation) return false;
      if (featureFilter === "inStock" && p.stock === 0) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q) ||
        (p.specs ?? "").toLowerCase().includes(q) ||
        categoryLabel(p.category).toLowerCase().includes(q)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, categories, query, category, featureFilter]);

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

  const filterChips: { id: FeatureFilter; label: string }[] = [
    { id: "all", label: "Todos" },
    { id: "inStock", label: "Disponibles" },
    { id: "freeShipping", label: "Envío gratis" },
    { id: "freeInstallation", label: "Instalación gratis" },
  ];

  return (
    <div className="relative min-h-dvh bg-[#F4F1EA]">
      <ArchitecturalBackground />
      <Header />

      <main
        id="contenido-principal"
        tabIndex={-1}
        className="relative z-10 mx-auto max-w-7xl px-4 pt-24 pb-24 outline-none sm:px-6 sm:pt-28 sm:pb-16 lg:px-8"
      >
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="space-y-2">
            <p className="text-xs font-bold tracking-[0.16em] text-[#7A6336] uppercase">
              Catálogo Fraylin Acabados
            </p>
            <h1
              className="text-3xl font-bold tracking-tight text-[#1F1D1A] sm:text-4xl"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {category ? categoryLabel(category) : "Todos los acabados"}
            </h1>
            <p className="text-sm text-[#6E6A63]">
              Explora nuestras líneas de porcelanatos, revestimientos, grifería y
              accesorios arquitectónicos.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void downloadPdf()}
            disabled={pdfBusy}
            className="hidden min-h-[44px] shrink-0 items-center gap-2 rounded-lg bg-[#C9B079] px-4 py-2.5 text-sm font-semibold text-[#1F1D1A] transition-colors duration-200 hover:bg-[#D2BD8A] disabled:opacity-70 sm:inline-flex"
          >
            {pdfBusy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <FileDown className="size-4" aria-hidden="true" />
            )}
            {pdfBusy
              ? "Generando PDF…"
              : category
                ? "PDF de esta línea"
                : "Descargar catálogo PDF"}
          </button>
        </div>

        {pdfError && (
          <div
            role="alert"
            className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
            <span>{pdfError}</span>
            <button
              type="button"
              onClick={() => setPdfError("")}
              className="ml-auto text-red-500 hover:text-red-700"
              aria-label="Cerrar aviso"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* Barra de filtros en #F2EFE9 */}
        <section
          aria-label="Filtros de catálogo"
          className="mb-8 space-y-4 rounded-2xl border border-[#E6E1D6] bg-[#F2EFE9] p-4 sm:p-5"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#8C877E]"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Buscar acabados por nombre, formato o especificación"
                placeholder="Buscar por nombre, formato o especificación…"
                className="min-h-[44px] w-full rounded-lg border border-[#E2DDD3] bg-white pr-9 pl-10 text-sm text-[#1F1D1A] placeholder:text-[#8C877E] transition-colors focus:border-[#C9B079] focus:outline-none focus:ring-2 focus:ring-[#C9B079]/25"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-[#8C877E] hover:text-[#1F1D1A]"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              aria-label="Filtrar por familia o categoría"
              className="min-h-[44px] rounded-lg border border-[#E2DDD3] bg-white px-3.5 text-sm text-[#1F1D1A] transition-colors focus:border-[#C9B079] focus:outline-none focus:ring-2 focus:ring-[#C9B079]/25 sm:w-64"
            >
              <option value="">Todas las categorías</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtros rápidos">
              {filterChips.map((chip) => {
                const active = featureFilter === chip.id;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setFeatureFilter(chip.id)}
                    aria-pressed={active}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9B079] ${
                      active
                        ? "bg-[#C9B079] font-semibold text-[#1F1D1A]"
                        : "border border-[#E6E1D6] bg-white text-[#6E6A63] hover:text-[#1F1D1A]"
                    }`}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs font-medium text-[#6E6A63]">
              {filtered.length} {filtered.length === 1 ? "producto" : "productos"}
            </p>
          </div>
        </section>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#E6E1D6] bg-white py-16 text-center">
            <Package className="mx-auto mb-3 size-10 text-[#8C877E]" aria-hidden="true" />
            <p className="text-sm font-medium text-[#6E6A63]">
              No encontramos acabados con esos filtros.
            </p>
            {(query || category || featureFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setFeatureFilter("all");
                  handleCategoryChange("");
                }}
                className="mt-4 rounded-lg bg-[#C9B079] px-4 py-2 text-xs font-semibold text-[#1F1D1A] transition-colors hover:bg-[#D2BD8A]"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                categories={categories}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />

      {/* Barra PDF móvil */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#E6E1D6] bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:hidden">
        <button
          type="button"
          onClick={() => void downloadPdf()}
          disabled={pdfBusy}
          className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-lg bg-[#C9B079] text-sm font-semibold text-[#1F1D1A] transition-colors hover:bg-[#D2BD8A] disabled:opacity-70"
        >
          {pdfBusy ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <FileDown className="size-4" aria-hidden="true" />
          )}
          {pdfBusy
            ? "Generando PDF…"
            : category
              ? `PDF de ${categoryLabel(category)}`
              : "Descargar catálogo PDF"}
        </button>
      </div>
    </div>
  );
}
