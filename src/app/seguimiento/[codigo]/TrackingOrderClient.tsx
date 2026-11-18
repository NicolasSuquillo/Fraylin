"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  ExternalLink,
  MessageCircle,
  Package,
  PackageCheck,
  ShieldCheck,
  Star,
  Truck,
  Wrench,
  XCircle,
} from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { formatUSD } from "@/lib/money";
import type { PublicOrderReview, PublicOrderTracking } from "@/lib/orders";
import type { FulfillmentStatus, OrderStatus } from "@/types";

const STEPS: Array<{
  key: FulfillmentStatus;
  label: string;
  description: string;
  Icon: typeof Package;
}> = [
  {
    key: "nuevo",
    label: "Recibido",
    description: "Pedido registrado en nuestro sistema.",
    Icon: Package,
  },
  {
    key: "preparando",
    label: "En preparación",
    description: "Alistando y revisando tus acabados.",
    Icon: Wrench,
  },
  {
    key: "coordinado",
    label: "Coordinado",
    description: "Entrega o retiro coordinado contigo.",
    Icon: Truck,
  },
  {
    key: "entregado",
    label: "Entregado",
    description: "Pedido entregado satisfactoriamente.",
    Icon: PackageCheck,
  },
];

const PAYMENT_STATUS_META: Record<
  OrderStatus,
  { label: string; badgeClass: string; Icon: typeof CheckCircle2 }
