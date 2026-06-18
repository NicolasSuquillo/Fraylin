"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { CreditCard, Landmark, Loader2, MessageCircle, Package, ShoppingBag, Truck, Wrench } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SafeImage from "@/components/ui/SafeImage";
import { useCart } from "@/components/cart/CartProvider";
import SuccessConfetti from "@/components/checkout/SuccessConfetti";
import { BUSINESS, buildWhatsAppUrl } from "@/lib/constants";
import type { ShippingZonePrice, TransferSettings } from "@/lib/pricing";
import { validateCheckoutCustomer, type CheckoutFieldErrors } from "@/lib/checkout-validation";
import { formatUSD } from "@/lib/money";
import type { CartItem, CheckoutCustomer, PaymentMethod } from "@/types";

const inputBase =
  "w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors bg-white";
const inputClass = `${inputBase} border-stone-200 focus:ring-amber-400/40 focus:border-amber-400`;
const inputErrorClass = `${inputBase} border-red-400 focus:ring-red-400/40 bg-red-50`;

const PAYPHONE_JS = "https://cdn.payphonetodoesposible.com/box/v2.0/payphone-payment-box.js";
const PAYPHONE_CSS = "https://cdn.payphonetodoesposible.com/box/v2.0/payphone-payment-box.css";

declare global {
  interface Window {
    PPaymentButtonBox?: new (config: Record<string, unknown>) => { render(elementId: string): void };
  }
}

interface CheckoutClientProps {
  payphoneToken: string;
  payphoneStoreId: string;
  shippingZones: ShippingZonePrice[];
  installationCents: number;
  installationTransferCents: number;
  shippingEnabled: boolean;
  installationEnabled: boolean;
  shippingDescription: string;
  installationDescription: string;
  transfer: TransferSettings;
}

interface OrderResult {
  orderId: string;
  clientTransactionId: string;
  paymentMethod: PaymentMethod;
  totalCents: number;
  subtotalCents: number;
  taxCents: number;
  shippingCents: number;
  installationCents: number;
  shippingZoneLabel: string | null;
}

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function buildTransferMessage(order: OrderResult, items: CartItem[], customer: CheckoutCustomer): string {
  const lines = items.map(
    (item) => `• ${item.quantity} × ${item.name} — ${formatUSD(item.priceCents * item.quantity)}`
  );
  const extraLines: string[] = [];
  if (order.shippingCents > 0) {
    extraLines.push(`Envío (${order.shippingZoneLabel}): ${formatUSD(order.shippingCents)}`);
  } else if (order.shippingZoneLabel) {
    extraLines.push(`Envío (${order.shippingZoneLabel}): Gratis`);
  }
  if (order.installationCents > 0) {
    extraLines.push(`Instalación: ${formatUSD(order.installationCents)}`);
  }
  return [
    `Hola, quiero pagar mi pedido ${order.clientTransactionId} por transferencia o Deuna.`,
    "",
    ...lines,
    "",
    ...extraLines,
    `Total: ${formatUSD(order.totalCents)}`,
    `Nombre: ${customer.name}`,
    `Entrega: ${customer.address}`,
    "",
    "Adjunto el comprobante de pago a continuación.",
  ].join("\n");
}

