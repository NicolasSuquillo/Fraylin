"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { Product, Category } from "@/types";

interface Props {
  products: Product[];
  categories: Category[];
}

export default function ProductsTable({ products, categories }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  const categoryLabel = (slug: string) =>
    categories.find((c) => c.slug === slug)?.label ?? slug;

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar "${name}" (${id})?`)) return;
    setDeleting(id);
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    setDeleting(null);
    router.refresh();
  }

  return (
    <>
      {/* Vista móvil: tarjetas */}
      <div className="md:hidden space-y-3">
        {products.map((p) => (
          <article
            key={p.id}
            className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
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
            </dl>
            <div className="mt-4 flex gap-2">
              <a
                href={`/admin/products/${p.id}/edit`}
                className="inline-flex flex-1 items-center justify-center gap-2 min-h-[48px] rounded-xl bg-amber-600 px-3 text-sm font-semibold text-white active:bg-amber-700"
              >
                <Pencil className="h-4 w-4" aria-hidden />
                Editar
              </a>
              <button
                type="button"
                onClick={() => handleDelete(p.id, p.name)}
                disabled={deleting === p.id}
                className="inline-flex flex-1 items-center justify-center gap-2 min-h-[48px] rounded-xl border-2 border-red-100 bg-red-50/80 px-3 text-sm font-semibold text-red-700 active:bg-red-100 disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                {deleting === p.id ? "…" : "Eliminar"}
              </button>
            </div>
          </article>
        ))}
        {products.length === 0 && (
          <p className="rounded-2xl border border-dashed border-gray-200 bg-white py-12 text-center text-gray-500">
            Sin productos. Usa &quot;Agregar producto&quot; para crear uno.
          </p>
        )}
      </div>

      {/* Vista escritorio: tabla */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">ID</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Nombre</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Categoría</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Precio</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Destacado</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50/80">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.id}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                <td className="px-4 py-3 text-gray-600">{categoryLabel(p.category)}</td>
                <td className="px-4 py-3 text-gray-600">{p.price ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600">{p.featured ? "Sí" : "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={`/admin/products/${p.id}/edit`}
                      className="font-medium text-amber-700 hover:underline"
                    >
                      Editar
                    </a>
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
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                  Sin productos
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
