"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { CreditCard, Landmark, Loader2, MessageCircle, ShoppingBag } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SafeImage from "@/components/ui/SafeImage";
import { useCart } from "@/components/cart/CartProvider";
import { BUSINESS, buildWhatsAppUrl } from "@/lib/constants";
import { validateCheckoutCustomer, type CheckoutFieldErrors } from "@/lib/checkout-validation";
import { formatUSD } from "@/lib/money";
import type { CartItem, CheckoutCustomer, PaymentMethod } from "@/types";

const inputClass =
  "px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/40";
const inputErrorClass = `${inputClass} border-red-400 focus:ring-red-400/40`;

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
}

interface OrderResult {
  orderId: string;
  clientTransactionId: string;
  paymentMethod: PaymentMethod;
  totalCents: number;
  subtotalCents: number;
  taxCents: number;
}

function buildTransferMessage(order: OrderResult, items: CartItem[], customer: CheckoutCustomer): string {
  const lines = items.map(
    (item) => `• ${item.quantity} × ${item.name} — ${formatUSD(item.priceCents * item.quantity)}`
  );
  return [
    `Hola, quiero pagar mi pedido ${order.clientTransactionId} por transferencia o Deuna.`,
    "",
    ...lines,
    "",
    `Total: ${formatUSD(order.totalCents)}`,
    `Nombre: ${customer.name}`,
    `Entrega: ${customer.address}`,
  ].join("\n");
}

