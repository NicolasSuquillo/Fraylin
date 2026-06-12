"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CartItem, Product } from "@/types";

const STORAGE_KEY = "fraylin_cart_v1";

interface CartContextValue {
  items: CartItem[];
  addItem(item: Omit<CartItem, "quantity">, qty?: number): void;
  removeItem(productId: string): void;
  setQuantity(productId: string, qty: number): void;
  syncProducts(products: Product[]): void;
  clear(): void;
  totalCents: number;
  count: number;
  isOpen: boolean;
  open(): void;
  close(): void;
}

const CartContext = createContext<CartContextValue | null>(null);

function clampQuantity(qty: number, stock?: number | null) {
  const safeQty = Math.max(1, Math.floor(qty) || 1);
  if (stock == null) return safeQty;
  return Math.min(safeQty, Math.max(stock, 0));
}

function reconcileItems(items: CartItem[], catalog: Map<string, Product>): CartItem[] {
  let changed = false;
  const next: CartItem[] = [];
  for (const item of items) {
    const product = catalog.get(item.productId);
    // Producto eliminado, sin precio en línea o agotado → fuera del carrito
    if (!product || product.priceCents == null || product.stock === 0) {
      changed = true;
      continue;
    }
    const synced: CartItem = {
      ...item,
      name: product.name,
      priceCents: product.priceCents,
      image: product.images[0]?.src ?? item.image,
      stock: product.stock,
      quantity: clampQuantity(item.quantity, product.stock),
    };
    if (
      synced.name !== item.name ||
      synced.priceCents !== item.priceCents ||
      synced.image !== item.image ||
      synced.stock !== item.stock ||
      synced.quantity !== item.quantity
    ) {
      changed = true;
    }
    next.push(synced);
  }
  return changed ? next : items;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [catalog, setCatalog] = useState<Map<string, Product> | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratación única desde localStorage tras montar
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignorar storage corrupto
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  // Reconciliar tras hidratar: la página pública publica el catálogo vigente
  // (precio/stock/nombre) y los ítems guardados en localStorage se actualizan.
  useEffect(() => {
    if (!hydrated || !catalog) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reconciliación única por catálogo; devuelve la misma referencia si no hay cambios
    setItems((prev) => reconcileItems(prev, catalog));
  }, [hydrated, catalog]);

  const syncProducts = useCallback((products: Product[]) => {
    setCatalog(new Map(products.map((p) => [p.id, p])));
  }, []);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity">, qty = 1) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.productId === item.productId);
        if (existing) {
          return prev.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: clampQuantity(i.quantity + qty, item.stock) }
              : i
          );
        }
        return [...prev, { ...item, quantity: clampQuantity(qty, item.stock) }];
      });
      setIsOpen(true);
    },
    []
  );

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const setQuantity = useCallback((productId: string, qty: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId
          ? { ...i, quantity: clampQuantity(qty, i.stock) }
          : i
      )
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const totalCents = useMemo(
    () => items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0),
    [items]
  );

  const count = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const value: CartContextValue = {
    items,
    addItem,
    removeItem,
    setQuantity,
    syncProducts,
    clear,
    totalCents,
    count,
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
