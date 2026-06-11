import { getSession } from "@/lib/admin-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { getOrderById } from "@/lib/orders";
import { formatUSD } from "@/lib/money";
import { buildWhatsAppUrl } from "@/lib/constants";
import StatusBadge from "../StatusBadge";
import FulfillmentSelect from "../FulfillmentSelect";
import MarkPaidButton from "../MarkPaidButton";

export const dynamic = "force-dynamic";

function whatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("0") ? `593${digits.slice(1)}` : digits;
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/admin-login");

  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  const whatsappUrl = buildWhatsAppUrl(
    whatsAppNumber(order.customerPhone),
    `Hola ${order.customerName}, te escribimos de Fraylin sobre tu pedido ${order.clientTransactionId}.`
  );

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/admin/orders"
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Volver a pedidos
      </Link>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Pedido {order.clientTransactionId}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {new Date(order.createdAt).toLocaleString("es-EC", { dateStyle: "long", timeStyle: "short" })}
            </p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <h2 className="font-semibold text-gray-700 mb-1">Cliente</h2>
            <p className="text-gray-800">{order.customerName}</p>
            <p className="text-gray-600">{order.customerPhone}</p>
            <p className="text-gray-600">{order.customerEmail}</p>
            <p className="text-gray-600">{order.customerAddress}</p>
          </div>
          <div>
            <h2 className="font-semibold text-gray-700 mb-1">Pago</h2>
            <p className="text-gray-600">
              Método: {order.paymentMethod === "transferencia" ? "Transferencia / Deuna" : "Payphone"}
            </p>
            <p className="text-gray-600">ID Payphone: {order.payphoneTransactionId ?? "—"}</p>
            <p className="text-gray-600">Código de estado: {order.payphoneStatusCode ?? "—"}</p>
            <p className="text-gray-600">
              Confirmado:{" "}
              {order.confirmedAt
                ? new Date(order.confirmedAt).toLocaleString("es-EC", { dateStyle: "short", timeStyle: "short" })
                : "—"}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <h2 className="font-semibold text-gray-700 mb-2">Artículos</h2>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Producto</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">Cant.</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">P. unitario</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {order.items?.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2 text-gray-800">{item.productName}</td>
                    <td className="px-3 py-2 text-right text-gray-600">{item.quantity}</td>
                    <td className="px-3 py-2 text-right text-gray-600">{formatUSD(item.unitPriceCents)}</td>
                    <td className="px-3 py-2 text-right font-medium text-gray-800">
                      {formatUSD(item.lineTotalCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <dl className="mt-3 ml-auto max-w-xs space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Subtotal</dt>
              <dd className="text-gray-800">{formatUSD(order.subtotalCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">IVA</dt>
              <dd className="text-gray-800">{formatUSD(order.taxCents)}</dd>
            </div>
            <div className="flex justify-between font-semibold text-base">
              <dt className="text-gray-700">Total</dt>
              <dd className="text-gray-900">{formatUSD(order.totalCents)}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Estado de entrega</label>
            <FulfillmentSelect orderId={order.id} value={order.fulfillmentStatus} />
          </div>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 min-h-[48px] rounded-xl bg-green-600 px-4 text-sm font-semibold text-white hover:bg-green-700"
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            Escribir al cliente
          </a>
          {order.paymentMethod === "transferencia" && order.status === "pending" && (
            <MarkPaidButton orderId={order.id} />
          )}
        </div>
      </div>
    </div>
  );
}
