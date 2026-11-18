"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  Loader2,
  MapPin,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingBag,
  Store,
  Trash2,
  Truck,
  User,
  Wrench,
  X,
} from "lucide-react";
import { computeTaxBreakdown, formatUSD, parsePriceInput } from "@/lib/money";
import type { ShippingZonePrice } from "@/lib/pricing";
import type { Category, FulfillmentStatus, Product } from "@/types";

interface Props {
  products: Product[];
  categories: Category[];
  zones: ShippingZonePrice[];
  defaultInstallationCents: number;
  initialProductId?: string;
}

interface OrderDraftLine {
  product: Product;
  quantity: number;
  unitPriceInput: string;
}

const FULFILLMENT_OPTIONS: Array<{
  value: FulfillmentStatus;
  label: string;
  hint: string;
}> = [
  { value: "nuevo", label: "Recibido", hint: "Recién registrado" },
  { value: "preparando", label: "En preparación", hint: "Alistando en bodega" },
  { value: "coordinado", label: "Coordinado", hint: "Listo o en ruta" },
  { value: "entregado", label: "Entregado", hint: "Finalizado" },
];

function centsToInput(cents: number | null | undefined): string {
  if (cents == null) return "";
  return (cents / 100).toFixed(2);
}

function defaultUnitCents(product: Product): number | null {
  return product.transferPriceCents ?? product.priceCents ?? null;
}

