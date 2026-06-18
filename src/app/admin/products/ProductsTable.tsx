"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Pencil, Trash2, Search, LayoutGrid, List,
  Star, ShoppingCart, MessageCircle, Package,
  ChevronUp, ChevronDown, ChevronsUpDown, X,
  Truck, Wrench, AlertTriangle,
} from "lucide-react";
import { formatUSD } from "@/lib/money";
import type { Product, Category } from "@/types";

interface Props {
  products: Product[];
  categories: Category[];
}

type SortKey = "name" | "category" | "price" | "stock";
type SortDir = "asc" | "desc";
type ViewMode = "table" | "grid";

function StockBadge({ stock }: { stock: number | null | undefined }) {
  if (stock == null)
    return <span className="text-xs text-gray-400">Sin control</span>;
  if (stock === 0)
    return (
      <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-red-700">
        Agotado
      </span>
    );
  if (stock <= 5)
    return (
      <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
        {stock} bajo
      </span>
    );
  return (
    <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-800">
      {stock} ok
    </span>
  );
}

function PriceBadge({ product }: { product: Product }) {
  if (product.priceCents != null) {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-gray-800">
          <ShoppingCart className="h-3 w-3 text-green-600" aria-hidden />
          {formatUSD(product.priceCents)}
        </span>
        {product.transferPriceCents != null && (
          <span className="text-[11px] text-gray-400">
            Transf: {formatUSD(product.transferPriceCents)}
          </span>
        )}
      </div>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-400">
      <MessageCircle className="h-3 w-3" aria-hidden />
      Cotizar
    </span>
  );
}

function Thumb({ product, large }: { product: Product; large?: boolean }) {
  const src = product.images[0]?.src;
  const cls = large
    ? "h-full w-full object-cover"
    : "h-10 w-10 shrink-0 rounded-lg border border-gray-100 object-cover shadow-sm";
  if (!src)
    return (
      <div
        className={
          large
            ? "flex h-full w-full items-center justify-center bg-gray-50"
            : "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50"
        }
        aria-hidden
      >
        <Package className="h-4 w-4 text-gray-300" />
      </div>
    );
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" loading="lazy" className={cls} />;
}

function DeleteButton({
  id,
  name,
  onDeleted,
  onError,
}: {
  id: string;
  name: string;
  onDeleted: () => void;
  onError: (msg: string) => void;
}) {
  const [phase, setPhase] = useState<"idle" | "confirm" | "deleting">("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function startConfirm(e: React.MouseEvent) {
    e.stopPropagation();
    setPhase("confirm");
    timerRef.current = setTimeout(() => setPhase("idle"), 4000);
  }

  async function doDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (timerRef.current) clearTimeout(timerRef.current);
    setPhase("deleting");
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        onError((data as { error?: string }).error ?? `No se pudo eliminar "${name}".`);
        setPhase("idle");
        return;
      }
      onDeleted();
    } catch {
      onError("Sin conexión: no se pudo eliminar.");
      setPhase("idle");
    }
  }

  function cancel(e: React.MouseEvent) {
    e.stopPropagation();
    if (timerRef.current) clearTimeout(timerRef.current);
    setPhase("idle");
  }

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  if (phase === "confirm")
    return (
      <span className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <span className="text-xs font-medium text-red-600">¿Seguro?</span>
        <button
          onClick={doDelete}
          className="rounded-md bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white hover:bg-red-700"
        >
          Sí
        </button>
        <button
          onClick={cancel}
          className="rounded-md px-1.5 py-0.5 text-[11px] text-gray-500 hover:text-gray-700"
        >
          No
        </button>
      </span>
    );

  return (
    <button
      type="button"
      onClick={phase === "deleting" ? undefined : startConfirm}
      disabled={phase === "deleting"}
      className="inline-flex items-center gap-1 text-sm font-medium text-red-500 transition-colors hover:text-red-700 disabled:opacity-40"
    >
      <Trash2 className="h-3.5 w-3.5" aria-hidden />
      {phase === "deleting" ? "…" : "Eliminar"}
    </button>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown className="h-3.5 w-3.5 text-gray-400" />;
  return dir === "asc"
    ? <ChevronUp className="h-3.5 w-3.5 text-amber-600" />
    : <ChevronDown className="h-3.5 w-3.5 text-amber-600" />;
}

