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
  transferTotalCents: number;
  count: number;
  isOpen: boolean;
  open(): void;
  close(): void;
  allFreeShipping: boolean;
  allFreeInstallation: boolean;
  freeShippingCount: number;
  freeInstallationCount: number;
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
      transferPriceCents: product.transferPriceCents ?? product.priceCents,
      image: product.images[0]?.src ?? item.image,
      stock: product.stock,
      quantity: clampQuantity(item.quantity, product.stock),
      freeShipping: product.freeShipping,
      freeInstallation: product.freeInstallation,
      installationCents: product.installationCents,
      installationTransferCents: product.installationTransferCents,
    };
    if (
      synced.name !== item.name ||
      synced.priceCents !== item.priceCents ||
      synced.transferPriceCents !== item.transferPriceCents ||
      synced.image !== item.image ||
      synced.stock !== item.stock ||
      synced.quantity !== item.quantity ||
      synced.freeShipping !== item.freeShipping ||
      synced.freeInstallation !== item.freeInstallation ||
      synced.installationCents !== item.installationCents ||
      synced.installationTransferCents !== item.installationTransferCents
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
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        // Descartar ítems con forma inválida (precio/cantidad no numéricos) para
        // no envenenar los totales con NaN o concatenación de strings.
        const safe = Array.isArray(parsed)
          ? (parsed as CartItem[]).filter(
              (it) =>
                it &&
                typeof it.productId === "string" &&
                typeof it.priceCents === "number" &&
                Number.isFinite(it.priceCents) &&
                typeof it.quantity === "number" &&
                Number.isFinite(it.quantity)
            )
          : [];
        // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratación única desde localStorage tras montar
        setItems(safe);
      }
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

  const transferTotalCents = useMemo(
    () =>
      items.reduce(
        (sum, i) => sum + (i.transferPriceCents ?? i.priceCents) * i.quantity,
        0
      ),
    [items]
  );

  const count = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const allFreeShipping = useMemo(
    () => items.length > 0 && items.every((i) => i.freeShipping === true),
    [items]
  );

  const allFreeInstallation = useMemo(
    () => items.length > 0 && items.every((i) => i.freeInstallation === true),
    [items]
  );

  const freeShippingCount = useMemo(
    () => items.filter((i) => i.freeShipping === true).length,
    [items]
  );

  const freeInstallationCount = useMemo(
    () => items.filter((i) => i.freeInstallation === true).length,
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
    transferTotalCents,
    count,
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    allFreeShipping,
    allFreeInstallation,
    freeShippingCount,
    freeInstallationCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
