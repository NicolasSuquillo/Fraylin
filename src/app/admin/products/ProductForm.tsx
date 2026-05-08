"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as LucideIcons from "lucide-react";
import type { Product, Category, ProductImage } from "@/types";

function CategoryIcon({ name, size = 14 }: { name: string; size?: number }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (LucideIcons as any)[name] as React.ComponentType<{ size?: number; className?: string }> | undefined;
  if (!Icon) return null;
  return <Icon size={size} className="text-gray-400 shrink-0" />;
}

interface Props {
  categories: Category[];
  products: Product[];
  initial?: Product;
  mode: "new" | "edit";
}

function generateId(categorySlug: string, existingProducts: Product[]): string {
  const prefix = categorySlug.replace(/-/g, "").slice(0, 3).toUpperCase();
  const count = existingProducts.filter((p) => p.category === categorySlug).length;
  const seq = String(count + 1).padStart(3, "0");
  return `${prefix}-${seq}`;
}

function emptyProduct(): Product {
  return { id: "", category: "", name: "", price: "", description: "", featured: false, images: [{ src: "", alt: "" }] };
}

// ── Combo filtrable ──────────────────────────────────────────────────────────

interface ComboProps {
  categories: Category[];
  products: Product[];
  value: string;
  onChange: (slug: string) => void;
  disabled?: boolean;
}

function CategoryCombobox({ categories, products, value, onChange, disabled }: ComboProps) {
  const selected = categories.find((c) => c.slug === value);
  const [query, setQuery] = useState(selected?.label ?? "");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.trim() === "" || query === selected?.label
    ? categories
    : categories.filter(
        (c) =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          c.slug.toLowerCase().includes(query.toLowerCase())
      );

  useEffect(() => {
    setQuery(selected?.label ?? "");
  }, [selected?.label]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery(selected?.label ?? "");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selected?.label]);

  function select(cat: Category) {
    onChange(cat.slug);
    setQuery(cat.label);
    setOpen(false);
    setHighlighted(0);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
    else if (e.key === "ArrowUp") setHighlighted((h) => Math.max(h - 1, 0));
    else if (e.key === "Enter") { e.preventDefault(); if (filtered[highlighted]) select(filtered[highlighted]); }
    else if (e.key === "Escape") { setOpen(false); setQuery(selected?.label ?? ""); }
  }

  return (
    <div ref={ref} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={query}
        disabled={disabled}
        placeholder="Escribe o selecciona una categoría..."
        onChange={(e) => { setQuery(e.target.value); setOpen(true); setHighlighted(0); }}
        onFocus={() => { setOpen(true); setHighlighted(0); }}
        onKeyDown={handleKeyDown}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100"
        autoComplete="off"
      />
      {/* flecha */}
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        onClick={() => { setOpen((o) => !o); inputRef.current?.focus(); }}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:hidden"
      >
        {open ? "▲" : "▼"}
      </button>

      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-auto text-sm">
          {filtered.map((cat, idx) => {
            const count = products.filter((p) => p.category === cat.slug).length;
            return (
              <li
                key={cat.slug}
                onMouseDown={() => select(cat)}
                onMouseEnter={() => setHighlighted(idx)}
                className={`px-3 py-2 cursor-pointer flex items-center justify-between gap-2 ${
                  idx === highlighted ? "bg-amber-50 text-amber-800" : "text-gray-700 hover:bg-gray-50"
                } ${cat.slug === value ? "font-semibold" : ""}`}
              >
                <span className="flex items-center gap-2">
                  <CategoryIcon name={cat.icon} size={14} />
                  {cat.label}
                </span>
                <span className="text-xs text-gray-400">{count} prod.</span>
              </li>
            );
          })}
        </ul>
      )}

      {open && filtered.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm text-gray-400">
          Sin resultados
        </div>
      )}
    </div>
  );
}

// ── Formulario principal ─────────────────────────────────────────────────────