export default function ProductsTable({ products, categories }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [view, setView] = useState<ViewMode>("table");
  const [error, setError] = useState("");

  const categoryLabel = (slug: string) =>
    categories.find((c) => c.slug === slug)?.label ?? slug;

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  const stats = useMemo(
    () => ({
      total: products.length,
      online: products.filter((p) => p.priceCents != null).length,
      agotado: products.filter((p) => p.stock === 0).length,
      featured: products.filter((p) => p.featured).length,
    }),
    [products]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = products.filter((p) => {
      if (categoryFilter && p.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        categoryLabel(p.category).toLowerCase().includes(q)
      );
    });

    list = [...list].sort((a, b) => {
      let av: string | number = 0,
        bv: string | number = 0;
      if (sortKey === "name") { av = a.name; bv = b.name; }
      else if (sortKey === "category") {
        av = categoryLabel(a.category);
        bv = categoryLabel(b.category);
      } else if (sortKey === "price") {
        av = a.priceCents ?? -1;
        bv = b.priceCents ?? -1;
      } else if (sortKey === "stock") {
        av = a.stock ?? 999999;
        bv = b.stock ?? 999999;
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, categories, query, categoryFilter, sortKey, sortDir]);

  const hasFilters = query || categoryFilter;

  function renderThCol(label: string, col: SortKey) {
    const active = sortKey === col;
    return (
      <th
        className="cursor-pointer select-none px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 hover:text-gray-700"
        onClick={() => toggleSort(col)}
      >
        <span className="inline-flex items-center gap-1">
          {label}
          <SortIcon active={active} dir={sortDir} />
        </span>
      </th>
    );
  }

  function handleDeleted() {
    setError("");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: stats.total, color: "text-gray-700", bg: "bg-white" },
          { label: "Online", value: stats.online, color: "text-green-700", bg: "bg-green-50" },
          { label: "Agotados", value: stats.agotado, color: "text-red-700", bg: "bg-red-50" },
          { label: "Destacados", value: stats.featured, color: "text-amber-700", bg: "bg-amber-50" },
        ].map((s) => (
          <div
            key={s.label}
            className={`rounded-xl border border-gray-100 ${s.bg} px-4 py-3 shadow-sm`}
          >
            <p className="text-xs font-medium text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nombre, ID o categoría…"
            className="w-full min-h-[40px] rounded-xl border border-gray-200 bg-white pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            aria-label="Buscar productos"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="min-h-[40px] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
          aria-label="Filtrar por categoría"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>{c.label}</option>
          ))}
        </select>
        {/* View toggle desktop */}
        <div className="hidden sm:flex items-center rounded-xl border border-gray-200 bg-white p-0.5 gap-0.5">
          <button
            onClick={() => setView("table")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${view === "table" ? "bg-gray-100 text-gray-800" : "text-gray-500 hover:text-gray-700"}`}
          >
            <List className="h-4 w-4" aria-hidden /> Lista
          </button>
          <button
            onClick={() => setView("grid")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${view === "grid" ? "bg-gray-100 text-gray-800" : "text-gray-500 hover:text-gray-700"}`}
          >
            <LayoutGrid className="h-4 w-4" aria-hidden /> Grilla
          </button>
        </div>
      </div>

      {hasFilters && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>
            {filtered.length} de {products.length} productos
          </span>
          <button
            onClick={() => { setQuery(""); setCategoryFilter(""); }}
            className="inline-flex items-center gap-0.5 rounded-full bg-gray-100 px-2 py-0.5 text-gray-600 hover:bg-gray-200"
          >
            <X className="h-3 w-3" /> Limpiar
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
          {error}
          <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Grid view — desktop only */}
      {view === "grid" && (
        <div className="hidden md:grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="relative h-40 overflow-hidden bg-gray-50">
                <Thumb product={p} large />
                <div className="absolute right-2 top-2 flex flex-col items-end gap-1">
                  {p.featured && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white shadow-sm">
                      <Star className="h-2.5 w-2.5 fill-current" aria-hidden /> Top
                    </span>
                  )}
                  {p.stock === 0 && (
                    <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white shadow-sm">
                      Agotado
                    </span>
                  )}
                </div>
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-semibold leading-snug text-gray-900">{p.name}</p>
                <p className="mt-0.5 text-[11px] text-gray-400">{categoryLabel(p.category)}</p>
                <div className="mt-2 flex items-center justify-between">
                  <PriceBadge product={p} />
                  {p.stock != null && p.stock > 0 && <StockBadge stock={p.stock} />}
                </div>
                <div className="mt-3 flex gap-2">
                  <Link
                    href={`/admin/products/${p.id}/edit`}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-amber-600 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-700"
                  >
                    <Pencil className="h-3 w-3" aria-hidden /> Editar
                  </Link>
                  <div className="inline-flex items-center justify-center rounded-lg border border-red-100 bg-red-50 px-2">
                    <DeleteButton id={p.id} name={p.name} onDeleted={handleDeleted} onError={setError} />
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <EmptyState products={products} span={4} />}
        </div>
      )}

      {/* Mobile cards */}
      <div className={`space-y-3 ${view === "grid" ? "md:hidden" : "md:hidden"}`}>
        {filtered.map((p) => (
          <article
            key={p.id}
            className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <Thumb product={p} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold leading-snug text-gray-900">{p.name}</h2>
                  {p.featured && (
                    <Star className="mt-0.5 h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" aria-label="Destacado" />
                  )}
                </div>
                <p className="mt-0.5 font-mono text-[11px] text-gray-400">{p.id}</p>
                <p className="mt-0.5 text-xs text-gray-500">{categoryLabel(p.category)}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <PriceBadge product={p} />
              <StockBadge stock={p.stock} />
            </div>
            <div className="mt-3 flex gap-2">
              <Link
                href={`/admin/products/${p.id}/edit`}
                className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-600 px-3 text-sm font-semibold text-white hover:bg-amber-700"
              >
                <Pencil className="h-4 w-4" aria-hidden /> Editar
              </Link>
              <div className="inline-flex min-h-[40px] flex-1 items-center justify-center rounded-xl border border-red-100 bg-red-50">
                <DeleteButton id={p.id} name={p.name} onDeleted={handleDeleted} onError={setError} />
              </div>
            </div>
          </article>
        ))}
        {filtered.length === 0 && <EmptyState products={products} />}
      </div>

      {/* Desktop table */}
      {view === "table" && (
        <div className="hidden overflow-x-auto overscroll-x-contain rounded-2xl border border-gray-200 bg-white shadow-sm md:block">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="border-b border-gray-100 bg-gray-50/80">
              <tr>
                {renderThCol("Producto", "name")}
                {renderThCol("Categoría", "category")}
                {renderThCol("Precio", "price")}
                {renderThCol("Stock", "stock")}
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Extras
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => router.push(`/admin/products/${p.id}/edit`)}
                  className="group cursor-pointer transition-colors hover:bg-amber-50/40"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Thumb product={p} />
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 transition-colors group-hover:text-amber-800">
                          {p.name}
                        </p>
                        <p className="font-mono text-[11px] text-gray-400">{p.id}</p>
                      </div>
                      {p.featured && (
                        <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" aria-label="Destacado" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                      {categoryLabel(p.category)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <PriceBadge product={p} />
                  </td>
                  <td className="px-4 py-3">
                    <StockBadge stock={p.stock} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {p.freeShipping && (
                        <span title="Envío gratis">
                          <Truck className="h-3.5 w-3.5 text-blue-500" aria-hidden />
                        </span>
                      )}
                      {p.freeInstallation && (
                        <span title="Instalación gratis">
                          <Wrench className="h-3.5 w-3.5 text-purple-500" aria-hidden />
                        </span>
                      )}
                      {p.installationCents != null && !p.freeInstallation && (
                        <span className="text-[11px] text-gray-400">
                          +{formatUSD(p.installationCents)} inst.
                        </span>
                      )}
                    </div>
                  </td>
                  <td
                    className="px-4 py-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 font-medium text-amber-700 transition-colors hover:text-amber-900"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden /> Editar
                      </Link>
                      <DeleteButton
                        id={p.id}
                        name={p.name}
                        onDeleted={handleDeleted}
                        onError={setError}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="h-8 w-8 text-gray-300" aria-hidden />
                      <p className="text-sm font-medium text-gray-500">
                        {products.length === 0
                          ? "Sin productos aún"
                          : "Ningún producto coincide"}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EmptyState({ products, span }: { products: Product[]; span?: number }) {
  void span;
  return (
    <div className="col-span-full rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
      <Package className="mx-auto mb-3 h-10 w-10 text-gray-300" aria-hidden />
      <p className="font-medium text-gray-500">
        {products.length === 0 ? "Sin productos aún" : "Ningún producto coincide"}
      </p>
      {products.length === 0 && (
        <p className="mt-1 text-sm text-gray-400">
          Usa &quot;Agregar producto&quot; para crear el primero.
        </p>
      )}
    </div>
  );
}