> = {
  pending: {
    label: "Pago pendiente",
    badgeClass: "bg-amber-100 text-amber-900 border-amber-200",
    Icon: Clock,
  },
  processing: {
    label: "Procesando pago",
    badgeClass: "bg-stone-100 text-stone-800 border-stone-200",
    Icon: Clock,
  },
  paid: {
    label: "Pago confirmado",
    badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-200",
    Icon: CheckCircle2,
  },
  failed: {
    label: "Pago fallido",
    badgeClass: "bg-red-100 text-red-900 border-red-200",
    Icon: XCircle,
  },
  cancelled: {
    label: "Cancelado",
    badgeClass: "bg-red-100 text-red-900 border-red-200",
    Icon: XCircle,
  },
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-EC", {
    timeZone: "America/Guayaquil",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function stepIndex(status: FulfillmentStatus): number {
  const idx = STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
}

export default function TrackingOrderClient({
  tracking,
  whatsappUrl,
  comprobanteEnabled,
  portalTrackingUrl,
}: {
  tracking: PublicOrderTracking;
  whatsappUrl: string;
  comprobanteEnabled: boolean;
  portalTrackingUrl?: string;
}) {
  const router = useRouter();
  const submittingRef = useRef(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [copied, setCopied] = useState(false);
  const [review, setReview] = useState<PublicOrderReview | null>(tracking.review);
  const [prevTrackingReview, setPrevTrackingReview] = useState<PublicOrderReview | null>(tracking.review);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [phoneLast4, setPhoneLast4] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [body, setBody] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  if (tracking.review !== prevTrackingReview) {
    setPrevTrackingReview(tracking.review);
    setReview(tracking.review);
  }

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const isCancelledOrFailed = tracking.status === "cancelled" || tracking.status === "failed";
  const currentStep = stepIndex(tracking.fulfillmentStatus);
  const paymentMeta = PAYMENT_STATUS_META[tracking.status];
  const PaymentIcon = paymentMeta.Icon;

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(tracking.clientTransactionId);
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard no disponible */
    }
  }

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;
    setReviewError(null);
    if (rating < 1 || rating > 5) {
      setReviewError("Selecciona una calificación de 1 a 5 estrellas.");
      return;
    }
    const cleanLast4 = phoneLast4.replace(/\D/g, "");
    if (cleanLast4.length !== 4) {
      setReviewError("Ingresa los últimos 4 dígitos del teléfono usado en la compra.");
      return;
    }
    if (body.trim().length < 10) {
      setReviewError("Cuéntanos un poco más sobre tu experiencia (mínimo 10 caracteres).");
      return;
    }

    submittingRef.current = true;
    setSubmittingReview(true);
    try {
      const fd = new FormData();
      fd.set("rating", String(rating));
      fd.set("phoneLast4", cleanLast4);
      fd.set("authorName", authorName.trim());
      fd.set("body", body.trim());
      if (avatarFile) {
        fd.set("avatar", avatarFile);
      }

      const res = await fetch(
        `/api/tracking/${encodeURIComponent(tracking.clientTransactionId)}/review`,
        { method: "POST", body: fd }
      );
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        review?: PublicOrderReview;
      };
      if (!res.ok) {
        setReviewError(data.error ?? "No se pudo registrar tu reseña.");
        if (res.status === 409) {
          router.refresh();
        }
        return;
      }
      if (!data.review) {
        setReviewError("Reseña guardada, pero no se recibió confirmación. Recarga la página.");
        return;
      }
      setReview(data.review);
      router.refresh();
    } catch {
      setReviewError("Error de conexión. Intenta nuevamente.");
    } finally {
      submittingRef.current = false;
      setSubmittingReview(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Encabezado del pedido */}
      <section className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-8 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-dark">
              Seguimiento de pedido Fraylin
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-mono text-2xl sm:text-3xl font-bold text-text-primary">
                {tracking.clientTransactionId}
              </h1>
              <button
                type="button"
                onClick={copyCode}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-stone-200 text-xs font-medium text-text-secondary hover:text-brand-dark hover:border-brand-primary/40 transition-colors cursor-pointer"
                title="Copiar código"
              >
                {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                {copied ? "Copiado" : "Copiar"}
              </button>
            </div>
            <p className="text-xs text-text-secondary">
              Registrado el {formatDateTime(tracking.createdAt)} · Cliente:{" "}
              <span className="font-semibold text-text-primary">{tracking.customerFirstName}</span>{" "}
              ({tracking.customerPhoneMasked})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${paymentMeta.badgeClass}`}
            >
              <PaymentIcon size={14} />
              {paymentMeta.label}
            </span>
          </div>
        </div>

        {/* Barra de progreso */}
        {isCancelledOrFailed ? (
          <div className="rounded-2xl border border-red-200 bg-red-50/70 p-4 flex items-start gap-3">
            <XCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-red-900">
                {tracking.status === "cancelled" ? "Este pedido fue cancelado" : "El pago no pudo completarse"}
              </p>
              <p className="text-xs text-red-800/80 mt-0.5">
                Si necesitas asistencia o deseas realizar un nuevo pedido, contáctanos por WhatsApp.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between text-xs text-text-secondary">
              <span className="font-semibold text-text-primary">Progreso de entrega</span>
              <span>
                Etapa {currentStep + 1} de {STEPS.length}
              </span>
            </div>
            <ol className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {STEPS.map((step, idx) => {
                const done =
                  tracking.fulfillmentStatus === "entregado"
                    ? idx <= currentStep
                    : idx < currentStep;
                const current =
                  tracking.fulfillmentStatus !== "entregado" && idx === currentStep;
                const StepIcon = step.Icon;
                return (
                  <li
                    key={step.key}
                    className={`rounded-2xl border p-4 transition-colors ${
                      done
                        ? "border-emerald-200 bg-emerald-50/80 text-emerald-950"
                        : current
                          ? "border-brand-primary bg-brand-primary/10 text-text-primary ring-2 ring-brand-primary/25"
                          : "border-stone-200 bg-stone-50/60 text-text-secondary"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[11px] font-bold opacity-75">
                        0{idx + 1}
                      </span>
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center ${
                          done
                            ? "bg-emerald-600 text-white"
                            : current
                              ? "bg-brand-primary text-neutral-dark"
                              : "bg-stone-200 text-stone-500"
                        }`}
                      >
                        {done ? <Check size={14} /> : <StepIcon size={14} />}
                      </div>
                    </div>
                    <p className="text-sm font-bold">{step.label}</p>
                    <p className="text-xs opacity-80 mt-0.5 leading-snug">{step.description}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        {/* Nota pública del equipo */}
        {tracking.trackingNote && (
          <div className="rounded-2xl border border-brand-primary/35 bg-brand-primary/10 p-4 space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-dark">
              Mensaje del equipo Fraylin
            </p>
            <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
              {tracking.trackingNote}
            </p>
          </div>
        )}

        {/* Acciones rápidas */}
        <div className="flex flex-wrap gap-3 pt-1">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors"
          >
            <MessageCircle size={16} />
            Consultar por WhatsApp
          </a>
          {tracking.status === "paid" && comprobanteEnabled && (
            <a
              href={`/api/orders/${tracking.clientTransactionId}/comprobante`}
              download={`comprobante-${tracking.clientTransactionId}.pdf`}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-brand-primary/50 text-brand-dark hover:bg-brand-primary/10 text-sm font-semibold transition-colors"
            >
              <Download size={16} />
              Descargar comprobante
            </a>
          )}
          {portalTrackingUrl && (
            <a
              href={portalTrackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 text-text-secondary hover:text-text-primary hover:bg-stone-50 text-sm font-medium transition-colors"
            >
              <ExternalLink size={15} />
              Ver en Portal Fraylin
            </a>
          )}
        </div>
      </section>

      {/* Detalle completo de productos */}
      <section className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2
              className="text-xl font-bold text-text-primary"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Productos de tu pedido
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Información detallada y especificaciones técnicas de cada artículo adquirido.
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-stone-100 text-text-secondary">
            {tracking.items.length} {tracking.items.length === 1 ? "producto" : "productos"}
          </span>
        </div>

        <div className="space-y-4">
          {tracking.items.map((item) => (
            <article
              key={item.id}
              className="flex flex-col sm:flex-row gap-4 rounded-2xl border border-stone-200 bg-stone-50/50 p-4"
            >
              <div className="relative w-full sm:w-28 h-40 sm:h-28 shrink-0 rounded-xl overflow-hidden bg-white border border-stone-200">
                <SafeImage
                  src={item.productImageSrc || "/placeholder.svg"}
                  alt={item.productName}
                  fill
                  className="object-cover"
                  sizes="120px"
                />
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    {item.productCategory && (
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-primary/15 text-brand-dark mb-1">
                        {item.productCategory}
                      </span>
                    )}
                    <h3 className="text-base font-bold text-text-primary leading-snug">
                      {item.productName}
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-text-primary">
                      {formatUSD(item.lineTotalCents)}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {item.quantity} × {formatUSD(item.unitPriceCents)}
                    </p>
                  </div>
                </div>

                {item.productDescription && (
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {item.productDescription}
                  </p>
                )}

                {item.productSpecs && (
                  <div className="rounded-xl bg-white border border-stone-200/80 px-3 py-2 text-xs text-text-secondary">
                    <span className="font-semibold text-text-primary">Especificaciones: </span>
                    {item.productSpecs}
                  </div>
                )}

                {item.productId && (
                  <div>
                    <Link
                      href={`/catalogo?q=${encodeURIComponent(item.productName)}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-dark hover:underline"
                    >
                      Ver en catálogo
                      <ExternalLink size={12} />
                    </Link>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>

        {/* Desglose de pago */}
        <div className="border-t border-stone-200 pt-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="text-xs text-text-secondary space-y-1">
            <p>
              <span className="font-semibold text-text-primary">Método de pago:</span>{" "}
              {tracking.paymentMethod === "transferencia"
                ? "Transferencia bancaria / Deuna"
                : "Tarjeta (Payphone)"}
            </p>
            {tracking.shippingZoneLabel && (
              <p>
                <span className="font-semibold text-text-primary">Zona de entrega:</span>{" "}
                {tracking.shippingZoneLabel}
              </p>
            )}
            <p>
              <span className="font-semibold text-text-primary">Correo registrado:</span>{" "}
              {tracking.customerEmailMasked}
            </p>
          </div>

          <dl className="w-full sm:w-64 space-y-1.5 text-sm">
            <div className="flex justify-between text-text-secondary">
              <dt>Base imponible</dt>
              <dd>{formatUSD(tracking.subtotalCents)}</dd>
            </div>
            <div className="flex justify-between text-text-secondary">
              <dt>IVA 15%</dt>
              <dd>{formatUSD(tracking.taxCents)}</dd>
            </div>
            {tracking.shippingCents > 0 && (
              <div className="flex justify-between text-text-secondary">
                <dt>Envío</dt>
                <dd>{formatUSD(tracking.shippingCents)}</dd>
              </div>
            )}
            {tracking.installationCents > 0 && (
              <div className="flex justify-between text-text-secondary">
                <dt>Instalación</dt>
                <dd>{formatUSD(tracking.installationCents)}</dd>
              </div>
            )}
            <div className="flex justify-between font-bold text-base text-text-primary border-t border-stone-200 pt-2">
              <dt>Total</dt>
              <dd className="text-brand-dark">{formatUSD(tracking.totalCents)}</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Historial de trazabilidad */}
      <section className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-8 space-y-4">
        <h2
          className="text-xl font-bold text-text-primary"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Historial y trazabilidad
        </h2>

        {tracking.events.length === 0 ? (
          <p className="text-sm text-text-secondary">Sin movimientos registrados aún.</p>
        ) : (
          <ol className="space-y-4">
            {tracking.events.map((ev) => (
              <li key={ev.id} className="relative pl-6 border-l-2 border-brand-primary/40">
                <span className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-brand-primary ring-4 ring-white" />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-text-primary">{ev.title}</p>
                  <span className="text-xs text-text-secondary">{formatDateTime(ev.createdAt)}</span>
                </div>
                {ev.description && (
                  <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                    {ev.description}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Reseña final verificada */}
      <section className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-8 space-y-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-primary/15 text-brand-dark flex items-center justify-center shrink-0">
            <Star size={20} />
          </div>
          <div>
            <h2
              className="text-xl font-bold text-text-primary"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Reseña de tu compra
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Tu opinión nos ayuda a mejorar la calidad de nuestros acabados y entregas.
            </p>
          </div>
        </div>

        {review ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  <ShieldCheck size={13} />
                  Compra verificada
                </span>
                <span className="text-xs text-text-secondary">
                  {review.approved ? "Publicada en la web" : "Recibida · pendiente de publicación"}
                </span>
              </div>
              <div className="flex gap-0.5" aria-label={`${review.rating} de 5 estrellas`}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <span
                    key={s}
                    className={s <= review.rating ? "text-amber-400 text-lg" : "text-stone-300 text-lg"}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
            <p className="text-sm text-text-primary leading-relaxed">&ldquo;{review.body}&rdquo;</p>
            {review.avatarUrl && (
              <div className="pt-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={review.avatarUrl}
                  alt={`Foto de ${review.authorName}`}
                  className="h-24 w-24 rounded-xl border border-emerald-200 object-cover"
                />
              </div>
            )}
            <p className="text-xs font-semibold text-text-secondary">— {review.authorName}</p>
          </div>
        ) : tracking.canSubmitReview ? (
          <form onSubmit={handleReviewSubmit} className="space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                Calificación general *
              </label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="text-3xl leading-none transition-transform hover:scale-110 cursor-pointer"
                    aria-label={`${star} estrellas`}
                  >
                    <span
                      className={(hoverRating || rating) >= star ? "text-amber-400" : "text-stone-300"}
                    >
                      ★
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                  Últimos 4 dígitos de tu teléfono *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  required
                  value={phoneLast4}
                  onChange={(e) => setPhoneLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="Ej. 5792"
                  className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                />
                <p className="text-[11px] text-text-secondary mt-1">
                  Verifica que eres el titular del teléfono registrado en la compra.
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                  Nombre a mostrar (opcional)
                </label>
                <input
                  type="text"
                  maxLength={80}
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Tu nombre o iniciales"
                  className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                Tu comentario *
              </label>
              <textarea
                required
                minLength={10}
                maxLength={1000}
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="¿Qué te pareció la calidad del producto, la entrega y la atención?"
                className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                Foto del producto instalado (opcional, máx. 2 MB)
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
                  if (f && f.type && !allowed.has(f.type)) {
                    setReviewError("El archivo debe ser una imagen JPG, PNG, WEBP o GIF.");
                    setAvatarFile(null);
                    e.target.value = "";
                    return;
                  }
                  if (f && f.size > 2 * 1024 * 1024) {
                    setReviewError("La imagen supera los 2 MB permitidos.");
                    setAvatarFile(null);
                    e.target.value = "";
                    return;
                  }
                  setReviewError(null);
                  setAvatarFile(f);
                }}
                className="w-full text-xs text-text-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-primary/15 file:text-brand-dark hover:file:bg-brand-primary/25 cursor-pointer"
              />
            </div>

            {reviewError && (
              <p className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
                {reviewError}
              </p>
            )}

            <button
              type="submit"
              disabled={submittingReview}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-brand-primary hover:bg-brand-dark text-neutral-dark hover:text-accent-cream text-sm font-bold transition-colors disabled:opacity-60 cursor-pointer"
            >
              {submittingReview ? "Enviando reseña…" : "Enviar reseña verificada"}
            </button>
          </form>
        ) : (
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-xs text-text-secondary">
            {isCancelledOrFailed
              ? "Este pedido no se concretó, por lo que no admite reseña."
              : "La opción para dejar una reseña verificada se habilitará automáticamente en cuanto tu pedido sea marcado como Entregado."}
          </div>
        )}
      </section>
    </div>
  );
}

