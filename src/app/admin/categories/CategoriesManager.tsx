"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as LucideIcons from "lucide-react";
import { Box, Pencil, Trash2, Plus, X, AlertTriangle } from "lucide-react";
import type { Category } from "@/types";

const LUCIDE_ICONS = [
  "Grid2X2", "Sparkles", "Droplets", "LayoutPanelLeft", "Layers",
  "Mountain", "Package", "Wrench", "Home", "Star", "Box", "Tag",
  "ShoppingBag", "Hammer", "Paintbrush", "Lightbulb",
] as const;

const CARD_ACCENTS = [
  { outer: "bg-amber-100", icon: "text-amber-700" },
  { outer: "bg-blue-100", icon: "text-blue-700" },
  { outer: "bg-emerald-100", icon: "text-emerald-700" },
  { outer: "bg-purple-100", icon: "text-purple-700" },
  { outer: "bg-rose-100", icon: "text-rose-700" },
  { outer: "bg-cyan-100", icon: "text-cyan-700" },
  { outer: "bg-orange-100", icon: "text-orange-700" },
  { outer: "bg-teal-100", icon: "text-teal-700" },
];

function LucideIcon({
  name,
  size = 18,
  className = "text-gray-700",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (LucideIcons as any)[name] as
    | React.ComponentType<{ size?: number; className?: string }>
    | undefined;
  if (!Icon) return <Box size={size} className={className} aria-hidden />;
  return <Icon size={size} className={className} aria-hidden />;
}

function IconPickerGrid({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-1.5 p-2">
      {LUCIDE_ICONS.map((name) => (
        <button
          key={name}
          type="button"
          onClick={() => onChange(name)}
          title={name}
          className={`flex flex-col items-center gap-1 rounded-xl p-2 text-[10px] font-mono transition-colors ${
            value === name
              ? "bg-amber-100 text-amber-800 ring-2 ring-amber-400"
              : "bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          }`}
        >
          <LucideIcon
            name={name}
            size={20}
            className={value === name ? "text-amber-700" : "text-gray-500"}
          />
          <span className="truncate w-full text-center leading-none">{name}</span>
        </button>
      ))}
    </div>
  );
}

function DeleteButton({
  slug,
  onDeleted,
  onError,
}: {
  slug: string;
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
      const res = await fetch(`/api/admin/categories/${slug}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        onError(
          (data as { error?: string }).error ?? "Error al eliminar"
        );
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
      <span
        className="inline-flex items-center gap-1.5"
        onClick={(e) => e.stopPropagation()}
      >
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

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function emptyCategory(): Category {
  return { slug: "", label: "", icon: "Box", description: "" };
}

interface EditState {
  slug: string;
  data: Category;
}

export default function CategoriesManager({
  categories,
  productCounts,
}: {
  categories: Category[];
  productCounts: Record<string, number>;
}) {
  const router = useRouter();
  const [edit, setEdit] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [globalError, setGlobalError] = useState("");
  const [newCat, setNewCat] = useState<Category>(emptyCategory());
  const [slugTouched, setSlugTouched] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!edit) return;
    setEditError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/categories/${edit.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(edit.data),
      });
      if (res.ok) {
        setEdit(null);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setEditError(
          (data as { error?: string }).error ?? "Error al guardar"
        );
      }
    } catch {
      setEditError("Sin conexión: no se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    setAdding(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCat),
      });
      if (res.ok) {
        setNewCat(emptyCategory());
        setSlugTouched(false);
        setShowAddForm(false);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setAddError(
          (data as { error?: string }).error ?? "Error al agregar"
        );
      }
    } catch {
      setAddError("Sin conexión: no se pudo agregar.");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="space-y-6">
      {globalError && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
          {globalError}
          <button
            onClick={() => setGlobalError("")}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Category grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c, idx) => {
          const accent = CARD_ACCENTS[idx % CARD_ACCENTS.length];
          const count = productCounts[c.slug] ?? 0;
          const isEditing = edit?.slug === c.slug;

          return (
            <div
              key={c.slug}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Card body */}
              <div className="flex items-start gap-3 p-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${accent.outer}`}
                >
                  <LucideIcon name={c.icon} size={22} className={accent.icon} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-semibold leading-snug text-gray-900">
                      {c.label}
                    </h2>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        count > 0
                          ? "bg-gray-100 text-gray-600"
                          : "bg-gray-50 text-gray-400"
                      }`}
                    >
                      {count} {count === 1 ? "prod." : "prods."}
                    </span>
                  </div>
                  <p className="mt-0.5 font-mono text-[11px] text-gray-400">
                    {c.slug}
                  </p>
                  {c.description && (
                    <p className="mt-1 line-clamp-1 text-xs text-gray-500">
                      {c.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Inline edit form */}
              {isEditing && edit && (
                <form
                  onSubmit={handleSaveEdit}
                  className="space-y-3 border-t border-amber-100 bg-amber-50/40 p-4"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                    Editando
                  </p>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Nombre *
                    </label>
                    <input
                      value={edit.data.label}
                      onChange={(e) =>
                        setEdit(
                          (s) =>
                            s && {
                              ...s,
                              data: { ...s.data, label: e.target.value },
                            }
                        )
                      }
                      className="w-full min-h-[40px] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Descripción
                    </label>
                    <input
                      value={edit.data.description ?? ""}
                      onChange={(e) =>
                        setEdit(
                          (s) =>
                            s && {
                              ...s,
                              data: { ...s.data, description: e.target.value },
                            }
                        )
                      }
                      className="w-full min-h-[40px] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-600">
                      Ícono
                    </label>
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                      <IconPickerGrid
                        value={edit.data.icon}
                        onChange={(icon) =>
                          setEdit(
                            (s) => s && { ...s, data: { ...s.data, icon } }
                          )
                        }
                      />
                    </div>
                  </div>
                  {editError && (
                    <p className="text-xs text-red-600">{editError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEdit(null)}
                      className="flex-1 min-h-[36px] rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 min-h-[36px] rounded-lg bg-amber-600 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
                    >
                      {saving ? "Guardando…" : "Guardar"}
                    </button>
                  </div>
                </form>
              )}

              {/* Card actions */}
              {!isEditing && (
                <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEdit({ slug: c.slug, data: { ...c } });
                      setEditError("");
                    }}
                    className="inline-flex items-center gap-1 text-sm font-medium text-amber-700 transition-colors hover:text-amber-900"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden /> Editar
                  </button>
                  <DeleteButton
                    slug={c.slug}
                    onDeleted={() => {
                      setGlobalError("");
                      router.refresh();
                    }}
                    onError={setGlobalError}
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* New category trigger card */}
        {!showAddForm && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="group flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 bg-white text-gray-400 transition-colors hover:border-amber-300 hover:bg-amber-50/30 hover:text-amber-600"
          >
            <Plus className="h-8 w-8" aria-hidden />
            <span className="text-sm font-medium">Nueva categoría</span>
          </button>
        )}
      </div>

      {/* Add category form */}
      {showAddForm && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800">
              Nueva categoría
            </h2>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setNewCat(emptyCategory());
                setSlugTouched(false);
                setAddError("");
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Nombre *
                </label>
                <input
                  value={newCat.label}
                  onChange={(e) => {
                    const label = e.target.value;
                    setNewCat((c) => ({
                      ...c,
                      label,
                      slug: slugTouched ? c.slug : slugify(label),
                    }));
                  }}
                  placeholder="Ej: Pisos Exteriores"
                  className="w-full min-h-[40px] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Slug *{" "}
                  <span className="text-xs font-normal text-gray-400">
                    (auto)
                  </span>
                </label>
                <input
                  value={newCat.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setNewCat((c) => ({
                      ...c,
                      slug: e.target.value
                        .toLowerCase()
                        .replace(/\s+/g, "-"),
                    }));
                  }}
                  placeholder="pisos-exteriores"
                  className="w-full min-h-[40px] rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Descripción
              </label>
              <input
                value={newCat.description ?? ""}
                onChange={(e) =>
                  setNewCat((c) => ({ ...c, description: e.target.value }))
                }
                placeholder="Descripción corta (opcional)"
                className="w-full min-h-[40px] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Ícono
              </label>
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <IconPickerGrid
                  value={newCat.icon}
                  onChange={(icon) => setNewCat((c) => ({ ...c, icon }))}
                />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                  <LucideIcon
                    name={newCat.icon}
                    size={18}
                    className="text-amber-700"
                  />
                </div>
                <span className="text-xs text-gray-500">
                  Ícono{" "}
                  <span className="font-mono text-gray-700">{newCat.icon}</span>{" "}
                  — así se verá en el sitio
                </span>
              </div>
            </div>
            {addError && <p className="text-sm text-red-600">{addError}</p>}
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setNewCat(emptyCategory());
                  setSlugTouched(false);
                  setAddError("");
                }}
                className="min-h-[40px] rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={adding}
                className="min-h-[40px] flex-1 sm:flex-none rounded-xl bg-amber-600 px-5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
              >
                {adding ? "Agregando…" : "Agregar categoría"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