export default function NewOrderForm({
  products,
  categories,
  zones,
  defaultInstallationCents,
  initialProductId,
}: Props) {
  const router = useRouter();
  const initialProduct = initialProductId
    ? products.find((p) => p.id === initialProductId)
    : undefined;

  const [lines, setLines] = useState<OrderDraftLine[]>(() => {
    if (!initialProduct) return [];
    if (initialProduct.stock === 0) return [];
    return [
      {
        product: initialProduct,
        quantity: 1,
        unitPriceInput: centsToInput(defaultUnitCents(initialProduct)),
      },
    ];
  });

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [deliveryMode, setDeliveryMode] = useState<"delivery" | "pickup">("delivery");
  const [customerAddress, setCustomerAddress] = useState("");
  const [selectedZoneId, setSelectedZoneId] = useState<string>(zones[0]?.id ?? "custom");
  const [customShippingInput, setCustomShippingInput] = useState<string>(() =>
    centsToInput(zones[0]?.transferCents ?? 0)
  );

  const [includeInstallation, setIncludeInstallation] = useState(false);
  const [installationInput, setInstallationInput] = useState<string>(() =>
    centsToInput(defaultInstallationCents)
  );

  const [initialStatus, setInitialStatus] = useState<"paid" | "pending">("paid");
  const [fulfillmentStatus, setFulfillmentStatus] = useState<FulfillmentStatus>("nuevo");
  const [trackingNote, setTrackingNote] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const categoryLabels = useMemo(
    () => new Map(categories.map((c) => [c.slug, c.label])),
    [categories]
  );

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (categoryFilter && p.category !== categoryFilter) return false;
      if (!q) return true;
      const catLabel = categoryLabels.get(p.category) ?? p.category;
      return (
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        catLabel.toLowerCase().includes(q) ||
        (p.specs ?? "").toLowerCase().includes(q)
      );
    });
  }, [products, search, categoryFilter, categoryLabels]);

  const lineQtyByProductId = useMemo(
    () => new Map(lines.map((l) => [l.product.id, l.quantity])),
    [lines]
  );

  function addProduct(product: Product) {
    setError(null);
    if (product.stock === 0) {
      setError(`"${product.name}" figura como agotado en inventario.`);
      return;
    }
    setLines((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        const maxQty = product.stock ?? 99;
        if (existing.quantity >= Math.min(maxQty, 99)) return prev;
        return prev.map((l) =>
          l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [
        ...prev,
        {
          product,
          quantity: 1,
          unitPriceInput: centsToInput(defaultUnitCents(product)),
        },
      ];
    });
  }

  function updateQuantity(productId: string, delta: number) {
    setLines((prev) =>
      prev
        .map((l) => {
          if (l.product.id !== productId) return l;
          const nextQty = l.quantity + delta;
          if (nextQty <= 0) return null;
          const maxStock = l.product.stock ?? 99;
          const clamped = Math.min(nextQty, Math.min(maxStock, 99));
          return { ...l, quantity: clamped };
        })
        .filter((l): l is OrderDraftLine => l !== null)
    );
  }

  function updateUnitPrice(productId: string, value: string) {
    setLines((prev) =>
      prev.map((l) => (l.product.id === productId ? { ...l, unitPriceInput: value } : l))
    );
  }

  function removeLine(productId: string) {
    setLines((prev) => prev.filter((l) => l.product.id !== productId));
  }

  function handleZoneChange(zoneId: string) {
    setSelectedZoneId(zoneId);
    if (zoneId === "free") {
      setCustomShippingInput("0.00");
      return;
    }
    const z = zones.find((item) => item.id === zoneId);
    if (z) {
      setCustomShippingInput(centsToInput(z.transferCents));
    }
  }

  function switchDeliveryMode(mode: "delivery" | "pickup") {
    setDeliveryMode(mode);
    if (mode === "pickup") {
      if (!customerAddress.trim()) {
        setCustomerAddress("Retiro en local Fraylin (Comité del Pueblo, Quito)");
      }
    } else if (customerAddress === "Retiro en local Fraylin (Comité del Pueblo, Quito)") {
      setCustomerAddress("");
    }
  }

  const parsedLines = useMemo(() => {
    return lines.map((l) => {
      const unitCents = parsePriceInput(l.unitPriceInput);
      return {
        ...l,
        unitCents,
        lineTotalCents: unitCents != null ? unitCents * l.quantity : null,
      };
    });
  }, [lines]);

  const shippingCents = useMemo(() => {
    if (deliveryMode === "pickup") return 0;
    const parsed = parsePriceInput(customShippingInput);
    return parsed ?? 0;
  }, [deliveryMode, customShippingInput]);

  const installationCents = useMemo(() => {
    if (!includeInstallation) return 0;
    const parsed = parsePriceInput(installationInput);
    return parsed ?? 0;
  }, [includeInstallation, installationInput]);

  const productsSubtotalCents = useMemo(() => {
    return parsedLines.reduce((sum, l) => sum + (l.lineTotalCents ?? 0), 0);
  }, [parsedLines]);

  const totalCents = productsSubtotalCents + shippingCents + installationCents;
  const { subtotalCents, taxCents } = computeTaxBreakdown(totalCents);
  const phoneDigits = customerPhone.replace(/\D/g, "");
  const phoneLast4 = phoneDigits.length >= 4 ? phoneDigits.slice(-4) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;
    setError(null);

    if (lines.length === 0) {
      setError("Agrega al menos un producto del inventario.");
      return;
    }

    for (const line of parsedLines) {
      if (line.unitCents == null) {
        setError(`Ingresa un precio válido para "${line.product.name}".`);
        return;
      }
    }

    if (customerName.trim().length < 2) {
      setError("Ingresa el nombre completo del cliente.");
      return;
    }
    if (phoneDigits.length < 7) {
      setError("Ingresa un teléfono válido (mínimo 7 dígitos).");
      return;
    }
    const trimmedEmail = customerEmail.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmedEmail)) {
      setError("El correo electrónico ingresado no es válido.");
      return;
    }
    const effectiveAddress =
      deliveryMode === "pickup"
        ? customerAddress.trim() || "Retiro en local Fraylin (Comité del Pueblo, Quito)"
        : customerAddress.trim();
    if (effectiveAddress.length < 3) {
      setError("Ingresa la dirección de entrega o selecciona retiro en tienda.");
      return;
    }

    if (initialStatus === "pending" && fulfillmentStatus === "entregado") {
      setError("Un pedido pendiente de cobro no puede registrarse como Entregado.");
      return;
    }

    const parsedShip = deliveryMode === "pickup" ? 0 : parsePriceInput(customShippingInput);
    if (parsedShip == null) {
      setError("El monto de envío no es válido.");
      return;
    }

    const parsedInst = includeInstallation ? parsePriceInput(installationInput) : 0;
    if (parsedInst == null) {
      setError("El monto de instalación no es válido.");
      return;
    }

    const zoneLabel =
      deliveryMode === "pickup"
        ? "Retiro en tienda Fraylin"
        : selectedZoneId === "free"
          ? "Envío gratis"
          : selectedZoneId === "custom"
            ? "Envío coordinado"
            : zones.find((z) => z.id === selectedZoneId)?.label ?? "Envío coordinado";

    submittingRef.current = true;
    setSubmitting(true);
    let succeeded = false;
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: customerName.trim(),
            phone: customerPhone.trim(),
            email: trimmedEmail || null,
            address: effectiveAddress,
          },
          items: parsedLines.map((l) => ({
            productId: l.product.id,
            quantity: l.quantity,
            unitPriceCents: l.unitCents!,
          })),
          initialStatus,
          fulfillmentStatus,
          shippingCents: parsedShip,
          installationCents: parsedInst,
          shippingZoneLabel: zoneLabel,
          trackingNote: trackingNote.trim() || null,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        order?: { id: string };
      };

      if (!res.ok || !data.order) {
        setError(data.error ?? "No se pudo crear el pedido.");
        return;
      }

      succeeded = true;
      router.push(`/admin/orders/${data.order.id}?created=1`);
      router.refresh();
    } catch {
      setError("Error de conexión al guardar el pedido.");
    } finally {
      if (!succeeded) {
        submittingRef.current = false;
        setSubmitting(false);
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        {/* Columna izquierda: Selector de productos */}
        <div className="space-y-4 lg:col-span-7">
          <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                  <Package className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    1. Selecciona los productos
                  </h2>
                  <p className="text-xs text-gray-500">
                    Toca un producto del inventario para añadirlo al pedido
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                {filteredProducts.length} disp.
              </span>
            </div>

            {/* Buscador */}
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                aria-hidden
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar producto por nombre, código o medidas…"
                className="w-full min-h-[44px] rounded-xl border border-gray-200 bg-gray-50/70 pl-10 pr-9 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Chips de categorías */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
              <button
                type="button"
                onClick={() => setCategoryFilter("")}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  categoryFilter === ""
                    ? "bg-gray-900 text-white"
                    : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                Todas
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => setCategoryFilter(cat.slug)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    categoryFilter === cat.slug
                      ? "bg-gray-900 text-white"
                      : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Listado de productos */}
            <div className="max-h-[380px] overflow-y-auto overscroll-contain space-y-2 pr-1">
              {filteredProducts.length === 0 ? (
                <p className="rounded-xl border border-dashed border-gray-200 py-8 text-center text-sm text-gray-500">
                  No se encontraron productos con ese criterio.
                </p>
              ) : (
                filteredProducts.map((p) => {
                  const inOrderQty = lineQtyByProductId.get(p.id) ?? 0;
                  const soldOut = p.stock === 0;
                  const unitCents = defaultUnitCents(p);
                  const imgSrc = p.images[0]?.src;

                  return (
                    <div
                      key={p.id}
                      className={`flex items-center gap-3 rounded-xl border p-2.5 transition ${
                        inOrderQty > 0
                          ? "border-amber-300 bg-amber-50/40"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      {imgSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imgSrc}
                          alt=""
                          className="h-14 w-14 shrink-0 rounded-lg border border-gray-100 object-cover bg-gray-50"
                        />
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50">
                          <Package className="h-5 w-5 text-gray-300" aria-hidden />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900">{p.name}</p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                          <span className="text-gray-500">
                            {categoryLabels.get(p.category) ?? p.category}
                          </span>
                          <span className="font-semibold text-emerald-700">
                            {unitCents != null ? formatUSD(unitCents) : "Cotizar / editable"}
                          </span>
                          {p.stock != null && (
                            <span
                              className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                                soldOut
                                  ? "bg-red-100 text-red-700"
                                  : p.stock <= 5
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-green-100 text-green-800"
                              }`}
                            >
                              {soldOut ? "Agotado" : `${p.stock} disp.`}
                            </span>
                          )}
                        </div>
                      </div>

                      {inOrderQty > 0 ? (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => updateQuantity(p.id, -1)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 active:bg-gray-100"
                            aria-label={`Quitar uno de ${p.name}`}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-7 text-center text-sm font-bold text-amber-900">
                            {inOrderQty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(p.id, 1)}
                            disabled={p.stock != null && inOrderQty >= p.stock}
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-600 text-white active:bg-amber-700 disabled:opacity-40"
                            aria-label={`Agregar uno más de ${p.name}`}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={soldOut}
                          onClick={() => addProduct(p)}
                          className="inline-flex min-h-[40px] shrink-0 items-center gap-1 rounded-xl bg-amber-600 px-3 text-xs font-semibold text-white transition hover:bg-amber-700 active:scale-[0.98] disabled:bg-gray-200 disabled:text-gray-400"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Agregar
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Líneas seleccionadas */}
          <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                  <ShoppingBag className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    Productos en este pedido
                  </h2>
                  <p className="text-xs text-gray-500">
                    Ajusta cantidades o el precio unitario acordado con el cliente
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900">
                {lines.reduce((s, l) => s + l.quantity, 0)} u.
              </span>
            </div>

            {parsedLines.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/70 py-8 px-4 text-center">
                <p className="text-sm font-medium text-gray-600">
                  Aún no has agregado productos
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Selecciona uno o más productos en el catálogo superior.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {parsedLines.map((line) => (
                  <div
                    key={line.product.id}
                    className="rounded-xl border border-gray-200 bg-gray-50/50 p-3 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 leading-snug">
                          {line.product.name}
                        </p>
                        <p className="text-[11px] font-mono text-gray-400">
                          {line.product.id}
                          {line.product.stock != null ? ` · Stock: ${line.product.stock}` : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLine(line.product.id)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        aria-label={`Quitar ${line.product.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-gray-500 mr-1">Cant.</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(line.product.id, -1)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700"
                          aria-label="Disminuir cantidad"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-bold text-gray-900">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(line.product.id, 1)}
                          disabled={
                            line.product.stock != null && line.quantity >= line.product.stock
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 disabled:opacity-40"
                          aria-label="Aumentar cantidad"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <label
                          htmlFor={`price-${line.product.id}`}
                          className="text-xs font-medium text-gray-500"
                        >
                          P. unit (USD)
                        </label>
                        <div className="relative w-28">
                          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                            $
                          </span>
                          <input
                            id={`price-${line.product.id}`}
                            type="text"
                            inputMode="decimal"
                            required
                            value={line.unitPriceInput}
                            onChange={(e) => updateUnitPrice(line.product.id, e.target.value)}
                            placeholder="0.00"
                            className="w-full min-h-[38px] rounded-lg border border-gray-300 bg-white pl-6 pr-2 text-right text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </div>

                      <div className="ml-auto text-right">
                        <p className="text-[11px] text-gray-400">Subtotal</p>
                        <p className="text-sm font-bold text-gray-900">
                          {line.lineTotalCents != null ? formatUSD(line.lineTotalCents) : "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Columna derecha: Datos del cliente, envío, estados y resumen */}
        <div className="space-y-4 lg:col-span-5">
          {/* Cliente */}
          <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5 space-y-3.5">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-800">
                <User className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">2. Datos del cliente</h2>
                <p className="text-xs text-gray-500">
                  Si el cliente ya tiene cuenta en el Portal, se vinculará automáticamente
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="customerName" className="block text-xs font-semibold text-gray-700 mb-1">
                Nombre completo *
              </label>
              <input
                id="customerName"
                type="text"
                required
                maxLength={120}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ej. María Fernanda López"
                className="w-full min-h-[44px] rounded-xl border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div>
                <label htmlFor="customerPhone" className="block text-xs font-semibold text-gray-700 mb-1">
                  Teléfono / WhatsApp *
                </label>
                <input
                  id="customerPhone"
                  type="tel"
                  inputMode="tel"
                  required
                  maxLength={30}
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Ej. 0984025792"
                  className="w-full min-h-[44px] rounded-xl border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {phoneLast4 && (
                  <p className="mt-1 text-[11px] text-gray-500">
                    Código de verificación para Portal:{" "}
                    <span className="font-mono font-semibold text-gray-700">••••{phoneLast4}</span>
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="customerEmail" className="block text-xs font-semibold text-gray-700 mb-1">
                  Correo electrónico (opcional)
                </label>
                <input
                  id="customerEmail"
                  type="email"
                  maxLength={120}
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="cliente@correo.com"
                  className="w-full min-h-[44px] rounded-xl border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Modalidad entrega */}
            <div className="pt-1">
              <span className="block text-xs font-semibold text-gray-700 mb-1.5">
                Modalidad de entrega
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => switchDeliveryMode("delivery")}
                  className={`flex items-center justify-center gap-2 min-h-[44px] rounded-xl border px-3 text-xs font-semibold transition ${
                    deliveryMode === "delivery"
                      ? "border-amber-500 bg-amber-50 text-amber-900 ring-1 ring-amber-500/30"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Truck className="h-4 w-4" />
                  Envío a domicilio
                </button>
                <button
                  type="button"
                  onClick={() => switchDeliveryMode("pickup")}
                  className={`flex items-center justify-center gap-2 min-h-[44px] rounded-xl border px-3 text-xs font-semibold transition ${
                    deliveryMode === "pickup"
                      ? "border-amber-500 bg-amber-50 text-amber-900 ring-1 ring-amber-500/30"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Store className="h-4 w-4" />
                  Retiro en tienda
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="customerAddress" className="block text-xs font-semibold text-gray-700 mb-1">
                {deliveryMode === "pickup" ? "Referencia de retiro *" : "Dirección de entrega *"}
              </label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <textarea
                  id="customerAddress"
                  rows={2}
                  required
                  maxLength={400}
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder={
                    deliveryMode === "pickup"
                      ? "Retiro en local Fraylin (Comité del Pueblo)"
                      : "Sector, calle principal, intersección y referencia"
                  }
                  className="w-full rounded-xl border border-gray-300 pl-9 pr-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {deliveryMode === "delivery" && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="zoneSelect" className="block text-xs font-semibold text-gray-700 mb-1">
                    Zona de envío
                  </label>
                  <select
                    id="zoneSelect"
                    value={selectedZoneId}
                    onChange={(e) => handleZoneChange(e.target.value)}
                    className="w-full min-h-[42px] rounded-xl border border-gray-300 bg-white px-2.5 text-sm"
                  >
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.label} ({formatUSD(z.transferCents)})
                      </option>
                    ))}
                    <option value="free">Envío gratis ($0.00)</option>
                    <option value="custom">Costo personalizado</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="shippingCost" className="block text-xs font-semibold text-gray-700 mb-1">
                    Costo envío (USD)
                  </label>
                  <input
                    id="shippingCost"
                    type="text"
                    inputMode="decimal"
                    value={customShippingInput}
                    onChange={(e) => setCustomShippingInput(e.target.value)}
                    className="w-full min-h-[42px] rounded-xl border border-gray-300 px-3 text-right text-sm font-medium"
                  />
                </div>
              </div>
            )}

            {/* Instalación */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3 space-y-2">
              <label className="flex items-center justify-between gap-2 cursor-pointer">
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-gray-800">
                  <Wrench className="h-4 w-4 text-amber-700" />
                  Incluir servicio de instalación
                </span>
                <input
                  type="checkbox"
                  checked={includeInstallation}
                  onChange={(e) => setIncludeInstallation(e.target.checked)}
                  className="h-4 w-4 rounded accent-amber-600"
                />
              </label>
              {includeInstallation && (
                <div className="flex items-center justify-between gap-2 pt-1">
                  <label htmlFor="installCost" className="text-xs text-gray-600">
                    Valor instalación (USD)
                  </label>
                  <input
                    id="installCost"
                    type="text"
                    inputMode="decimal"
                    value={installationInput}
                    onChange={(e) => setInstallationInput(e.target.value)}
                    className="w-28 min-h-[36px] rounded-lg border border-gray-300 bg-white px-2.5 text-right text-sm font-medium"
                  />
                </div>
              )}
            </div>
          </section>

          {/* Estado inicial */}
          <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5 space-y-4">
            <h2 className="text-base font-bold text-gray-900">
              3. Estado y seguimiento inicial
            </h2>

            <div>
              <span className="block text-xs font-semibold text-gray-700 mb-1.5">
                Estado del pago
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setInitialStatus("paid")}
                  className={`min-h-[44px] rounded-xl border px-3 py-2 text-left transition ${
                    initialStatus === "paid"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500/30"
                      : "border-gray-200 bg-white text-gray-700"
                  }`}
                >
                  <p className="text-xs font-bold">Pago confirmado</p>
                  <p className="text-[11px] opacity-75">Ya pagado por fuera</p>
                </button>
                <button
                  type="button"
                  onClick={() => setInitialStatus("pending")}
                  className={`min-h-[44px] rounded-xl border px-3 py-2 text-left transition ${
                    initialStatus === "pending"
                      ? "border-amber-500 bg-amber-50 text-amber-900 ring-1 ring-amber-500/30"
                      : "border-gray-200 bg-white text-gray-700"
                  }`}
                >
                  <p className="text-xs font-bold">Por cobrar / verificar</p>
                  <p className="text-[11px] opacity-75">Reserva stock en pendiente</p>
                </button>
              </div>
            </div>

            <div>
              <span className="block text-xs font-semibold text-gray-700 mb-1.5">
                Etapa de entrega
              </span>
              <div className="grid grid-cols-2 gap-2">
                {FULFILLMENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFulfillmentStatus(opt.value)}
                    className={`min-h-[44px] rounded-xl border px-3 py-2 text-left transition ${
                      fulfillmentStatus === opt.value
                        ? "border-amber-500 bg-amber-50 text-amber-950 ring-1 ring-amber-500/30"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <p className="text-xs font-bold">{opt.label}</p>
                    <p className="text-[11px] opacity-75">{opt.hint}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="trackingNote" className="block text-xs font-semibold text-gray-700 mb-1">
                Nota inicial para el cliente (opcional)
              </label>
              <textarea
                id="trackingNote"
                rows={2}
                maxLength={1000}
                value={trackingNote}
                onChange={(e) => setTrackingNote(e.target.value)}
                placeholder="Ej. Pedido coordinado por WhatsApp, entrega estimada mañana en la tarde."
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Resumen */}
            <dl className="space-y-1.5 rounded-xl bg-gray-50 p-3.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <dt>Productos</dt>
                <dd>{formatUSD(productsSubtotalCents)}</dd>
              </div>
              {shippingCents > 0 && (
                <div className="flex justify-between text-gray-600">
                  <dt>Envío</dt>
                  <dd>{formatUSD(shippingCents)}</dd>
                </div>
              )}
              {installationCents > 0 && (
                <div className="flex justify-between text-gray-600">
                  <dt>Instalación</dt>
                  <dd>{formatUSD(installationCents)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900">
                <dt>Total pedido</dt>
                <dd className="text-amber-800">{formatUSD(totalCents)}</dd>
              </div>
              <p className="text-[11px] text-gray-500 pt-0.5">
                Desglose tributario: base {formatUSD(subtotalCents)} + IVA 15% {formatUSD(taxCents)}
              </p>
            </dl>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-800"
              >
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || lines.length === 0}
              className="inline-flex w-full min-h-[50px] items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-amber-700 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Creando y sincronizando…
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" aria-hidden />
                  Crear pedido y sincronizar con Portal
                </>
              )}
            </button>
          </section>
        </div>
      </div>
    </form>
  );
}

