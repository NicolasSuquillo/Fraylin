"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as LucideIcons from "lucide-react";
import {
  parsePriceInput,
  formatUSD,
  transferToCardCents,
} from "@/lib/money";
import type { Product, Category, ProductImage } from "@/types";
import {
  Tag, Hash, Type, AlignLeft, DollarSign, Package,
  ImageIcon, Truck, Wrench, Star, ShoppingCart,
  MessageCircle, ArrowRight, Upload, X, Plus,
  ChevronLeft, AlertTriangle,
} from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────────────────────

function CategoryIcon({ name, size = 14 }: { name: string; size?: number }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (LucideIcons as any)[name] as
    | React.ComponentType<{ size?: number; className?: string }>
    | undefined;
  if (!Icon) return null;
  return <Icon size={size} className="shrink-0" aria-hidden />;
}

function StockBadge({ stock }: { stock: number | null | undefined }) {
  if (stock == null) return null;
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
      {stock} en stock
    </span>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-gray-100 pb-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
        <Icon className="h-4 w-4 text-amber-700" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        {subtitle && (
          <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  sublabel,
  color = "amber",
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  sublabel?: string;
  color?: "amber" | "emerald";
}) {
  const onColor =
    color === "emerald" ? "bg-emerald-500" : "bg-amber-500";
  return (
    <div
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onClick={onChange}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onChange();
        }
      }}
      className="flex cursor-pointer select-none items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
    >
      <div
        className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${checked ? onColor : "bg-gray-300"}`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-1"}`}
        />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {sublabel && (
          <p className="mt-0.5 text-xs text-gray-500">{sublabel}</p>
        )}
      </div>
    </div>
  );
}

// ── Image drop zone ───────────────────────────────────────────────────────────

interface ImageSlotProps {
  idx: number;
  img: ProductImage;
  isFirst: boolean;
  canRemove: boolean;
  uploading: boolean;
  categorySelected: boolean;
  onFileUpload: (idx: number, file: File) => void;
  onAltChange: (idx: number, alt: string) => void;
  onRemove: (idx: number) => void;
}

