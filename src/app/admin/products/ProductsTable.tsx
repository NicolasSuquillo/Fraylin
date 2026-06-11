"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Trash2, Search } from "lucide-react";
import { formatUSD } from "@/lib/money";
import type { Product, Category } from "@/types";

interface Props {
  products: Product[];
  categories: Category[];
}

function StockBadge({ stock }: { stock: number | null | undefined }) {
  if (stock == null) return <span className="text-gray-400">—</span>;
  if (stock === 0) {
    return (
      <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-red-800">
        Agotado
      </span>
    );
  }
  if (stock <= 5) {
    return (
      <span className="inline-flex rounded-full bg-yellow-100 px-2 py-0.5 text-[11px] font-bold text-yellow-900">
        {stock} (bajo)
      </span>
    );
  }
  return <span className="text-gray-700">{stock}</span>;
}

function Thumb({ product }: { product: Product }) {
  const src = product.images[0]?.src;
  if (!src) {
    return (
      <div className="h-10 w-10 shrink-0 rounded-lg border border-dashed border-gray-200 bg-gray-50" aria-hidden />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      className="h-10 w-10 shrink-0 rounded-lg border border-gray-200 object-cover"
    />
  );
}

export default function ProductsTable({ products, categories }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const categoryLabel = (slug: string) =>
    categories.find((c) => c.slug === slug)?.label ?? slug;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (categoryFilter && p.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        categoryLabel(p.category).toLowerCase().includes(q)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, categories, query, categoryFilter]);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar "${name}" (${id})? Esta acción no se puede deshacer.`)) return;
    setError("");
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? `No se pudo eliminar "${name}".`);
        return;
      }
      router.refresh();
    } catch {
      setError("Sin conexión: no se pudo eliminar. Inténtalo de nuevo.");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <>
      {/* Búsqueda y filtro */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, ID o categoría..."
            className="w-full min-h-[44px] rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            aria-label="Buscar productos"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="min-h-[44px] rounded-xl border border-gray-200 bg-white px-3 py-2 text-base sm:text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
          aria-label="Filtrar por categoría"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {(query || categoryFilter) && (
        <p className="mb-3 text-xs text-gray-500">
          {filtered.length} de {products.length} productos
        </p>
      )}

      {error && (
        <p role="alert" className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {/* Vista móvil: tarjetas */}
      <div className="md:hidden space-y-3">
        {filtered.map((p) => (
          <article
            key={p.id}
            className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <Thumb product={p} />
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-gray-900 leading-snug">{p.name}</h2>
                <p className="mt-1 font-mono text-xs text-gray-500">{p.id}</p>
              </div>
              {p.featured && (
                <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900">
                  Destacado
                </span>
              )}
            </div>
            <dl className="mt-3 grid grid-cols-1 gap-1.5 text-sm text-gray-600">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Categoría</dt>
                <dd className="text-right font-medium text-gray-800">
                  {categoryLabel(p.category)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Precio</dt>
                <dd className="text-right">{p.price?.trim() ? p.price : "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Precio online</dt>
                <dd className="text-right">{p.priceCents != null ? formatUSD(p.priceCents) : "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Stock</dt>
                <dd className="text-right"><StockBadge stock={p.stock} /></dd>
              </div>
            </dl>
            <div className="mt-4 flex gap-2">
              <Link
                href={`/admin/products/${p.id}/edit`}
                className="inline-flex flex-1 items-center justify-center gap-2 min-h-[48px] rounded-xl bg-amber-600 px-3 text-sm font-semibold text-white active:bg-amber-700"
              >
                <Pencil className="h-4 w-4" aria-hidden />
                Editar
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(p.id, p.name)}
                disabled={deleting === p.id}
                className="inline-flex flex-1 items-center justify-center gap-2 min-h-[48px] rounded-xl border-2 border-red-100 bg-red-50/80 px-3 text-sm font-semibold text-red-700 active:bg-red-100 disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                {deleting === p.id ? "Eliminando…" : "Eliminar"}
              </button>
            </div>
          </article>
        ))}
        {filtered.length === 0 && (
          <p className="rounded-2xl border border-dashed border-gray-200 bg-white py-12 text-center text-gray-500">
            {products.length === 0
              ? 'Sin productos. Usa "Agregar producto" para crear uno.'
              : "Ningún producto coincide con la búsqueda."}
          </p>
        )}
      </div>

      {/* Vista escritorio: tabla */}
      <div className="hidden md:block overflow-x-auto overscroll-x-contain rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Producto</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Categoría</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Precio</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Precio online</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Stock</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Destacado</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50/80">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Thumb product={p} />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800">{p.name}</p>
                      <p className="font-mono text-xs text-gray-500">{p.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{categoryLabel(p.category)}</td>
                <td className="px-4 py-3 text-gray-600">{p.price?.trim() ? p.price : "—"}</td>
                <td className="px-4 py-3 text-gray-600">{p.priceCents != null ? formatUSD(p.priceCents) : "—"}</td>
                <td className="px-4 py-3"><StockBadge stock={p.stock} /></td>
                <td className="px-4 py-3 text-gray-600">{p.featured ? "Sí" : "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="font-medium text-amber-700 hover:underline"
                    >
                      Editar
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id, p.name)}
                      disabled={deleting === p.id}
                      className="font-medium text-red-600 hover:underline disabled:opacity-40"
                    >
                      {deleting === p.id ? "…" : "Eliminar"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                  {products.length === 0 ? "Sin productos" : "Ningún producto coincide con la búsqueda"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
