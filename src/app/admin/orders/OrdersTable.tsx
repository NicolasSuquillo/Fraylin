"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import type { Order } from "@/types";
import { formatUSD } from "@/lib/money";
import StatusBadge from "./StatusBadge";
import FulfillmentSelect from "./FulfillmentSelect";

interface Props {
  orders: Order[];
}

function methodLabel(method: Order["paymentMethod"]): string {
  return method === "transferencia" ? "Transferencia / Deuna" : "Payphone";
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleString("es-EC", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function OrdersTable({ orders }: Props) {
  if (orders.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-gray-200 bg-white py-12 text-center text-gray-500">
        Aún no hay pedidos.
      </p>
    );
  }

  return (
    <>
      {/* Vista móvil: tarjetas */}
      <div className="md:hidden space-y-3">
        {orders.map((o) => (
          <article key={o.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-gray-900 leading-snug">{o.customerName}</h2>
                <p className="mt-1 text-xs text-gray-500">{formatDate(o.createdAt)}</p>
              </div>
              <StatusBadge status={o.status} />
            </div>
            <dl className="mt-3 grid grid-cols-1 gap-1.5 text-sm text-gray-600">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Teléfono</dt>
                <dd className="text-right font-medium text-gray-800">{o.customerPhone}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Total</dt>
                <dd className="text-right font-medium text-gray-800">{formatUSD(o.totalCents)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Pago</dt>
                <dd className="text-right font-medium text-gray-800">{methodLabel(o.paymentMethod)}</dd>
              </div>
              <div className="flex justify-between items-center gap-4">
                <dt className="text-gray-500">Entrega</dt>
                <dd className="text-right">
                  <FulfillmentSelect orderId={o.id} value={o.fulfillmentStatus} />
                </dd>
              </div>
            </dl>
            <div className="mt-4">
              <Link
                href={`/admin/orders/${o.id}`}
                className="inline-flex w-full items-center justify-center gap-2 min-h-[48px] rounded-xl bg-amber-600 px-3 text-sm font-semibold text-white active:bg-amber-700"
              >
                <Eye className="h-4 w-4" aria-hidden />
                Ver detalle
              </Link>
            </div>
          </article>
        ))}
      </div>

      {/* Vista escritorio: tabla */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Fecha</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Cliente</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Total</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Pago</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Estado</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Entrega</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50/80">
                <td className="px-4 py-3 text-gray-600">{formatDate(o.createdAt)}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-800">{o.customerName}</p>
                  <p className="text-xs text-gray-500">{o.customerPhone}</p>
                </td>
                <td className="px-4 py-3 font-medium text-gray-800">{formatUSD(o.totalCents)}</td>
                <td className="px-4 py-3 text-gray-600">{methodLabel(o.paymentMethod)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={o.status} />
                </td>
                <td className="px-4 py-3">
                  <FulfillmentSelect orderId={o.id} value={o.fulfillmentStatus} />
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    <Eye className="h-4 w-4" aria-hidden />
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
