"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  Pencil, Trash2, Search, LayoutGrid, List,
  Star, ShoppingCart, MessageCircle, Package,
  ChevronUp, ChevronDown, ChevronsUpDown, X,
  Truck, Wrench, AlertTriangle, Copy, Check,
  FileDown, Globe, BookOpen, Link2,
} from "lucide-react";
import { formatUSD } from "@/lib/money";
import type { Product, Category } from "@/types";

interface Props {
  products: Product[];
  categories: Category[];
  catalogUrl: string;
}

type SortKey = "name" | "category" | "price" | "stock";
type SortDir = "asc" | "desc";
type ViewMode = "table" | "grid";
type VisibilityFilter = "all" | "web" | "catalog" | "inventory";

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

function MiniToggle({
  checked,
  onChange,
  label,
  busy,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  busy?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={busy}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={`relative h-6 w-10 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
        checked ? "bg-emerald-500" : "bg-gray-300"
      }`}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function InlineStock({
  productId,
  stock,
  onSaved,
  onError,
}: {
  productId: string;
  stock: number | null | undefined;
  onSaved: (stock: number | null) => void;
  onError: (msg: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(stock == null ? "" : String(stock));
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    setValue(stock == null ? "" : String(stock));
  }, [stock]);

  async function save() {
    const next =
      value.trim() === "" ? null : Math.max(0, parseInt(value, 10) || 0);
    if (next === (stock ?? null)) {
      setEditing(false);
      return;
    }
    setSaving(true);
    onSaved(next);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        onSaved(stock ?? null);
        onError((data as { error?: string }).error ?? "No se pudo guardar el stock");
      }
    } catch {
      onSaved(stock ?? null);
      onError("Sin conexión: no se pudo guardar el stock");
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setEditing(true);
        }}
        className="text-left hover:opacity-80"
        title="Clic para editar stock"
      >
        <StockBadge stock={stock} />
      </button>
    );
  }

  return (
    <input
      ref={inputRef}
      type="number"
      min={0}
      value={value}
      disabled={saving}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => void save()}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          void save();
        }
        if (e.key === "Escape") {
          setValue(stock == null ? "" : String(stock));
          setEditing(false);
        }
      }}
      className="w-16 rounded-lg border border-amber-300 px-1.5 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
    />
  );
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