function TransferInfo({ transfer }: { transfer: TransferSettings }) {
  const rows: [string, string][] = [
    ["Banco", transfer.bankName],
    ["Tipo de cuenta", transfer.accountType],
    ["Número de cuenta", transfer.accountNumber],
    ["Titular", transfer.accountHolder],
    ["Cédula / RUC", transfer.accountId],
  ].filter(([, value]) => value.trim().length > 0) as [string, string][];

  return (
    <div className="flex flex-col gap-3 border border-stone-200 rounded-xl p-4 bg-stone-50">
      {transfer.qrImageUrl && (
        <div className="relative w-36 h-36 mx-auto rounded-xl overflow-hidden bg-white border border-stone-200">
          <SafeImage src={transfer.qrImageUrl} alt="QR de Deuna" fill className="object-contain" sizes="144px" />
        </div>
      )}
      {rows.length > 0 && (
        <dl className="flex flex-col gap-1.5 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-3">
              <dt className="text-text-secondary">{label}</dt>
              <dd className="font-semibold text-text-primary text-right">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {transfer.instructions && <p className="text-xs text-text-secondary">{transfer.instructions}</p>}
      <p className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
        Usa únicamente los datos mostrados aquí. Tu pedido se confirma manualmente luego de
        verificar el comprobante; no se realizan cobros automáticos.
      </p>
    </div>
  );
}

interface SummaryPanelProps {
  summaryItems: CartItem[];
  count: number;
  displayTotal: number;
  displaySubtotal: number;
  displayShippingCents: number;
  displayInstallationCents: number;
  allFreeShipping: boolean;
  allFreeInstallation: boolean;
  shippingEnabled: boolean;
  freeShippingCount: number;
  order: { shippingZoneLabel: string | null } | null;
  selectedZoneLabel: string;
  isTransfer: boolean;
}

function SummaryPanel({
  summaryItems, count, displayTotal, displaySubtotal,
  displayShippingCents, displayInstallationCents,
  allFreeShipping, allFreeInstallation, shippingEnabled,
  freeShippingCount, order, selectedZoneLabel, isTransfer,
}: SummaryPanelProps) {
  const lineCents = (item: CartItem) =>
    isTransfer ? item.transferPriceCents ?? item.priceCents : item.priceCents;
  return (
    <div className="rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
      <div className="bg-stone-900 px-5 py-5">
        <p className="text-stone-400 text-xs font-medium uppercase tracking-widest mb-2">Resumen del pedido</p>
        <p className="text-white text-3xl font-bold">{formatUSD(displayTotal)}</p>
        <p className="text-stone-400 text-xs mt-1.5">
          {count} {count === 1 ? "artículo" : "artículos"}
        </p>
      </div>

      <div className="bg-white px-5 py-4 flex flex-col gap-3 max-h-56 overflow-y-auto">
        {summaryItems.map((item) => (
          <div key={item.productId} className="flex gap-3 items-center">
            <div className="relative w-11 h-11 shrink-0 rounded-lg overflow-hidden bg-stone-100">
              <SafeImage src={item.image} alt={item.name} fill className="object-cover" sizes="44px" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-text-primary line-clamp-1">{item.name}</p>
              <p className="text-xs text-text-secondary mt-0.5">
                {item.quantity} × {formatUSD(lineCents(item))}
              </p>
            </div>
            <p className="text-xs font-bold text-text-primary shrink-0">
              {formatUSD(lineCents(item) * item.quantity)}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-stone-50 border-t border-stone-100 px-5 py-4 flex flex-col gap-2">
        <div className="flex justify-between text-sm text-text-secondary">
          <span>Subtotal</span>
          <span>{formatUSD(displaySubtotal)}</span>
        </div>
        {(shippingEnabled || allFreeShipping || freeShippingCount > 0 || order) && (
          <div className="flex justify-between text-sm text-text-secondary">
            <span>
              Envío
              {order
                ? order.shippingZoneLabel && ` (${order.shippingZoneLabel})`
                : !allFreeShipping && shippingEnabled && ` · ${selectedZoneLabel}`}
            </span>
            <span className={displayShippingCents === 0 ? "text-emerald-600 font-semibold" : ""}>
              {displayShippingCents > 0 ? formatUSD(displayShippingCents) : "Gratis"}
            </span>
          </div>
        )}
        {(allFreeInstallation || displayInstallationCents > 0) && (
          <div className="flex justify-between text-sm text-text-secondary">
            <span>Instalación</span>
            <span className={displayInstallationCents === 0 ? "text-emerald-600 font-semibold" : ""}>
              {displayInstallationCents > 0 ? formatUSD(displayInstallationCents) : "Gratis"}
            </span>
          </div>
        )}
        <div className="flex justify-between font-bold text-text-primary border-t border-stone-200 pt-2.5 mt-1">
          <span>Total</span>
          <span className="text-brand-primary text-base">{formatUSD(displayTotal)}</span>
        </div>
        <p className="text-xs text-text-secondary mt-1">
          Envío coordinado por WhatsApp luego del pago.
        </p>
      </div>
    </div>
  );
}

function SectionCard({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-stone-100 bg-stone-50/60">
        <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
          {number}
        </span>
        <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function ProcessingOverlay({
  step,
  method,
  totalCents,
}: {
  step: number;
  method: PaymentMethod;
  totalCents: number;
}) {
  const circumference = 2 * Math.PI * 34;
  const isDone = step >= 3;

  const steps = [
    { id: 1, label: "Verificando disponibilidad" },
    { id: 2, label: "Creando tu pedido" },
    {
      id: 3,
      label: method === "transferencia" ? "Abriendo WhatsApp" : "Preparando pasarela de pago",
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ animation: "ckOverlayIn 0.22s ease both" }}
    >
      <div className="absolute inset-0 bg-stone-900/70 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-3xl shadow-2xl px-8 py-10 w-full max-w-xs flex flex-col items-center gap-7"
        style={{ animation: "ckCardIn 0.32s cubic-bezier(0.34,1.35,0.64,1) both" }}
      >
        {/* Ring */}
        <div className="relative w-[84px] h-[84px] flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 84 84">
            {/* Track */}
            <circle
              cx="42" cy="42" r="35"
              fill="none"
              stroke={isDone ? "#d1fae5" : "#fef3c7"}
              strokeWidth="5.5"
              style={{ transition: "stroke 0.4s ease" }}
            />
            {/* Arc */}
            <circle
              cx="42" cy="42" r="35"
              fill="none"
              stroke={isDone ? "#10b981" : "#f59e0b"}
              strokeWidth="5.5"
              strokeLinecap="round"
              strokeDasharray={isDone ? `${circumference} 0` : "55 165"}
              style={{
                transformOrigin: "42px 42px",
                transform: "rotate(-90deg)",
                transition: isDone
                  ? "stroke-dasharray 0.55s ease, stroke 0.35s ease"
                  : undefined,
                animation: isDone ? undefined : "ckSpin 1.1s linear infinite",
              }}
            />
          </svg>
          {/* Icon center */}
          <div
            className={`relative z-10 w-11 h-11 rounded-full flex items-center justify-center transition-colors duration-300 ${
              isDone ? "bg-emerald-50" : "bg-amber-50"
            }`}
          >
            {isDone ? (
              <svg
                width="22" height="22" viewBox="0 0 22 22" fill="none"
                style={{ animation: "ckCheckDraw 0.4s ease both 0.1s" }}
              >
                <path
                  d="M4 11l5 5 9-9"
                  stroke="#059669"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="26"
                  strokeDashoffset="0"
                />
              </svg>
            ) : (
              <Loader2 size={20} className="text-amber-500 animate-spin" />
            )}
          </div>
        </div>

        {/* Amount + status */}
        <div className="text-center">
          <p
            className="text-2xl font-bold text-text-primary"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {formatUSD(totalCents)}
          </p>
          <p
            className={`text-xs mt-1.5 font-medium transition-colors duration-300 ${
              isDone ? "text-emerald-600" : "text-text-secondary"
            }`}
          >
            {isDone ? "¡Pedido creado exitosamente!" : "Procesando tu pedido…"}
          </p>
        </div>

        {/* Steps list */}
        <div className="w-full flex flex-col gap-2.5">
          {steps.map((s, i) => {
            const done = step > s.id;
            const active = step === s.id;
            const pending = step < s.id;
            return (
              <div
                key={s.id}
                className="flex items-center gap-3"
                style={
                  pending
                    ? { opacity: 0.3 }
                    : { animation: `ckStepIn 0.28s ease both ${i * 0.07}s` }
                }
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                    done
                      ? "bg-emerald-500"
                      : active
                      ? "bg-amber-400"
                      : "bg-stone-200"
                  }`}
                >
                  {done ? (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path
                        d="M2 5.2l2.2 2.2 3.6-3.6"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : active ? (
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  ) : null}
                </div>
                <span
                  className={`text-sm transition-all duration-200 ${
                    done
                      ? "text-stone-400"
                      : active
                      ? "text-text-primary font-semibold"
                      : "text-stone-400"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function CheckoutClient({
  payphoneToken,
  payphoneStoreId,
  shippingZones,
  installationCents: INSTALLATION_CENTS,
  installationTransferCents: INSTALLATION_TRANSFER_CENTS,
  shippingEnabled,
  installationEnabled,
  shippingDescription,
  installationDescription,
  transfer,
}: CheckoutClientProps) {
  const { items, totalCents, transferTotalCents, count, clear, allFreeShipping, allFreeInstallation, freeShippingCount, freeInstallationCount } = useCart();
  const [customer, setCustomer] = useState<CheckoutCustomer>({
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [method, setMethod] = useState<PaymentMethod>(payphoneToken ? "payphone" : "transferencia");
  const [shippingZoneId, setShippingZoneId] = useState<string>(shippingZones[0].id);
  const [installationRequested, setInstallationRequested] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<CheckoutFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [order, setOrder] = useState<OrderResult | null>(null);
  const [orderItems, setOrderItems] = useState<CartItem[]>([]);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const [scriptsReady, setScriptsReady] = useState({ js: false, css: false });
  const widgetRendered = useRef(false);

  useEffect(() => {
    if (!order || order.paymentMethod !== "payphone") return;
    if (!(scriptsReady.js && scriptsReady.css)) return;
    if (!payphoneToken) return;
    if (!window.PPaymentButtonBox) return;
    if (widgetRendered.current) return;
    widgetRendered.current = true;

    new window.PPaymentButtonBox({
      token: payphoneToken,
      ...(payphoneStoreId ? { storeId: payphoneStoreId } : {}),
      clientTransactionId: order.clientTransactionId,
      amount: order.totalCents,
      // IVA incluido en todo el total: la base gravada es subtotalCents y el
      // impuesto taxCents. amountWithoutTax queda en 0 para cumplir el invariante
      // amount === amountWithTax + tax + amountWithoutTax.
      amountWithTax: order.subtotalCents,
      amountWithoutTax: 0,
      tax: order.taxCents,
      service: 0,
      tip: 0,
      currency: "USD",
      reference: `Pedido Fraylin ${order.clientTransactionId}`,
      lang: "es",
    }).render("pp-button");
  }, [order, scriptsReady, payphoneToken, payphoneStoreId]);

  if (items.length === 0 && !order) {
    return (
      <>
        <Header />
        <main className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 pt-32 pb-16 gap-6">
          <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center">
            <ShoppingBag size={34} className="text-stone-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-2" style={{ fontFamily: "var(--font-heading)" }}>
              Tu carrito está vacío
            </h1>
            <p className="text-text-secondary text-sm">Agrega productos desde el catálogo para continuar.</p>
          </div>
          <Link
            href="/"
            className="px-6 py-3 bg-brand-primary text-neutral-dark hover:bg-brand-dark hover:text-accent-cream font-semibold rounded-xl transition-colors"
          >
            Explorar catálogo
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  const updateCustomer = (field: keyof CheckoutCustomer, value: string) => {
    setCustomer((c) => ({ ...c, [field]: value }));
    setFieldErrors((errors) => {
      if (!errors[field]) return errors;
      const next = { ...errors };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = validateCheckoutCustomer(customer);
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      return;
    }
    setFieldErrors({});

    setSubmitting(true);
    setProcessingStep(1);
    try {
      await delay(420);
      setProcessingStep(2);

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: validation.normalized,
          items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
          paymentMethod: method,
          ...(!allFreeShipping && { shippingZoneId }),
          ...(!allFreeInstallation && { installationRequested }),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo crear el pedido");
        return;
      }

      const createdOrder: OrderResult = data;
      setOrderItems(items);
      setProcessingStep(3);

      await delay(780);

      if (createdOrder.paymentMethod === "transferencia") {
        const url = buildWhatsAppUrl(
          BUSINESS.whatsapp[0].number,
          buildTransferMessage(createdOrder, items, validation.normalized)
        );
        setWhatsappUrl(url);
        clear();
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        sessionStorage.setItem(
          "fraylin_order",
          JSON.stringify({ orderId: createdOrder.orderId, clientTransactionId: createdOrder.clientTransactionId })
        );
      }

      setOrder(createdOrder);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
      setProcessingStep(0);
    }
  };

  const summaryItems = order ? orderItems : items;
  // Precio según método: transferencia (base, con descuento) vs tarjeta (incluye comisión Payphone).
  // Tras crear la orden, el método queda fijado por order.paymentMethod.
  const isTransfer = order ? order.paymentMethod === "transferencia" : method === "transferencia";
  const selectedZone = shippingZones.find((z) => z.id === shippingZoneId) ?? shippingZones[0];
  const effectiveShippingCents = allFreeShipping
    ? 0
    : shippingEnabled
    ? isTransfer
      ? selectedZone.transferCents
      : selectedZone.cents
    : 0;

  const uniqueCartItems = [...new Map(items.map((i) => [i.productId, i])).values()];
  const cartInstallationSum = uniqueCartItems.reduce((sum, item) => {
    if (item.freeInstallation) return sum;
    const cardCents = item.installationCents ?? INSTALLATION_CENTS;
    const transferCents = item.installationTransferCents ?? INSTALLATION_TRANSFER_CENTS;
    return sum + (isTransfer ? transferCents : cardCents);
  }, 0);
  const effectiveInstallationCents = allFreeInstallation ? 0 : (installationEnabled && installationRequested ? cartInstallationSum : 0);
  const productSubtotalCents = isTransfer ? transferTotalCents : totalCents;
  const grandTotalCents = productSubtotalCents + effectiveShippingCents + effectiveInstallationCents;

  const displayShippingCents = order?.shippingCents ?? effectiveShippingCents;
  const displayInstallationCents = order?.installationCents ?? effectiveInstallationCents;
  const displayTotal = order?.totalCents ?? grandTotalCents;
  const displaySubtotal = order != null ? order.subtotalCents + order.taxCents : productSubtotalCents;

  const summaryPanelProps: SummaryPanelProps = {
    summaryItems,
    count,
    displayTotal,
    displaySubtotal,
    displayShippingCents,
    displayInstallationCents,
    allFreeShipping,
    allFreeInstallation,
    shippingEnabled,
    freeShippingCount,
    order,
    selectedZoneLabel: selectedZone.label,
    isTransfer,
  };

  return (
    <>
      <style>{`
        @keyframes ckOverlayIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes ckCardIn {
          from { opacity: 0; transform: translateY(22px) scale(0.94); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes ckSpin {
          from { transform: rotate(-90deg); }
          to   { transform: rotate(270deg); }
        }
        @keyframes ckStepIn {
          from { opacity: 0; transform: translateX(-10px); }
          to   { opacity: 1; transform: translateX(0);     }
        }
        @keyframes ckCheckDraw {
          from { stroke-dashoffset: 26; }
          to   { stroke-dashoffset: 0;  }
        }
        @keyframes ckSuccessIn {
          from { opacity: 0; transform: translateY(18px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes ckBtnShimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes ckPulseRing {
          0%   { box-shadow: 0 0 0 0   rgba(245,158,11,0.4); }
          70%  { box-shadow: 0 0 0 10px rgba(245,158,11,0);  }
          100% { box-shadow: 0 0 0 0   rgba(245,158,11,0);   }
        }
      `}</style>

      <Header />

      {processingStep > 0 && (
        <ProcessingOverlay
          step={processingStep}
          method={method}
          totalCents={grandTotalCents}
        />
      )}

      <main className="max-w-6xl mx-auto px-4 pt-24 sm:pt-28 pb-16">

        <div className="mb-7">
          <h1
            className="text-2xl sm:text-3xl font-bold text-text-primary"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Finalizar compra
          </h1>
          {!order && (
            <p className="text-sm text-text-secondary mt-1">
              {count} {count === 1 ? "artículo" : "artículos"} · {formatUSD(grandTotalCents)}
            </p>
          )}
        </div>

        {!order ? (
          <div className="grid lg:grid-cols-5 gap-8 items-start">

            {/* ── Form ──────────────────────────────────────────── */}
            <form onSubmit={handleSubmit} className="lg:col-span-3 flex flex-col gap-5">
              <fieldset disabled={submitting} className="contents disabled:opacity-70">

                {/* Mobile-only compact summary */}
                <div className="lg:hidden">
                  <SummaryPanel {...summaryPanelProps} />
                </div>

                {/* 1 · Datos de entrega */}
                <SectionCard number={1} title="Datos de entrega">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1.5 text-xs font-semibold text-text-secondary uppercase tracking-wide">
                      Nombre completo
                      <input
                        required
                        autoComplete="name"
                        value={customer.name}
                        onChange={(e) => updateCustomer("name", e.target.value)}
                        aria-invalid={Boolean(fieldErrors.name)}
                        className={fieldErrors.name ? inputErrorClass : inputClass}
                      />
                      {fieldErrors.name && <span className="text-xs font-normal normal-case text-red-600">{fieldErrors.name}</span>}
                    </label>
                    <label className="flex flex-col gap-1.5 text-xs font-semibold text-text-secondary uppercase tracking-wide">
                      Teléfono
                      <input
                        required
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="098 4025 792"
                        value={customer.phone}
                        onChange={(e) => updateCustomer("phone", e.target.value)}
                        aria-invalid={Boolean(fieldErrors.phone)}
                        className={fieldErrors.phone ? inputErrorClass : inputClass}
                      />
                      {fieldErrors.phone && <span className="text-xs font-normal normal-case text-red-600">{fieldErrors.phone}</span>}
                    </label>
                    <label className="flex flex-col gap-1.5 text-xs font-semibold text-text-secondary uppercase tracking-wide">
                      Correo electrónico
                      <input
                        required
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        value={customer.email}
                        onChange={(e) => updateCustomer("email", e.target.value)}
                        aria-invalid={Boolean(fieldErrors.email)}
                        className={fieldErrors.email ? inputErrorClass : inputClass}
                      />
                      {fieldErrors.email && <span className="text-xs font-normal normal-case text-red-600">{fieldErrors.email}</span>}
                    </label>
                    <label className="flex flex-col gap-1.5 text-xs font-semibold text-text-secondary uppercase tracking-wide">
                      Dirección de entrega
                      <input
                        required
                        autoComplete="street-address"
                        placeholder="Calle, número, sector y referencia"
                        value={customer.address}
                        onChange={(e) => updateCustomer("address", e.target.value)}
                        aria-invalid={Boolean(fieldErrors.address)}
                        className={fieldErrors.address ? inputErrorClass : inputClass}
                      />
                      {fieldErrors.address && <span className="text-xs font-normal normal-case text-red-600">{fieldErrors.address}</span>}
                    </label>
                  </div>
                </SectionCard>

                {/* 2 · Envío */}
                {allFreeShipping ? (
                  <div className="flex items-center gap-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <Truck size={17} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-800">Envío gratis incluido</p>
                      <p className="text-xs text-emerald-600 mt-0.5">
                        Todos los productos incluyen envío sin costo adicional
                      </p>
                    </div>
                  </div>
                ) : shippingEnabled ? (
                  <SectionCard number={2} title="Zona de envío">
                    {shippingDescription && (
                      <p className="text-xs text-text-secondary mb-3">{shippingDescription}</p>
                    )}
                    {freeShippingCount > 0 && (
                      <p className="text-xs text-emerald-700 font-medium flex items-center gap-1.5 mb-3">
                        <Truck size={12} />
                        {freeShippingCount} producto{freeShippingCount !== 1 ? "s" : ""} con envío gratis — el costo aplica al resto
                      </p>
                    )}
                    <div className="grid sm:grid-cols-2 gap-2.5">
                      {shippingZones.map((zone) => (
                        <label
                          key={zone.id}
                          className={`flex items-center justify-between gap-3 border-2 rounded-xl p-3.5 cursor-pointer transition-all ${
                            shippingZoneId === zone.id
                              ? "border-amber-500 bg-amber-50"
                              : "border-stone-200 hover:border-stone-300 bg-white"
                          }`}
                        >
                          <span className="flex items-center gap-2.5">
                            <input
                              type="radio"
                              name="shippingZone"
                              value={zone.id}
                              checked={shippingZoneId === zone.id}
                              onChange={() => setShippingZoneId(zone.id)}
                              className="accent-brand-primary"
                            />
                            <span className="text-sm font-medium text-text-primary">{zone.label}</span>
                          </span>
                          <span className={`text-sm font-bold ${(isTransfer ? zone.transferCents : zone.cents) === 0 ? "text-emerald-600" : "text-text-primary"}`}>
                            {(isTransfer ? zone.transferCents : zone.cents) > 0 ? formatUSD(isTransfer ? zone.transferCents : zone.cents) : "Gratis"}
                          </span>
                        </label>
                      ))}
                    </div>
                  </SectionCard>
                ) : null}

                {/* 3 · Instalación */}
                {allFreeInstallation ? (
                  <div className="flex items-center gap-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <Wrench size={17} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-800">Instalación profesional gratis</p>
                      <p className="text-xs text-emerald-600 mt-0.5">
                        Todos los productos incluyen instalación sin costo adicional
                      </p>
                    </div>
                  </div>
                ) : installationEnabled ? (
                  <SectionCard number={3} title="Instalación profesional">
                    <label
                      className={`flex items-start gap-4 border-2 rounded-xl p-4 cursor-pointer transition-all ${
                        installationRequested
                          ? "border-amber-500 bg-amber-50"
                          : "border-stone-200 hover:border-stone-300 bg-white"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={installationRequested}
                        onChange={(e) => setInstallationRequested(e.target.checked)}
                        className="mt-0.5 w-4 h-4 accent-brand-primary shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-semibold text-text-primary">
                            Agregar instalación profesional
                          </span>
                          <span className="text-sm font-bold text-brand-primary shrink-0">
                            +{formatUSD(cartInstallationSum)}
                          </span>
                        </div>
                        {installationDescription && (
                          <p className="text-xs text-text-secondary mt-1">{installationDescription}</p>
                        )}
                        {freeInstallationCount > 0 && (
                          <p className="text-xs text-emerald-700 font-medium mt-1.5 flex items-center gap-1.5">
                            <Wrench size={11} />
                            {freeInstallationCount} producto{freeInstallationCount !== 1 ? "s" : ""} con instalación gratis incluida
                          </p>
                        )}
                      </div>
                    </label>
                  </SectionCard>
                ) : null}

                {/* 4 · Método de pago */}
                <SectionCard number={4} title="Método de pago">
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {payphoneToken && (
                      <label
                        className={`flex flex-col gap-3 border-2 rounded-xl p-4 cursor-pointer transition-all ${
                          method === "payphone"
                            ? "border-amber-500 bg-amber-50"
                            : "border-stone-200 hover:border-stone-300 bg-white"
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="payphone"
                            checked={method === "payphone"}
                            onChange={() => setMethod("payphone")}
                            className="accent-brand-primary"
                          />
                          <CreditCard size={17} className="text-brand-primary" />
                          <span className="text-sm font-semibold text-text-primary">Tarjeta</span>
                        </span>
                        <span className="text-xs text-text-secondary pl-6">
                          Visa, Mastercard · Pago seguro con Payphone
                        </span>
                      </label>
                    )}
                    <label
                      className={`flex flex-col gap-3 border-2 rounded-xl p-4 cursor-pointer transition-all ${
                        method === "transferencia"
                          ? "border-amber-500 bg-amber-50"
                          : "border-stone-200 hover:border-stone-300 bg-white"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="transferencia"
                          checked={method === "transferencia"}
                          onChange={() => setMethod("transferencia")}
                          className="accent-brand-primary"
                        />
                        <Landmark size={17} className="text-brand-primary" />
                        <span className="text-sm font-semibold text-text-primary">Transferencia</span>
                      </span>
                      <span className="text-xs text-text-secondary pl-6">
                        Deuna o transferencia bancaria · Coordinamos por WhatsApp
                      </span>
                    </label>
                  </div>
                  {method === "transferencia" && transfer.enabled && (
                    <div className="mt-4">
                      <TransferInfo transfer={transfer} />
                    </div>
                  )}
                </SectionCard>

                {error && (
                  <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-3.5 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="relative w-full py-4 font-bold text-base rounded-2xl transition-all disabled:opacity-60 inline-flex items-center justify-center gap-2.5 overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #f59e0b 100%)",
                    backgroundSize: "200% 100%",
                    color: "#1c1917",
                    boxShadow: submitting ? "none" : "0 4px 14px rgba(245,158,11,0.35)",
                    animation: submitting ? undefined : "ckPulseRing 2.5s ease-out infinite",
                  }}
                  onMouseEnter={(e) => {
                    if (!submitting) {
                      (e.currentTarget as HTMLButtonElement).style.animation =
                        "ckBtnShimmer 0.9s ease both, ckPulseRing 2.5s ease-out infinite";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!submitting) {
                      (e.currentTarget as HTMLButtonElement).style.animation =
                        "ckPulseRing 2.5s ease-out infinite";
                    }
                  }}
                >
                  {method === "payphone" ? (
                    <CreditCard size={19} />
                  ) : (
                    <MessageCircle size={19} />
                  )}
                  {method === "transferencia"
                    ? `Continuar por WhatsApp · ${formatUSD(grandTotalCents)}`
                    : `Pagar con tarjeta · ${formatUSD(grandTotalCents)}`}
                </button>

              </fieldset>
            </form>

            {/* ── Sticky summary (desktop) ───────────────────────── */}
            <aside className="hidden lg:block lg:col-span-2">
              <div className="sticky top-28">
                <SummaryPanel {...summaryPanelProps} />
              </div>
            </aside>

          </div>
        ) : (
          /* ── Post-order states ────────────────────────────────── */
          <div className="max-w-lg mx-auto">

            {order.paymentMethod === "transferencia" && (
              <div
                className="flex flex-col gap-5"
                style={{ animation: "ckSuccessIn 0.5s cubic-bezier(0.34,1.3,0.64,1) both" }}
              >
                <SuccessConfetti count={90} />
                <div className="flex items-center gap-4 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-5">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <svg
                      width="28" height="28" viewBox="0 0 28 28" fill="none"
                      style={{ animation: "ckCheckDraw 0.55s ease both 0.15s" }}
                    >
                      <path
                        d="M5 14l6 6L23 8"
                        stroke="#059669"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="30"
                        strokeDashoffset="0"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-emerald-800">¡Pedido creado!</p>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      # <span className="font-mono font-bold">{order.clientTransactionId}</span>
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 flex flex-col gap-3">
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Te abrimos WhatsApp para coordinar el pago. Si no se abrió automáticamente,
                    usa el botón de abajo.
                  </p>
                  <div className="flex flex-col gap-2 border-t border-stone-100 pt-3">
                    <div className="flex justify-between text-sm text-text-secondary">
                      <span>Total a pagar</span>
                      <span className="font-bold text-text-primary">{formatUSD(order.totalCents)}</span>
                    </div>
                  </div>
                  {transfer.enabled && <TransferInfo transfer={transfer} />}
                  <a
                    href={whatsappUrl ?? buildWhatsAppUrl(BUSINESS.whatsapp[0].number, `Hola, quiero pagar mi pedido ${order.clientTransactionId} por transferencia o Deuna.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl transition-colors inline-flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={18} />
                    Abrir WhatsApp
                  </a>
                </div>

                <Link href="/" className="text-sm text-text-secondary text-center underline hover:text-text-primary">
                  Volver al catálogo
                </Link>
              </div>
            )}

            {order.paymentMethod === "payphone" && (
              <div
                className="flex flex-col gap-5"
                style={{ animation: "ckSuccessIn 0.5s cubic-bezier(0.34,1.3,0.64,1) both" }}
              >
                <div className="flex items-center gap-4 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-5">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <Package size={24} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-amber-800">Completa tu pago</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      # <span className="font-mono font-bold">{order.clientTransactionId}</span>
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 flex flex-col gap-4">
                  <p className="text-sm text-text-secondary">
                    Pedido creado por{" "}
                    <span className="font-bold text-text-primary">{formatUSD(order.totalCents)}</span>.
                    Usa el botón de Payphone para completar el pago de forma segura.
                  </p>

                  {payphoneToken ? (
                    <>
                      <Script src={PAYPHONE_JS} onReady={() => setScriptsReady((s) => ({ ...s, js: true }))} />
                      <link rel="stylesheet" href={PAYPHONE_CSS} onLoad={() => setScriptsReady((s) => ({ ...s, css: true }))} />
                      {!(scriptsReady.js && scriptsReady.css) && (
                        <p className="text-sm text-text-secondary inline-flex items-center gap-2" aria-live="polite">
                          <Loader2 size={16} className="animate-spin" />
                          Cargando pasarela de pago…
                        </p>
                      )}
                      <div id="pp-button" />
                    </>
                  ) : (
                    <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3.5">
                      Los pagos en línea aún no están configurados. Contáctanos por WhatsApp mencionando el
                      pedido <span className="font-semibold">{order.clientTransactionId}</span>.
                    </p>
                  )}
                </div>
              </div>
            )}

          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
