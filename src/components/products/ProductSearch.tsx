"use client";

import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  type KeyboardEvent,
} from "react";
import { Search, X } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import type { Product, Category } from "@/types";

interface ProductSearchProps {
  products: Product[];
  categories: Category[];
  query: string;
  onQueryChange: (q: string) => void;
  onPickProduct: (p: Product) => void;
}

export function labelForSlug(categories: Category[], slug: string): string {
  return categories.find((c) => c.slug === slug)?.label ?? slug;
}

export default function ProductSearch({
  products,
  categories,
  query,
  onQueryChange,
  onPickProduct,
}: ProductSearchProps) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const q = query.trim().toLowerCase();

  const suggestions = useMemo(() => {
    if (q.length === 0) return [];
    return products
      .filter((p) => {
        const hay = `${p.name} ${p.description ?? ""}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 5);
  }, [products, q]);

  const activeIndex = useMemo(
    () =>
      suggestions.length === 0
        ? 0
        : Math.min(highlighted, suggestions.length - 1),
    [highlighted, suggestions.length]
  );

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const pick = useCallback(
    (p: Product) => {
      onPickProduct(p);
      setOpen(false);
    },
    [onPickProduct]
  );

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp") && suggestions.length > 0) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open || suggestions.length === 0) {
      if (e.key === "Escape") setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const p = suggestions[activeIndex];
      if (p) pick(p);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative w-full max-w-full sm:max-w-xl lg:max-w-none">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none"
          aria-hidden
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            onQueryChange(e.target.value);
            setHighlighted(0);
            setOpen(true);
          }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={onKeyDown}
          aria-label="Buscar productos"
          aria-expanded={open && suggestions.length > 0}
          aria-controls="product-search-suggestions"
          aria-autocomplete="list"
          role="combobox"
          placeholder="Buscar por nombre o descripción…"
          className="w-full border border-brand-primary/25 bg-surface-primary rounded-full pl-10 pr-10 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary transition-shadow"
        />
        {query.length > 0 && (
          <button
            type="button"
            onClick={() => {
              onQueryChange("");
              setHighlighted(0);
              setOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-text-secondary hover:bg-brand-primary/10 hover:text-brand-dark transition-colors"
            aria-label="Limpiar búsqueda"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul
          id="product-search-suggestions"
          role="listbox"
          aria-label="Sugerencias de productos"
          className="absolute z-40 mt-2 w-full rounded-2xl border border-stone-200 bg-surface-primary py-1 shadow-xl ring-1 ring-black/5 max-h-72 overflow-auto"
        >
          {suggestions.map((p, i) => (
            <li key={p.id} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={i === activeIndex}
                onMouseEnter={() => setHighlighted(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(p)}
                className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${
                  i === activeIndex
                    ? "bg-brand-primary/10 text-text-primary"
                    : "text-text-secondary hover:bg-stone-50"
                }`}
              >
                <span className="relative block h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-stone-200 bg-neutral-light">
                  <SafeImage
                    src={p.images[0]?.src ?? "/placeholder.svg"}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="44px"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-text-primary line-clamp-1">
                    {p.name}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {labelForSlug(categories, p.category)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
