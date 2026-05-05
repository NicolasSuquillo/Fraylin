"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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

  async function handleDelete(id: string) {
    if (!confirm(`¿Eliminar producto "${id}"?`)) return;
    setDeleting(id);
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    setDeleting(null);
    router.refresh();
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Categoría</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Precio</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Destacado</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {products.map((p) => (
            <tr key={p.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.id}</td>
              <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
              <td className="px-4 py-3 text-gray-600">{categoryLabel(p.category)}</td>
              <td className="px-4 py-3 text-gray-600">{p.price ?? "—"}</td>
              <td className="px-4 py-3">{p.featured ? "✓" : "—"}</td>
              <td className="px-4 py-3 space-x-2">
                <a
                  href={`/admin/products/${p.id}/edit`}
                  className="text-amber-600 hover:underline"
                >
                  Editar
                </a>
                <button
                  onClick={() => handleDelete(p.id)}
                  disabled={deleting === p.id}
                  className="text-red-500 hover:underline disabled:opacity-40"
                >
                  {deleting === p.id ? "..." : "Eliminar"}
                </button>
              </td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                Sin productos
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
