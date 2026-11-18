import { getSession } from "@/lib/admin-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ExternalLink, MessageCircle, ShieldCheck } from "lucide-react";
import { getOrderById } from "@/lib/orders";
import { formatUSD } from "@/lib/money";
import { buildWhatsAppUrl } from "@/lib/constants";
import StatusBadge from "../StatusBadge";
import MarkPaidButton from "../MarkPaidButton";
import CancelOrderButton from "../CancelOrderButton";
import CopyTrackingQuickActions from "./CopyTrackingQuickActions";
import DownloadComprobanteButton from "./DownloadComprobanteButton";
import TrackingUpdateForm from "./TrackingUpdateForm";

export const dynamic = "force-dynamic";

function whatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("0") ? `593${digits.slice(1)}` : digits;
}

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/admin-login");

  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const order = await getOrderById(id);
  if (!order) notFound();

  const justCreated = sp.created === "1";
  const trackingPath = `/seguimiento/${order.clientTransactionId}`;
  const portalUrl = process.env.NEXT_PUBLIC_PORTAL_URL?.trim();
  const portalTrackingUrl = portalUrl
    ? `${portalUrl.replace(/\/$/, "")}/seguimiento/${encodeURIComponent(order.clientTransactionId)}`
    : null;

  const whatsappUrl = buildWhatsAppUrl(
    whatsAppNumber(order.customerPhone),
    `Hola ${order.customerName}, te escribimos de Fraylin sobre tu pedido ${order.clientTransactionId}.`
  );

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Link
        href="/admin/orders"
        className="inline-flex min-h-[44px] sm:min-h-0 items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Volver a pedidos
      </Link>

      {justCreated && (
        <div
          role="status"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3 text-emerald-950"
        >
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden />
          <div className="text-sm space-y-1">
            <p className="font-bold">Pedido registrado y sincronizado con Portal Fraylin</p>
            <p className="text-xs text-emerald-800">
              Comparte el código{" "}
              <span className="font-mono font-bold">{order.clientTransactionId}</span> con el
              cliente para que pueda seguir su entrega en tiempo real.
            </p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-mono text-xl sm:text-2xl font-bold text-gray-900">
              Pedido {order.clientTransactionId}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {new Date(order.createdAt).toLocaleString("es-EC", {
                dateStyle: "long",
                timeStyle: "short",
              })}
            </p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <CopyTrackingQuickActions
          code={order.clientTransactionId}
          trackingPath={trackingPath}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-gray-100 bg-gray-50/70 p-4 text-sm">
          <div className="space-y-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Cliente</h2>
            <p className="font-semibold text-gray-900">{order.customerName}</p>
            <p className="text-gray-700">{order.customerPhone}</p>
            <p className="text-gray-600">
              {order.customerEmail.trim() || "Correo no registrado"}
            </p>
            <p className="text-gray-600">{order.customerAddress}</p>
          </div>
          <div className="space-y-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Pago</h2>
            <p className="text-gray-700">
              Método:{" "}
              <span className="font-medium text-gray-900">
                {order.paymentMethod === "transferencia"
                  ? "Transferencia / Venta directa"
                  : "Payphone"}
              </span>
            </p>
            {order.payphoneTransactionId && (
              <p className="text-gray-600">ID Payphone: {order.payphoneTransactionId}</p>
            )}
            {order.payphoneStatusCode != null && (
              <p className="text-gray-600">Código de estado: {order.payphoneStatusCode}</p>
            )}
            <p className="text-gray-600">
              Confirmado:{" "}
              {order.confirmedAt
                ? new Date(order.confirmedAt).toLocaleString("es-EC", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })
                : "Pendiente"}
            </p>
          </div>
        </div>

        {/* Artículos: tarjetas en móvil, tabla en escritorio */}
        <div>
          <h2 className="font-semibold text-gray-800 mb-2.5 text-sm">Artículos</h2>

          <div className="sm:hidden space-y-2">
            {order.items?.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-gray-200 p-3 flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-gray-900">{item.productName}</p>
                  {(item.productCategory || item.productSpecs) && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {[item.productCategory, item.productSpecs].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  <p className="text-xs text-gray-600 mt-1">
                    {item.quantity} × {formatUSD(item.unitPriceCents)}
                  </p>
                </div>
                <p className="font-bold text-sm text-gray-900 shrink-0">
                  {formatUSD(item.lineTotalCents)}
                </p>
              </div>
            ))}
          </div>

          <div className="hidden sm:block overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2.5 text-left font-medium text-gray-600">Producto</th>
                  <th className="px-3 py-2.5 text-right font-medium text-gray-600">Cant.</th>
                  <th className="px-3 py-2.5 text-right font-medium text-gray-600">P. unitario</th>
                  <th className="px-3 py-2.5 text-right font-medium text-gray-600">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {order.items?.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2.5 text-gray-800">
                      <p className="font-medium">{item.productName}</p>
                      {(item.productCategory || item.productSpecs) && (
                        <p className="text-xs text-gray-500">
                          {[item.productCategory, item.productSpecs].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-600">{item.quantity}</td>
                    <td className="px-3 py-2.5 text-right text-gray-600">
                      {formatUSD(item.unitPriceCents)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-gray-900">
                      {formatUSD(item.lineTotalCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <dl className="mt-3 ml-auto max-w-xs space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Base imponible</dt>
              <dd className="text-gray-800">{formatUSD(order.subtotalCents)}</dd>
            </div>
            {order.shippingCents > 0 && (
              <div className="flex justify-between">
                <dt className="text-gray-500">
                  Envío{order.shippingZoneLabel ? ` (${order.shippingZoneLabel})` : ""}
                </dt>
                <dd className="text-gray-800">{formatUSD(order.shippingCents)}</dd>
              </div>
            )}
            {order.installationCents > 0 && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Instalación</dt>
                <dd className="text-gray-800">{formatUSD(order.installationCents)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-gray-500">IVA 15%</dt>
              <dd className="text-gray-800">{formatUSD(order.taxCents)}</dd>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-1.5 font-bold text-base">
              <dt className="text-gray-800">Total</dt>
              <dd className="text-amber-800">{formatUSD(order.totalCents)}</dd>
            </div>
          </dl>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 sm:flex-none items-center justify-center gap-2 min-h-[46px] rounded-xl bg-green-600 px-4 text-sm font-semibold text-white hover:bg-green-700"
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            Escribir al cliente
          </a>
          <Link
            href={trackingPath}
            target="_blank"
            className="inline-flex flex-1 sm:flex-none items-center justify-center gap-2 min-h-[46px] rounded-xl border border-amber-300 bg-amber-50 px-4 text-sm font-semibold text-amber-900 hover:bg-amber-100"
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            Seguimiento tienda
          </Link>
          {portalTrackingUrl && (
            <a
              href={portalTrackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 sm:flex-none items-center justify-center gap-2 min-h-[46px] rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <ExternalLink className="h-4 w-4" aria-hidden />
              Ver en Portal
            </a>
          )}
          {order.paymentMethod === "transferencia" && order.status === "pending" && (
            <>
              <MarkPaidButton orderId={order.id} />
              <CancelOrderButton orderId={order.id} />
            </>
          )}
          {order.status === "paid" && (
            <DownloadComprobanteButton
              orderId={order.id}
              clientTransactionId={order.clientTransactionId}
            />
          )}
        </div>

        <TrackingUpdateForm
          orderId={order.id}
          initialStatus={order.fulfillmentStatus}
          initialNote={order.trackingNote ?? null}
        />

        {order.review && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                <ShieldCheck className="h-4 w-4" />
                Reseña verificada del cliente ({order.review.rating}/5 ★)
              </span>
              <span className="text-xs text-gray-500">
                {order.review.approved ? "Aprobada en web" : "Pendiente de aprobación"}
              </span>
            </div>
            <p className="text-sm text-gray-800">&ldquo;{order.review.body}&rdquo;</p>
            <p className="text-xs text-gray-500">— {order.review.authorName}</p>
          </div>
        )}

        <div>
          <h2 className="font-semibold text-gray-800 mb-3 text-sm">Historial de trazabilidad</h2>
          {!order.events || order.events.length === 0 ? (
            <p className="text-xs text-gray-500">Sin eventos registrados.</p>
          ) : (
            <ol className="space-y-3">
              {order.events.map((ev) => (
                <li key={ev.id} className="border-l-2 border-amber-300 pl-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-gray-800">{ev.title}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(ev.createdAt).toLocaleString("es-EC", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">Actor: {ev.actor}</p>
                  {ev.description && (
                    <p className="text-xs text-gray-700 mt-1">{ev.description}</p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