export default function CheckoutClient({ payphoneToken, payphoneStoreId }: CheckoutClientProps) {
  const { items, totalCents, clear } = useCart();
  const [customer, setCustomer] = useState<CheckoutCustomer>({
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [method, setMethod] = useState<PaymentMethod>(payphoneToken ? "payphone" : "transferencia");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<CheckoutFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
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
        <main className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 pt-32 pb-16 gap-4">
          <ShoppingBag size={48} className="text-brand-primary" />
          <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-heading)" }}>
            Tu carrito está vacío
          </h1>
          <p className="text-text-secondary">Agrega productos desde el catálogo para continuar.</p>
          <Link
            href="/"
            className="px-5 py-2.5 bg-brand-primary text-neutral-dark hover:bg-brand-dark hover:text-accent-cream font-semibold rounded-lg transition-colors"
          >
            Volver al catálogo
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
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: validation.normalized,
          items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
          paymentMethod: method,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo crear el pedido");
        return;
      }

      const createdOrder: OrderResult = data;
      setOrderItems(items);
      setOrder(createdOrder);

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
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const summaryItems = order ? orderItems : items;

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 pt-28 pb-16 flex flex-col gap-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary" style={{ fontFamily: "var(--font-heading)" }}>
          Finalizar compra
        </h1>

        <section className="flex flex-col gap-3">
          {summaryItems.map((item) => (
            <div key={item.productId} className="flex gap-3 items-center border border-stone-200 rounded-xl p-3">
              <div className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-neutral-light">
                <SafeImage src={item.image} alt={item.name} fill className="object-cover" sizes="56px" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary line-clamp-1">{item.name}</p>
                <p className="text-xs text-text-secondary">
                  {item.quantity} × {formatUSD(item.priceCents)}
                </p>
              </div>
              <p className="text-sm font-bold text-brand-primary">{formatUSD(item.priceCents * item.quantity)}</p>
            </div>
          ))}
          <div className="flex items-center justify-between text-lg font-bold text-text-primary border-t border-stone-100 pt-3">
            <span>Total</span>
            <span className="text-brand-primary">{formatUSD(order?.totalCents ?? totalCents)}</span>
          </div>
          <p className="text-xs text-text-secondary">El envío se coordina por WhatsApp luego del pago.</p>
        </section>

        {!order && (
          <form onSubmit={handleSubmit}>
            <fieldset disabled={submitting} className="flex flex-col gap-4 disabled:opacity-70">
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1 text-sm font-medium text-text-primary">
                Nombre completo
                <input
                  required
                  autoComplete="name"
                  value={customer.name}
                  onChange={(e) => updateCustomer("name", e.target.value)}
                  aria-invalid={Boolean(fieldErrors.name)}
                  className={fieldErrors.name ? inputErrorClass : inputClass}
                />
                {fieldErrors.name && <span className="text-xs font-normal text-red-600">{fieldErrors.name}</span>}
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-text-primary">
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
                {fieldErrors.phone && <span className="text-xs font-normal text-red-600">{fieldErrors.phone}</span>}
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-text-primary">
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
                {fieldErrors.email && <span className="text-xs font-normal text-red-600">{fieldErrors.email}</span>}
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-text-primary">
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
                {fieldErrors.address && (
                  <span className="text-xs font-normal text-red-600">{fieldErrors.address}</span>
                )}
              </label>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-text-primary">Método de pago</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {payphoneToken && (
                  <label
                    className={`flex items-start gap-3 border rounded-xl p-3 cursor-pointer transition-colors ${
                      method === "payphone"
                        ? "border-brand-primary bg-brand-primary/5"
                        : "border-stone-200 hover:border-stone-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="payphone"
                      checked={method === "payphone"}
                      onChange={() => setMethod("payphone")}
                      className="mt-1 accent-brand-primary"
                    />
                    <span className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold text-text-primary inline-flex items-center gap-1.5">
                        <CreditCard size={16} className="text-brand-primary" aria-hidden />
                        Tarjeta de crédito o débito
                      </span>
                      <span className="text-xs text-text-secondary">Pago en línea seguro con Payphone.</span>
                    </span>
                  </label>
                )}
                <label
                  className={`flex items-start gap-3 border rounded-xl p-3 cursor-pointer transition-colors ${
                    method === "transferencia"
                      ? "border-brand-primary bg-brand-primary/5"
                      : "border-stone-200 hover:border-stone-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="transferencia"
                    checked={method === "transferencia"}
                    onChange={() => setMethod("transferencia")}
                    className="mt-1 accent-brand-primary"
                  />
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-text-primary inline-flex items-center gap-1.5">
                      <Landmark size={16} className="text-brand-primary" aria-hidden />
                      Transferencia o Deuna
                    </span>
                    <span className="text-xs text-text-secondary">
                      Te atendemos por WhatsApp para coordinar el pago.
                    </span>
                  </span>
                </label>
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              className="px-5 py-3 bg-brand-primary text-neutral-dark hover:bg-brand-dark hover:text-accent-cream font-semibold rounded-lg transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 size={18} className="animate-spin" aria-hidden />}
              {submitting
                ? "Procesando..."
                : method === "transferencia"
                  ? "Continuar por WhatsApp"
                  : "Continuar al pago"}
            </button>
            </fieldset>
          </form>
        )}

        {order && order.paymentMethod === "transferencia" && (
          <section className="flex flex-col items-start gap-3">
            <p className="text-sm text-text-secondary">
              Pedido <span className="font-semibold text-text-primary">{order.clientTransactionId}</span> creado.
              Te abrimos WhatsApp para coordinar el pago por transferencia o Deuna. Si no se abrió
              automáticamente, usa el botón:
            </p>
            <a
              href={whatsappUrl ?? buildWhatsAppUrl(BUSINESS.whatsapp[0].number, `Hola, quiero pagar mi pedido ${order.clientTransactionId} por transferencia o Deuna.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <MessageCircle size={18} aria-hidden />
              Abrir WhatsApp
            </a>
            <Link href="/" className="text-sm text-text-secondary underline hover:text-text-primary">
              Volver al catálogo
            </Link>
          </section>
        )}

        {order && order.paymentMethod === "payphone" && (
          <section className="flex flex-col gap-3">
            <p className="text-sm text-text-secondary">
              Pedido <span className="font-semibold text-text-primary">{order.clientTransactionId}</span> creado.
              Completa el pago a continuación.
            </p>

            {payphoneToken ? (
              <>
                <Script src={PAYPHONE_JS} onReady={() => setScriptsReady((s) => ({ ...s, js: true }))} />
                <link rel="stylesheet" href={PAYPHONE_CSS} onLoad={() => setScriptsReady((s) => ({ ...s, css: true }))} />
                {!(scriptsReady.js && scriptsReady.css) && (
                  <p className="text-sm text-text-secondary inline-flex items-center gap-2" aria-live="polite">
                    <Loader2 size={16} className="animate-spin" aria-hidden />
                    Cargando pasarela de pago…
                  </p>
                )}
                <div id="pp-button" />
              </>
            ) : (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                Los pagos en línea aún no están configurados. Contáctanos por WhatsApp mencionando el pedido{" "}
                <span className="font-semibold">{order.clientTransactionId}</span> para coordinar el pago.
              </p>
            )}
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