function ImageSlot({
  idx,
  img,
  isFirst,
  canRemove,
  uploading,
  categorySelected,
  onFileUpload,
  onAltChange,
  onRemove,
}: ImageSlotProps) {
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) onFileUpload(idx, file);
  }

  return (
    <div
      className={`relative overflow-hidden rounded-xl border-2 transition-colors ${
        dragging
          ? "border-amber-400 bg-amber-50"
          : img.src
          ? "border-gray-200 bg-white"
          : "border-dashed border-gray-300 bg-gray-50"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        if (categorySelected) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={categorySelected ? handleDrop : undefined}
    >
      <div className="flex gap-3 p-3">
        {/* Preview */}
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
          {img.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img.src}
              alt={img.alt || "Vista previa"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-gray-400">
              <ImageIcon className="h-5 w-5" aria-hidden />
              {isFirst && (
                <span className="text-[10px] leading-none text-center px-1">
                  {dragging ? "Soltar" : "Sin imagen"}
                </span>
              )}
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-1 flex-col gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            aria-label={`Elegir archivo para imagen ${idx + 1}`}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFileUpload(idx, file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={!categorySelected || uploading}
            title={
              !categorySelected
                ? "Selecciona una categoría primero"
                : img.src
                ? "Cambiar imagen"
                : "Subir imagen"
            }
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center justify-center gap-1.5 min-h-[36px] rounded-lg border border-amber-200 bg-amber-50 px-3 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Upload className="h-3.5 w-3.5" aria-hidden />
            {uploading
              ? "Subiendo…"
              : img.src
              ? "Cambiar"
              : "Subir imagen"}
          </button>
          {!img.src && categorySelected && (
            <p className="text-[11px] text-gray-400">
              O arrastra una imagen aquí
            </p>
          )}
          <input
            value={img.alt}
            onChange={(e) => onAltChange(idx, e.target.value)}
            placeholder="Descripción de la imagen (accesibilidad)"
            className="min-h-[36px] w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            required
          />
        </div>
      </div>

      {/* Remove button */}
      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(idx)}
          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm border border-gray-200 text-gray-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500"
          title="Eliminar imagen"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {/* First badge */}
      {isFirst && img.src && (
        <span className="absolute left-2 top-2 rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white">
          Principal
        </span>
      )}
    </div>
  );
}

// ── Combobox de categoría ─────────────────────────────────────────────────────

interface ComboProps {
  categories: Category[];
  products: Product[];
  value: string;
  onChange: (slug: string) => void;
  disabled?: boolean;
}

function CategoryCombobox({
  categories,
  products,
  value,
  onChange,
  disabled,
}: ComboProps) {
  const selected = categories.find((c) => c.slug === value);
  const [query, setQuery] = useState(selected?.label ?? "");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered =
    query.trim() === "" || query === selected?.label
      ? categories
      : categories.filter(
          (c) =>
            c.label.toLowerCase().includes(query.toLowerCase()) ||
            c.slug.toLowerCase().includes(query.toLowerCase())
        );

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
    if (e.key === "ArrowDown")
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
    else if (e.key === "ArrowUp")
      setHighlighted((h) => Math.max(h - 1, 0));
    else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[highlighted]) select(filtered[highlighted]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery(selected?.label ?? "");
    }
  }

  return (
    <div ref={ref} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={query}
        disabled={disabled}
        placeholder="Escribe o selecciona una categoría…"
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setHighlighted(0);
        }}
        onFocus={() => {
          setOpen(true);
          setHighlighted(0);
        }}
        onKeyDown={handleKeyDown}
        className="w-full min-h-[44px] rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100"
        autoComplete="off"
      />
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        onClick={() => {
          setOpen((o) => !o);
          inputRef.current?.focus();
        }}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:hidden"
        aria-hidden
      >
        {open ? "▲" : "▼"}
      </button>

      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-gray-200 bg-white py-1 text-sm shadow-lg">
          {filtered.map((cat, idx) => {
            const count = products.filter(
              (p) => p.category === cat.slug
            ).length;
            return (
              <li
                key={cat.slug}
                onMouseDown={() => select(cat)}
                onMouseEnter={() => setHighlighted(idx)}
                className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-2 ${
                  idx === highlighted
                    ? "bg-amber-50 text-amber-800"
                    : "text-gray-700 hover:bg-gray-50"
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
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-400 shadow-lg">
          Sin resultados
        </div>
      )}
    </div>
  );
}

// ── Formulario principal ──────────────────────────────────────────────────────

interface Props {
  categories: Category[];
  products: Product[];
  initial?: Product;
  mode: "new" | "edit";
  feeBps: number;
}

function centsToInput(cents: number | null | undefined): string {
  return cents != null ? (cents / 100).toFixed(2) : "";
}

function generateId(
  categorySlug: string,
  existingProducts: Product[]
): string {
  const prefix = categorySlug.replace(/-/g, "").slice(0, 3).toUpperCase();
  let max = 0;
  for (const p of existingProducts) {
    const match = p.id.match(new RegExp(`^${prefix}-(\\d+)$`));
    if (match) max = Math.max(max, parseInt(match[1], 10));
  }
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

function emptyProduct(): Product {
  return {
    id: "",
    category: "",
    name: "",
    priceCents: null,
    transferPriceCents: null,
    stock: null,
    description: "",
    featured: false,
    freeShipping: false,
    freeInstallation: false,
    images: [{ src: "", alt: "" }],
  };
}

export default function ProductForm({
  categories,
  products,
  initial,
  mode,
  feeBps,
}: Props) {
  const router = useRouter();
  const [product, setProduct] = useState<Product>(
    initial ?? emptyProduct()
  );
  const [transferInput, setTransferInput] = useState(
    centsToInput(initial?.transferPriceCents)
  );
  const [cardInput, setCardInput] = useState(
    centsToInput(initial?.priceCents)
  );
  const [installTransferInput, setInstallTransferInput] = useState(
    centsToInput(initial?.installationTransferCents)
  );
  const [installCardInput, setInstallCardInput] = useState(
    centsToInput(initial?.installationCents)
  );
  const [idTouched, setIdTouched] = useState(false);
  const [idFlash, setIdFlash] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const selectedCategory = categories.find(
    (c) => c.slug === product.category
  );

  const idExists =
    mode === "new" &&
    product.id !== "" &&
    products.some((p) => p.id === product.id);

  const priceInvalid =
    (transferInput.trim() !== "" &&
      parsePriceInput(transferInput) == null) ||
    (cardInput.trim() !== "" && parsePriceInput(cardInput) == null);

  const feePct = (feeBps / 100).toLocaleString("es-EC", {
    maximumFractionDigits: 2,
  });

  const surchargeCents =
    product.transferPriceCents != null && product.priceCents != null
      ? product.priceCents - product.transferPriceCents
      : null;

  const installSurchargeCents =
    product.installationTransferCents != null &&
    product.installationCents != null
      ? product.installationCents - product.installationTransferCents
      : null;

  function setField<K extends keyof Product>(key: K, value: Product[K]) {
    setProduct((p) => ({ ...p, [key]: value }));
  }

  function handleTransferChange(value: string) {
    setTransferInput(value);
    const transferCents = parsePriceInput(value);
    setField("transferPriceCents", transferCents);
    if (transferCents == null) {
      setCardInput("");
      setField("priceCents", null);
    } else {
      const cardCents = transferToCardCents(transferCents, feeBps);
      setCardInput((cardCents / 100).toFixed(2));
      setField("priceCents", cardCents);
    }
  }

  function handleCardChange(value: string) {
    setCardInput(value);
    setField("priceCents", parsePriceInput(value));
  }

  function handleInstallTransferChange(value: string) {
    setInstallTransferInput(value);
    const transferCents = parsePriceInput(value);
    setField("installationTransferCents", transferCents);
    if (transferCents == null) {
      setInstallCardInput("");
      setField("installationCents", null);
    } else {
      const cardCents = transferToCardCents(transferCents, feeBps);
      setInstallCardInput((cardCents / 100).toFixed(2));
      setField("installationCents", cardCents);
    }
  }

  function handleInstallCardChange(value: string) {
    setInstallCardInput(value);
    setField("installationCents", parsePriceInput(value));
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

  function setImage(
    idx: number,
    field: keyof ProductImage,
    value: string
  ) {
    setProduct((p) => {
      const images = [...p.images];
      images[idx] = { ...images[idx], [field]: value };
      return { ...p, images };
    });
  }

  function addImage() {
    setProduct((p) => ({
      ...p,
      images: [...p.images, { src: "", alt: "" }],
    }));
  }

  function removeImage(idx: number) {
    setProduct((p) => ({
      ...p,
      images: p.images.filter((_, i) => i !== idx),
    }));
  }

  async function handleFileUpload(idx: number, file: File) {
    if (!product.category) return;
    setUploadingIdx(idx);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("category", product.category);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: form,
      });
      if (res.ok) {
        const { src } = await res.json();
        setProduct((p) => {
          const images = [...p.images];
          const alt = images[idx].alt?.trim() ? images[idx].alt : p.name;
          images[idx] = { ...images[idx], src, alt };
          return { ...p, images };
        });
      } else {
        const data = await res.json().catch(() => ({}));
        setError(
          (data as { error?: string }).error ?? "Error al subir imagen"
        );
      }
    } catch {
      setError("Sin conexión: no se pudo subir la imagen.");
    } finally {
      setUploadingIdx(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (idExists || priceInvalid) return;
    if (!product.category) {
      setError("Selecciona una categoría antes de guardar.");
      return;
    }
    if (product.images.some((im) => !im.src?.trim())) {
      setError("Sube todas las imágenes antes de guardar.");
      return;
    }
    setError("");
    setSaving(true);

    const url =
      mode === "new"
        ? "/api/admin/products"
        : `/api/admin/products/${initial!.id}`;
    const method = mode === "new" ? "POST" : "PUT";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });
      if (res.ok) {
        router.push("/admin/products");
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError((data as { error?: string }).error ?? "Error al guardar");
    } catch {
      setError("Sin conexión: no se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  const mainImageSrc = product.images[0]?.src;
  const extraThumbs = product.images.slice(1).filter((i) => i.src);

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
        {/* ── Left sidebar (desktop) ── */}
        <div className="hidden lg:block">
          <div className="sticky top-6 space-y-4">
            {/* Image preview */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="relative aspect-square bg-gray-50">
                {mainImageSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mainImageSrc}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-300">
                    <Package className="h-12 w-12" aria-hidden />
                    <span className="text-xs text-gray-400">Sin imagen</span>
                  </div>
                )}
              </div>
              {extraThumbs.length > 0 && (
                <div className="flex gap-1.5 overflow-x-auto p-2">
                  {extraThumbs.map((img, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={img.src}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-lg border border-gray-100 object-cover"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Quick summary */}
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Resumen
              </p>
              <div className="space-y-2 text-sm">
                {product.name ? (
                  <p className="font-semibold text-gray-900 leading-snug">
                    {product.name}
                  </p>
                ) : (
                  <p className="text-gray-400 italic">Sin nombre</p>
                )}
                {selectedCategory && (
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <CategoryIcon
                      name={selectedCategory.icon}
                      size={12}
                    />
                    <span className="text-xs">
                      {selectedCategory.label}
                    </span>
                  </div>
                )}
                {product.priceCents != null ? (
                  <div className="flex items-center gap-1 text-green-700 font-medium">
                    <ShoppingCart className="h-3 w-3" aria-hidden />
                    {formatUSD(product.priceCents)}
                  </div>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <MessageCircle className="h-3 w-3" aria-hidden />
                    Solo cotización
                  </span>
                )}
                {product.stock != null && (
                  <StockBadge stock={product.stock} />
                )}
                {product.featured && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                    <Star className="h-3 w-3 fill-current" aria-hidden />
                    Destacado
                  </span>
                )}
                {product.freeShipping && (
                  <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                    <Truck className="h-3 w-3" aria-hidden />
                    Envío gratis
                  </span>
                )}
                {product.freeInstallation && (
                  <span className="inline-flex items-center gap-1 text-xs text-purple-600">
                    <Wrench className="h-3 w-3" aria-hidden />
                    Instalación gratis
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: form sections ── */}
        <div className="space-y-5">

          {/* ── Identidad ── */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
            <SectionHeader
              icon={Tag}
              title="Identidad"
              subtitle="Categoría, ID único y nombre del producto"
            />

            {/* Categoría */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Categoría <span className="text-red-500">*</span>
                {mode === "edit" && (
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    (puedes moverlo; el ID no cambia)
                  </span>
                )}
              </label>
              <CategoryCombobox
                key={product.category}
                categories={categories}
                products={products}
                value={product.category}
                onChange={handleCategoryChange}
              />
            </div>

            {/* ID */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                <span className="inline-flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5 text-gray-400" aria-hidden />
                  ID del producto
                </span>
                {mode === "new" && (
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    (auto — puedes cambiarlo)
                  </span>
                )}
              </label>
              <input
                value={product.id}
                onChange={(e) => {
                  setField("id", e.target.value.toUpperCase());
                  setIdTouched(true);
                }}
                disabled={mode === "edit"}
                placeholder="Selecciona categoría para generar el ID"
                className={`w-full min-h-[44px] rounded-xl border px-3 py-2 text-sm font-mono transition-colors focus:outline-none focus:ring-2 disabled:bg-gray-100 ${
                  idExists
                    ? "border-red-400 bg-red-50 focus:ring-red-400"
                    : idFlash
                    ? "border-amber-400 bg-amber-50 focus:ring-amber-400"
                    : "border-gray-300 focus:ring-amber-500"
                }`}
                required
              />
              {idExists && (
                <p className="mt-1 text-xs text-red-600">
                  Este ID ya existe — modifícalo antes de guardar.
                </p>
              )}
            </div>

            {/* Nombre */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                <span className="inline-flex items-center gap-1.5">
                  <Type className="h-3.5 w-3.5 text-gray-400" aria-hidden />
                  Nombre <span className="text-red-500">*</span>
                </span>
              </label>
              <input
                value={product.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="Ej: Cerámica Mármol Blanco 60x60"
                className="w-full min-h-[44px] rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                <span className="inline-flex items-center gap-1.5">
                  <AlignLeft className="h-3.5 w-3.5 text-gray-400" aria-hidden />
                  Descripción
                </span>
              </label>
              <textarea
                value={product.description ?? ""}
                onChange={(e) => setField("description", e.target.value)}
                rows={3}
                placeholder="Descripción del producto…"
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* ── Precio & Stock ── */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
            <SectionHeader
              icon={DollarSign}
              title="Precio & Stock"
              subtitle="Vacío = producto solo cotizable por WhatsApp"
            />

            {/* Price flow */}
            <div>
              <p className="mb-2 text-xs text-gray-500">
                Ingresa el precio por transferencia/Deuna. El precio con
                tarjeta se calcula sumando la comisión Payphone ({feePct}%) y
                puedes editarlo manualmente.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Transferencia / Deuna
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={transferInput}
                    onChange={(e) => handleTransferChange(e.target.value)}
                    placeholder="Ej: 13.00"
                    className={`w-full min-h-[44px] rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                      priceInvalid
                        ? "border-red-400 bg-red-50 focus:ring-red-400"
                        : "border-gray-300 focus:ring-amber-500"
                    }`}
                  />
                </div>

                {/* Arrow + fee chip */}
                <div className="hidden sm:flex flex-col items-center gap-1 pb-1.5">
                  <ArrowRight className="h-4 w-4 text-gray-400" aria-hidden />
                  {surchargeCents != null && surchargeCents >= 0 && (
                    <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                      +{formatUSD(surchargeCents)}
                    </span>
                  )}
                </div>

                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Tarjeta (Payphone)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={cardInput}
                    onChange={(e) => handleCardChange(e.target.value)}
                    placeholder="Auto"
                    className={`w-full min-h-[44px] rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                      priceInvalid
                        ? "border-red-400 bg-red-50 focus:ring-red-400"
                        : "border-gray-300 focus:ring-amber-500"
                    }`}
                  />
                </div>
              </div>
              {priceInvalid && (
                <p className="mt-2 text-xs text-red-600">
                  Precio inválido — usa solo números, ej: 12.50
                </p>
              )}
            </div>

            {/* Stock */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Stock{" "}
                <span className="text-xs font-normal text-gray-400">
                  (vacío = sin control de inventario)
                </span>
              </label>
              <input
                type="number"
                min={0}
                step={1}
                value={product.stock ?? ""}
                onChange={(e) => {
                  const raw = e.target.value;
                  setField(
                    "stock",
                    raw === "" ? null : Math.max(0, parseInt(raw, 10))
                  );
                }}
                placeholder="Ej: 20"
                className="w-full max-w-[200px] min-h-[44px] rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              {product.stock != null && (
                <div className="mt-2">
                  <StockBadge stock={product.stock} />
                </div>
              )}
            </div>
          </div>

          {/* ── Logística & Beneficios ── */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
            <SectionHeader
              icon={Truck}
              title="Logística & Beneficios"
              subtitle="Destacado, envío e instalación"
            />

            <Toggle
              checked={!!product.featured}
              onChange={() => setField("featured", !product.featured)}
              label="Destacado"
              sublabel="Aparece en la sección de inicio"
            />

            {product.transferPriceCents != null && (
              <>
                <Toggle
                  checked={!!product.freeShipping}
                  onChange={() =>
                    setField("freeShipping", !product.freeShipping)
                  }
                  color="emerald"
                  label="Envío gratis"
                  sublabel="No se cobra envío al cliente"
                />

                <Toggle
                  checked={!!product.freeInstallation}
                  onChange={() => {
                    const newVal = !product.freeInstallation;
                    setField("freeInstallation", newVal);
                    if (newVal) {
                      setField("installationCents", null);
                      setField("installationTransferCents", null);
                      setInstallTransferInput("");
                      setInstallCardInput("");
                    }
                  }}
                  color="emerald"
                  label="Instalación gratis"
                  sublabel="No se cobra instalación al cliente"
                />

                {!product.freeInstallation && (
                  <div className="ml-13 rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-2">
                    <p className="text-xs font-medium text-gray-600">
                      Precio de instalación{" "}
                      <span className="font-normal text-gray-400">
                        (vacío = precio global de ajustes)
                      </span>
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-[11px] text-gray-500">
                          Transferencia/Deuna
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={installTransferInput}
                          onChange={(e) =>
                            handleInstallTransferChange(e.target.value)
                          }
                          placeholder="Ej: 15.00"
                          className="w-full min-h-[40px] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] text-gray-500">
                          Con tarjeta (Payphone)
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={installCardInput}
                          onChange={(e) =>
                            handleInstallCardChange(e.target.value)
                          }
                          placeholder="Auto"
                          className="w-full min-h-[40px] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        {installSurchargeCents != null &&
                          installSurchargeCents >= 0 && (
                            <p className="mt-1 text-[11px] text-gray-500">
                              +{formatUSD(installSurchargeCents)} ({feePct}%)
                            </p>
                          )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Imágenes ── */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-start justify-between">
              <SectionHeader
                icon={ImageIcon}
                title="Imágenes"
                subtitle="Primera imagen = imagen principal del producto"
              />
              <button
                type="button"
                onClick={addImage}
                className="ml-4 inline-flex shrink-0 items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
                Agregar
              </button>
            </div>

            <div className="space-y-2">
              {product.images.map((img, idx) => (
                <ImageSlot
                  key={idx}
                  idx={idx}
                  img={img}
                  isFirst={idx === 0}
                  canRemove={product.images.length > 1}
                  uploading={uploadingIdx === idx}
                  categorySelected={!!product.category}
                  onFileUpload={handleFileUpload}
                  onAltChange={(i, alt) => setImage(i, "alt", alt)}
                  onRemove={removeImage}
                />
              ))}
            </div>
          </div>

          {/* ── Error + Actions ── */}
          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
              {error}
              <button
                type="button"
                onClick={() => setError("")}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
            <Link
              href="/admin/products"
              className="inline-flex min-h-[48px] sm:min-h-0 items-center justify-center rounded-xl border border-gray-200 px-5 py-3 text-center text-sm font-medium text-gray-600 transition hover:border-gray-300 sm:py-2.5"
            >
              <ChevronLeft className="mr-1 h-4 w-4" aria-hidden />
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving || idExists || priceInvalid}
              className="min-h-[48px] sm:min-h-0 w-full sm:w-auto rounded-xl bg-amber-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50 sm:py-2.5"
            >
              {saving
                ? "Guardando…"
                : mode === "new"
                ? "Crear producto"
                : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