export default function ProductsTable({ products: initialProducts, categories, catalogUrl }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [items, setItems] = useState(initialProducts);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [view, setView] = useState<ViewMode>("table");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [copied, setCopied] = useState(false);
  const [patchingId, setPatchingId] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  useEffect(() => {
    setItems(initialProducts);
  }, [initialProducts]);

  const categoryLabel = (slug: string) =>
    categories.find((c) => c.slug === slug)?.label ?? slug;

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2200);
  }

  async function patchProduct(
    id: string,
    body: { showOnWeb?: boolean; showInCatalog?: boolean; stock?: number | null },
    rollback: Product
  ) {
    setPatchingId(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setItems((prev) => prev.map((p) => (p.id === id ? rollback : p)));
        setError((data as { error?: string }).error ?? "No se pudo actualizar");
        return;
      }
      startTransition(() => router.refresh());
    } catch {
      setItems((prev) => prev.map((p) => (p.id === id ? rollback : p)));
      setError("Sin conexión: no se pudo actualizar");
    } finally {
      setPatchingId(null);
    }
  }

  function toggleFlag(product: Product, key: "showOnWeb" | "showInCatalog") {
    const next = !(product[key] !== false);
    const rollback = product;
    setItems((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, [key]: next } : p))
    );
    void patchProduct(product.id, { [key]: next }, rollback);
  }

  async function copyCatalogLink() {
    try {
      await navigator.clipboard.writeText(catalogUrl);
      setCopied(true);
      showToast("Link del catálogo copiado");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("No se pudo copiar el link");
    }
  }

  function downloadPdf() {
    setPdfBusy(true);
    const qs = categoryFilter
      ? `?category=${encodeURIComponent(categoryFilter)}`
      : "";
    const a = document.createElement("a");
    a.href = `/api/catalogo/pdf${qs}`;
    a.download = categoryFilter
      ? `catalogo-fraylin-${categoryFilter}.pdf`
      : "catalogo-fraylin.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast(
      categoryFilter
        ? `PDF de ${categoryLabel(categoryFilter)}`
        : "Descargando PDF completo"
    );
    window.setTimeout(() => setPdfBusy(false), 800);
  }

  const stats = useMemo(
    () => ({
      total: items.length,
      web: items.filter((p) => p.showOnWeb !== false).length,
      catalog: items.filter((p) => p.showInCatalog !== false).length,
      inventoryOnly: items.filter(
        (p) => p.showOnWeb === false && p.showInCatalog === false
      ).length,
      agotado: items.filter((p) => p.stock === 0).length,
    }),
    [items]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = items.filter((p) => {
      if (categoryFilter && p.category !== categoryFilter) return false;
      if (visibilityFilter === "web" && p.showOnWeb === false) return false;
      if (visibilityFilter === "catalog" && p.showInCatalog === false) return false;
      if (
        visibilityFilter === "inventory" &&
        !(p.showOnWeb === false && p.showInCatalog === false)
      ) {
        return false;
      }
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        categoryLabel(p.category).toLowerCase().includes(q) ||
        (p.specs ?? "").toLowerCase().includes(q)
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
  }, [items, categories, query, categoryFilter, visibilityFilter, sortKey, sortDir]);

  const hasFilters = query || categoryFilter || visibilityFilter !== "all";

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

  function handleDeleted(id: string) {
    setError("");
    setItems((prev) => prev.filter((p) => p.id !== id));
    startTransition(() => router.refresh());
  }

  function marginLabel(p: Product) {
    if (p.costCents == null || p.transferPriceCents == null) return null;
    const margin = p.transferPriceCents - p.costCents;
    return (
      <span className={`text-[11px] ${margin >= 0 ? "text-emerald-600" : "text-red-600"}`}>
        Margen {formatUSD(margin)}
      </span>
    );
  }

  const visibilityChips: { id: VisibilityFilter; label: string }[] = [
    { id: "all", label: "Todos" },
    { id: "web", label: "En web" },
    { id: "catalog", label: "En catálogo" },
    { id: "inventory", label: "Solo inventario" },
  ];

  return (
    <div className="space-y-4">
      {/* Acciones catálogo */}
      <div className="flex flex-col gap-2 rounded-2xl border border-amber-100 bg-amber-50/60 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-amber-900">Catálogo compartible</p>
          <p className="truncate text-xs text-amber-800/80">{catalogUrl}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void copyCatalogLink()}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-amber-200 bg-white px-3 text-sm font-medium text-amber-900 hover:bg-amber-50"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copiado" : "Copiar link"}
          </button>
          <a
            href={catalogUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-amber-200 bg-white px-3 text-sm font-medium text-amber-900 hover:bg-amber-50"
          >
            <Link2 className="h-4 w-4" />
            Abrir
          </a>
          <button
            type="button"
            onClick={downloadPdf}
            disabled={pdfBusy}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-amber-600 px-3 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
          >
            <FileDown className="h-4 w-4" />
            {categoryFilter ? "PDF categoría" : "PDF completo"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Total", value: stats.total, color: "text-gray-700", bg: "bg-white" },
          { label: "En web", value: stats.web, color: "text-emerald-700", bg: "bg-emerald-50" },
          { label: "En catálogo", value: stats.catalog, color: "text-sky-700", bg: "bg-sky-50" },
          { label: "Solo inventario", value: stats.inventoryOnly, color: "text-gray-600", bg: "bg-gray-50" },
          { label: "Agotados", value: stats.agotado, color: "text-red-700", bg: "bg-red-50" },
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

      {/* Filtros de visibilidad */}
      <div className="flex flex-wrap gap-1.5">
        {visibilityChips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => setVisibilityFilter(chip.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              visibilityFilter === chip.id
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {chip.label}
          </button>
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
            placeholder="Nombre, ID, categoría o specs…"
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
            {filtered.length} de {items.length} productos
          </span>
          <button
            onClick={() => {
              setQuery("");
              setCategoryFilter("");
              setVisibilityFilter("all");
            }}
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

      {toast && (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          {toast}
        </div>
      )}

      {/* Grid view */}
      {view === "grid" && (
        <div className="hidden md:grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="relative h-40 overflow-hidden bg-gray-50">
                <Thumb product={p} large />
              </div>
              <div className="p-3 space-y-2">
                <p className="truncate text-sm font-semibold leading-snug text-gray-900">{p.name}</p>
                <p className="text-[11px] text-gray-400">{categoryLabel(p.category)}</p>
                <div className="flex items-center justify-between gap-2">
                  <PriceBadge product={p} />
                  <InlineStock
                    productId={p.id}
                    stock={p.stock}
                    onSaved={(stock) =>
                      setItems((prev) =>
                        prev.map((x) => (x.id === p.id ? { ...x, stock } : x))
                      )
                    }
                    onError={setError}
                  />
                </div>
                <div className="flex items-center justify-between gap-3 pt-1">
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-500">
                    <Globe className="h-3 w-3" /> Web
                    <MiniToggle
                      checked={p.showOnWeb !== false}
                      busy={patchingId === p.id}
                      label="Mostrar en web"
                      onChange={() => toggleFlag(p, "showOnWeb")}
                    />
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-500">
                    <BookOpen className="h-3 w-3" /> Cat.
                    <MiniToggle
                      checked={p.showInCatalog !== false}
                      busy={patchingId === p.id}
                      label="Mostrar en catálogo"
                      onChange={() => toggleFlag(p, "showInCatalog")}
                    />
                  </span>
                </div>
                <div className="flex gap-2 pt-1">
                  <Link
                    href={`/admin/products/${p.id}/edit`}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-amber-600 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                  >
                    <Pencil className="h-3 w-3" aria-hidden /> Editar
                  </Link>
                  <div className="inline-flex items-center justify-center rounded-lg border border-red-100 bg-red-50 px-2">
                    <DeleteButton
                      id={p.id}
                      name={p.name}
                      onDeleted={() => handleDeleted(p.id)}
                      onError={setError}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <EmptyState products={items} />}
        </div>
      )}

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {filtered.map((p) => (
          <article
            key={p.id}
            className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <Thumb product={p} />
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold leading-snug text-gray-900">{p.name}</h2>
                <p className="mt-0.5 font-mono text-[11px] text-gray-400">{p.id}</p>
                <p className="mt-0.5 text-xs text-gray-500">{categoryLabel(p.category)}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <PriceBadge product={p} />
              <InlineStock
                productId={p.id}
                stock={p.stock}
                onSaved={(stock) =>
                  setItems((prev) =>
                    prev.map((x) => (x.id === p.id ? { ...x, stock } : x))
                  )
                }
                onError={setError}
              />
            </div>
            <div className="mt-3 flex items-center justify-between gap-4">
              <span className="inline-flex items-center gap-2 text-xs text-gray-600">
                Web
                <MiniToggle
                  checked={p.showOnWeb !== false}
                  busy={patchingId === p.id}
                  label="Mostrar en web"
                  onChange={() => toggleFlag(p, "showOnWeb")}
                />
              </span>
              <span className="inline-flex items-center gap-2 text-xs text-gray-600">
                Catálogo
                <MiniToggle
                  checked={p.showInCatalog !== false}
                  busy={patchingId === p.id}
                  label="Mostrar en catálogo"
                  onChange={() => toggleFlag(p, "showInCatalog")}
                />
              </span>
            </div>
            <div className="mt-3 flex gap-2">
              <Link
                href={`/admin/products/${p.id}/edit`}
                className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-600 px-3 text-sm font-semibold text-white hover:bg-amber-700"
              >
                <Pencil className="h-4 w-4" aria-hidden /> Editar
              </Link>
              <div className="inline-flex min-h-[40px] flex-1 items-center justify-center rounded-xl border border-red-100 bg-red-50">
                <DeleteButton
                  id={p.id}
                  name={p.name}
                  onDeleted={() => handleDeleted(p.id)}
                  onError={setError}
                />
              </div>
            </div>
          </article>
        ))}
        {filtered.length === 0 && <EmptyState products={items} />}
      </div>

      {/* Desktop table */}
      {view === "table" && (
        <div className="hidden overflow-x-auto overscroll-x-contain rounded-2xl border border-gray-200 bg-white shadow-sm md:block">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="border-b border-gray-100 bg-gray-50/80">
              <tr>
                {renderThCol("Producto", "name")}
                {renderThCol("Categoría", "category")}
                {renderThCol("Precio", "price")}
                {renderThCol("Stock", "stock")}
                <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Web
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Catálogo
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Costo
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
                      {p.freeShipping && (
                        <Truck className="h-3.5 w-3.5 text-blue-500" aria-hidden />
                      )}
                      {p.freeInstallation && (
                        <Wrench className="h-3.5 w-3.5 text-purple-500" aria-hidden />
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
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <InlineStock
                      productId={p.id}
                      stock={p.stock}
                      onSaved={(stock) =>
                        setItems((prev) =>
                          prev.map((x) => (x.id === p.id ? { ...x, stock } : x))
                        )
                      }
                      onError={setError}
                    />
                  </td>
                  <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-flex justify-center">
                      <MiniToggle
                        checked={p.showOnWeb !== false}
                        busy={patchingId === p.id}
                        label="Mostrar en web"
                        onChange={() => toggleFlag(p, "showOnWeb")}
                      />
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-flex justify-center">
                      <MiniToggle
                        checked={p.showInCatalog !== false}
                        busy={patchingId === p.id}
                        label="Mostrar en catálogo"
                        onChange={() => toggleFlag(p, "showInCatalog")}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {p.costCents != null ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm text-gray-700">{formatUSD(p.costCents)}</span>
                        {marginLabel(p)}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="inline-flex items-center gap-1 font-medium text-amber-700 hover:text-amber-900"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden /> Editar
                      </Link>
                      <DeleteButton
                        id={p.id}
                        name={p.name}
                        onDeleted={() => handleDeleted(p.id)}
                        onError={setError}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="h-8 w-8 text-gray-300" aria-hidden />
                      <p className="text-sm font-medium text-gray-500">
                        {items.length === 0
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

function EmptyState({ products }: { products: Product[] }) {
  return (
    <div className="col-span-full rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
      <Package className="mx-auto mb-3 h-10 w-10 text-gray-300" aria-hidden />
      <p className="text-sm font-medium text-gray-500">
        {products.length === 0 ? "Sin productos aún" : "Ningún producto coincide"}
      </p>
    </div>
  );
}