export default function ProductForm({ categories, products, initial, mode }: Props) {
  const router = useRouter();
  const [product, setProduct] = useState<Product>(initial ?? emptyProduct());
  const [idTouched, setIdTouched] = useState(false);
  const [idFlash, setIdFlash] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const idExists =
    mode === "new" &&
    product.id !== "" &&
    products.some((p) => p.id === product.id);

  function setField<K extends keyof Product>(key: K, value: Product[K]) {
    setProduct((p) => ({ ...p, [key]: value }));
  }

  function handleCategoryChange(slug: string) {
    setField("category", slug);
    if (mode === "new" && !idTouched) {
      const newId = generateId(slug, products);
      setField("id", newId);
      setIdFlash(true);
      setTimeout(() => setIdFlash(false), 600);
    }
  }

  function setImage(idx: number, field: keyof ProductImage, value: string) {
    setProduct((p) => {
      const images = [...p.images];
      images[idx] = { ...images[idx], [field]: value };
      return { ...p, images };
    });
  }

  function addImage() {
    setProduct((p) => ({ ...p, images: [...p.images, { src: "", alt: "" }] }));
  }

  function removeImage(idx: number) {
    setProduct((p) => ({ ...p, images: p.images.filter((_, i) => i !== idx) }));
  }

  async function handleFileUpload(idx: number, file: File) {
    if (!product.category) return;
    setUploadingIdx(idx);
    const form = new FormData();
    form.append("file", file);
    form.append("category", product.category);
    const res = await fetch("/api/admin/upload", { method: "POST", body: form });
    setUploadingIdx(null);
    if (res.ok) {
      const { src } = await res.json();
      setImage(idx, "src", src);
    } else {
      const data = await res.json();
      setError(data.error ?? "Error al subir imagen");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (idExists) return;
    if (product.images.some((im) => !im.src?.trim())) {
      setError("Sube todas las imágenes antes de guardar.");
      return;
    }
    setError("");
    setSaving(true);

    const url = mode === "new" ? "/api/admin/products" : `/api/admin/products/${initial!.id}`;
    const method = mode === "new" ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });

    setSaving(false);

    if (res.ok) {
      router.push("/admin/products");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? "Error al guardar");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-6 max-w-2xl">

      {/* Categoría */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Categoría <span className="text-red-500">*</span>
        </label>
        <CategoryCombobox
          categories={categories}
          products={products}
          value={product.category}
          onChange={handleCategoryChange}
          disabled={mode === "edit"}
        />
      </div>

      {/* ID */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ID del producto
          {mode === "new" && (
            <span className="ml-2 text-xs text-gray-400 font-normal">
              (se genera automáticamente, puedes cambiarlo)
            </span>
          )}
        </label>
        <input
          value={product.id}
          onChange={(e) => { setField("id", e.target.value.toUpperCase()); setIdTouched(true); }}
          disabled={mode === "edit"}
          placeholder="Selecciona una categoría para generar el ID"
          className={`w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 transition-colors disabled:bg-gray-100 ${
            idExists
              ? "border-red-400 focus:ring-red-400 bg-red-50"
              : idFlash
              ? "border-amber-400 bg-amber-50 focus:ring-amber-400"
              : "border-gray-300 focus:ring-amber-500"
          }`}
          required
        />
        {idExists && (
          <p className="text-red-600 text-xs mt-1">Este ID ya existe — modifícalo antes de guardar.</p>
        )}
      </div>

      {/* Nombre */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre <span className="text-red-500">*</span>
        </label>
        <input
          value={product.name}
          onChange={(e) => setField("name", e.target.value)}
          placeholder="Ej: Cerámica Mármol Blanco 60x60"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          required
        />
      </div>

      {/* Precio */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
        <input
          value={product.price ?? ""}
          onChange={(e) => setField("price", e.target.value)}
          placeholder="Ej: desde $18/m²"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
        <textarea
          value={product.description ?? ""}
          onChange={(e) => setField("description", e.target.value)}
          rows={3}
          placeholder="Descripción del producto..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {/* Destacado */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <div
          onClick={() => setField("featured", !product.featured)}
          className={`w-10 h-6 rounded-full transition-colors ${product.featured ? "bg-amber-500" : "bg-gray-300"} relative`}
        >
          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${product.featured ? "translate-x-5" : "translate-x-1"}`} />
        </div>
        <span className="text-sm font-medium text-gray-700">
          Destacado <span className="text-gray-400 font-normal">(aparece en inicio)</span>
        </span>
      </label>

      {/* Imágenes */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Imágenes <span className="text-red-500">*</span>
          </label>
          <button type="button" onClick={addImage} className="text-xs text-amber-600 hover:underline">
            + Agregar imagen
          </button>
        </div>
        <div className="space-y-3">
          {product.images.map((img, idx) => (
            <div key={idx} className="flex gap-2 items-start bg-gray-50 rounded-lg p-3">
              <span className="text-xs text-gray-400 mt-2 w-5 shrink-0">{idx + 1}.</span>
              <div className="flex-1 space-y-2">
                {/* Preview + upload */}
                <div className="flex gap-2 items-center flex-wrap">
                  {img.src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img.src}
                      alt={img.alt || "Vista previa"}
                      className="w-14 h-14 object-cover rounded-lg border border-gray-200 shrink-0"
                    />
                  ) : (
                    <div
                      className="w-14 h-14 rounded-lg border border-dashed border-gray-300 bg-white shrink-0 flex items-center justify-center text-[10px] text-gray-400 text-center px-1"
                      aria-hidden
                    >
                      Sin archivo
                    </div>
                  )}
                  <input
                    ref={(el) => { fileInputRefs.current[idx] = el; }}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    tabIndex={-1}
                    aria-label={`Elegir archivo para imagen ${idx + 1}`}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(idx, file);
                      e.target.value = "";
                    }}
                  />
                  <button
                    type="button"
                    disabled={!product.category || uploadingIdx === idx}
                    title={!product.category ? "Selecciona una categoría primero" : img.src ? "Cambiar imagen" : "Subir imagen"}
                    onClick={() => fileInputRefs.current[idx]?.click()}
                    className="shrink-0 px-4 py-2 text-sm rounded-lg border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 transition disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                  >
                    {uploadingIdx === idx ? "Subiendo…" : img.src ? "Cambiar imagen" : "Subir imagen"}
                  </button>
                </div>
                <input
                  value={img.alt}
                  onChange={(e) => setImage(idx, "alt", e.target.value)}
                  placeholder="Descripción de la imagen (para accesibilidad)"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              {product.images.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="text-red-400 hover:text-red-600 text-xl mt-1 shrink-0"
                  title="Eliminar imagen"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving || idExists}
          className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-5 py-2 rounded-lg text-sm transition disabled:opacity-50"
        >
          {saving ? "Guardando..." : mode === "new" ? "Crear producto" : "Guardar cambios"}
        </button>
        <a
          href="/admin/products"
          className="text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg text-sm border border-gray-200 hover:border-gray-300 transition"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
