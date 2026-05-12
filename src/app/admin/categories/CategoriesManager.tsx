"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as LucideIcons from "lucide-react";
import { ChevronDown, Box } from "lucide-react";
import type { Category } from "@/types";

const LUCIDE_ICONS = [
  "Grid2X2", "Sparkles", "Droplets", "LayoutPanelLeft", "Layers",
  "Mountain", "Package", "Wrench", "Home", "Star", "Box", "Tag",
  "ShoppingBag", "Hammer", "Paintbrush", "Lightbulb",
] as const;

function LucideIconPreview({ name, size = 18 }: { name: string; size?: number }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (LucideIcons as any)[name] as React.ComponentType<{ size?: number; className?: string }> | undefined;
  if (!Icon) return <Box size={size} className="text-gray-400 shrink-0" aria-hidden />;
  return <Icon size={size} className="text-gray-700 shrink-0" aria-hidden />;
}

function IconPicker({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleDoc(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleDoc);
    return () => document.removeEventListener("mousedown", handleDoc);
  }, []);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        id={id}
        onClick={() => setOpen((o) => !o)}
        className="w-full min-h-[44px] flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 text-base sm:text-sm text-left focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <LucideIconPreview name={value} size={18} />
        <span className="flex-1 truncate text-gray-900">{value}</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open && (
        <ul
          className="absolute z-40 top-full left-0 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
          role="listbox"
        >
          {LUCIDE_ICONS.map((name) => (
            <li key={name} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={value === name}
                onClick={() => {
                  onChange(name);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-amber-50 ${
                  value === name ? "bg-amber-50 font-medium text-amber-900" : "text-gray-800"
                }`}
              >
                <LucideIconPreview name={name} size={18} />
                <span className="font-mono text-xs">{name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function emptyCategory(): Category {
  return { slug: "", label: "", icon: "Box", description: "" };
}

interface EditState {
  slug: string;
  data: Category;
}

export default function CategoriesManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const editPanelRef = useRef<HTMLDivElement>(null);
  const editLabelInputRef = useRef<HTMLInputElement>(null);
  const [newCat, setNewCat] = useState<Category>(emptyCategory());
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  useEffect(() => {
    if (edit == null) return;
    const scrollFrame = window.requestAnimationFrame(() => {
      editPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    const focusTimer = window.setTimeout(() => {
      editLabelInputRef.current?.focus({ preventScroll: true });
    }, 450);
    return () => {
      window.cancelAnimationFrame(scrollFrame);
      window.clearTimeout(focusTimer);
    };
  }, [edit?.slug]);

  function setNewField<K extends keyof Category>(key: K, value: Category[K]) {
    setNewCat((c) => ({ ...c, [key]: value }));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    setAdding(true);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCat),
    });
    setAdding(false);
    if (res.ok) {
      setNewCat(emptyCategory());
      router.refresh();
    } else {
      const data = await res.json();
      setAddError(data.error ?? "Error al agregar");
    }
  }

  async function handleDelete(slug: string) {
    if (!confirm(`¿Eliminar categoría "${slug}"? Solo es posible si no tiene productos.`)) return;
    setDeleting(slug);
    const res = await fetch(`/api/admin/categories/${slug}`, { method: "DELETE" });
    setDeleting(null);
    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? "Error al eliminar");
    } else {
      router.refresh();
    }
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!edit) return;
    setEditError("");
    setSaving(true);
    const res = await fetch(`/api/admin/categories/${edit.slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(edit.data),
    });
    setSaving(false);
    if (res.ok) {
      setEdit(null);
      router.refresh();
    } else {
      const data = await res.json();
      setEditError(data.error ?? "Error al guardar");
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Móvil: tarjetas */}
      <div className="md:hidden space-y-3">
        {categories.map((c) => (
          <article
            key={c.slug}
            className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <LucideIconPreview name={c.icon} size={22} />
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-gray-900">{c.label}</h2>
                <p className="mt-1 font-mono text-xs text-gray-500">{c.slug}</p>
                <p className="mt-2 text-xs text-gray-500">
                  Icono: <span className="font-mono text-gray-700">{c.icon}</span>
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setEdit({ slug: c.slug, data: { ...c } })}
                className="inline-flex flex-1 min-h-[48px] items-center justify-center rounded-xl bg-amber-600 px-3 text-sm font-semibold text-white active:bg-amber-700"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => handleDelete(c.slug)}
                disabled={deleting === c.slug}
                className="inline-flex flex-1 min-h-[48px] items-center justify-center rounded-xl border-2 border-red-100 bg-red-50/80 px-3 text-sm font-semibold text-red-700 active:bg-red-100 disabled:opacity-40"
              >
                {deleting === c.slug ? "…" : "Eliminar"}
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* Escritorio: tabla */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-x-auto border border-gray-200">
        <table className="w-full text-sm min-w-[420px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Slug</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Icono</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {categories.map((c) => (
              <tr key={c.slug} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.slug}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{c.label}</td>
                <td className="px-4 py-3 text-gray-600">
                  <span className="inline-flex items-center gap-2">
                    <LucideIconPreview name={c.icon} size={16} />
                    <span className="font-mono text-xs">{c.icon}</span>
                  </span>
                </td>
                <td className="px-4 py-3 space-x-2">
                  <button
                    type="button"
                    onClick={() => setEdit({ slug: c.slug, data: { ...c } })}
                    className="text-amber-600 hover:underline"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c.slug)}
                    disabled={deleting === c.slug}
                    className="text-red-500 hover:underline disabled:opacity-40"
                  >
                    {deleting === c.slug ? "..." : "Eliminar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de edición inline */}
      {edit && (
        <div
          ref={editPanelRef}
          id="editar-categoria-panel"
          role="region"
          aria-labelledby="editar-categoria-titulo"
          tabIndex={-1}
          className="scroll-mt-28 rounded-2xl border border-amber-200 bg-white p-4 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-amber-400 sm:p-5 md:scroll-mt-8"
        >
          <h2 id="editar-categoria-titulo" className="mb-4 text-lg font-semibold text-gray-800">
            Editar: {edit.slug}
          </h2>
          <form onSubmit={handleSaveEdit} className="space-y-3">
            <div>
              <label htmlFor="edit-categoria-nombre" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                id="edit-categoria-nombre"
                ref={editLabelInputRef}
                value={edit.data.label}
                onChange={(e) => setEdit((s) => s && { ...s, data: { ...s.data, label: e.target.value } })}
                className="w-full min-h-[44px] border border-gray-300 rounded-lg px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
            <div>
              <label htmlFor="edit-icon" className="block text-sm font-medium text-gray-700 mb-1">
                Icono (Lucide)
              </label>
              <IconPicker
                id="edit-icon"
                value={edit.data.icon}
                onChange={(icon) =>
                  setEdit((s) => s && { ...s, data: { ...s.data, icon } })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <input
                value={edit.data.description ?? ""}
                onChange={(e) => setEdit((s) => s && { ...s, data: { ...s.data, description: e.target.value } })}
                className="w-full min-h-[44px] border border-gray-300 rounded-lg px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            {editError && <p className="text-red-600 text-sm">{editError}</p>}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => setEdit(null)}
                className="min-h-[48px] sm:min-h-0 w-full sm:w-auto rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-600 transition hover:border-gray-300 sm:py-2"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="min-h-[48px] sm:min-h-0 w-full sm:w-auto rounded-xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50 sm:py-2"
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Formulario agregar categoría */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-5">
        <h2 className="font-semibold text-gray-800 mb-4 text-lg">Agregar categoría</h2>
        <form onSubmit={handleAdd} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
              <input
                value={newCat.slug}
                onChange={(e) => setNewField("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                placeholder="Ej: pisos-exteriores"
                className="w-full min-h-[44px] border border-gray-300 rounded-lg px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                value={newCat.label}
                onChange={(e) => setNewField("label", e.target.value)}
                placeholder="Ej: Pisos Exteriores"
                className="w-full min-h-[44px] border border-gray-300 rounded-lg px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="new-icon" className="block text-sm font-medium text-gray-700 mb-1">
                Icono (Lucide)
              </label>
              <IconPicker
                id="new-icon"
                value={newCat.icon}
                onChange={(icon) => setNewField("icon", icon)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <input
                value={newCat.description ?? ""}
                onChange={(e) => setNewField("description", e.target.value)}
                placeholder="Descripción corta"
                className="w-full min-h-[44px] border border-gray-300 rounded-lg px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
          {addError && <p className="text-red-600 text-sm">{addError}</p>}
          <button
            type="submit"
            disabled={adding}
            className="w-full sm:w-auto min-h-[48px] sm:min-h-0 rounded-xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50 sm:py-2"
          >
            {adding ? "Agregando..." : "+ Agregar categoría"}
          </button>
        </form>
      </div>
    </div>
  );
}
