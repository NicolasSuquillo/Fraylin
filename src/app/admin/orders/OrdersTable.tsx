"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  MessageCircle,
  Package,
  PlusCircle,
  Search,
  ShoppingBag,
  Truck,
  X,
} from "lucide-react";
import type { FulfillmentStatus, Order } from "@/types";
import { buildWhatsAppUrl } from "@/lib/constants";
import { formatUSD } from "@/lib/money";
import StatusBadge from "./StatusBadge";
import FulfillmentSelect from "./FulfillmentSelect";

interface Props {
  orders: Order[];
}

type StageFilter = "all" | "pending_pay" | "in_progress" | "entregado";

function methodLabel(method: Order["paymentMethod"]): string {
  return method === "transferencia" ? "Transferencia / Externo" : "Payphone";
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleString("es-EC", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function whatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("0") ? `593${digits.slice(1)}` : digits;
}

function itemsSummary(order: Order): string {
  const items = order.items ?? [];
  if (items.length === 0) return "Sin productos";
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);
  const first = items[0].productName;
  if (items.length === 1) return `${totalQty}× ${first}`;
  return `${first} (+${items.length - 1} más · ${totalQty} u.)`;
}

export default function OrdersTable({ orders }: Props) {
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");
  const [fulfillmentFilter, setFulfillmentFilter] = useState<"" | FulfillmentStatus>("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const stats = useMemo(() => {
    const pendingPay = orders.filter((o) => o.status === "pending").length;
    const inProgress = orders.filter(
      (o) =>
        o.fulfillmentStatus !== "entregado" &&
        o.status !== "cancelled" &&
        o.status !== "failed"
    ).length;
    const delivered = orders.filter((o) => o.fulfillmentStatus === "entregado").length;
    const paidTotalCents = orders
      .filter((o) => o.status === "paid")
      .reduce((sum, o) => sum + o.totalCents, 0);
    return {
      total: orders.length,
      pendingPay,
      inProgress,
      delivered,
      paidTotalCents,
    };
  }, [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (stageFilter === "pending_pay" && o.status !== "pending") return false;
      if (
        stageFilter === "in_progress" &&
        (o.fulfillmentStatus === "entregado" ||
          o.status === "cancelled" ||
          o.status === "failed")
      ) {
        return false;
      }
      if (stageFilter === "entregado" && o.fulfillmentStatus !== "entregado") return false;
      if (fulfillmentFilter && o.fulfillmentStatus !== fulfillmentFilter) return false;

      if (!q) return true;
      const itemNames = (o.items ?? []).map((i) => i.productName.toLowerCase()).join(" ");
      return (
        o.clientTransactionId.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q) ||
        itemNames.includes(q)
      );
    });
  }, [orders, query, stageFilter, fulfillmentFilter]);

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      window.setTimeout(() => setCopiedCode(null), 1600);
    } catch {
      window.prompt("Copia el código del pedido:", code);
    }
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-14 px-4 text-center space-y-3">
        <Package className="mx-auto h-10 w-10 text-gray-300" aria-hidden />
        <p className="text-base font-semibold text-gray-700">Aún no hay pedidos registrados</p>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Los pedidos de la tienda web aparecerán aquí automáticamente, o puedes registrar una
          venta realizada por WhatsApp o en el local.
        </p>
        <Link
          href="/admin/orders/new"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-amber-600 px-5 text-sm font-semibold text-white hover:bg-amber-700"
        >
          <PlusCircle className="h-4 w-4" aria-hidden />
          Crear primer pedido
        </Link>
      </div>
    );
  }

  const kpiButtons: Array<{
    id: StageFilter;
    label: string;
    value: string | number;
    Icon: typeof ShoppingBag;
    tone: string;
  }> = [
    {
      id: "all",
      label: "Todos",
      value: stats.total,
      Icon: ShoppingBag,
      tone: "text-gray-700",
    },
    {
      id: "pending_pay",
      label: "Por cobrar",
      value: stats.pendingPay,
      Icon: Clock,
      tone: "text-amber-700",
    },
    {
      id: "in_progress",
      label: "Por entregar",
      value: stats.inProgress,
      Icon: Truck,
      tone: "text-sky-700",
    },
    {
      id: "entregado",
      label: "Entregados",
      value: stats.delivered,
      Icon: CheckCircle2,
      tone: "text-emerald-700",
    },
  ];

  const hasFilters = Boolean(query || stageFilter !== "all" || fulfillmentFilter);

  return (
    <div className="space-y-4">
      {/* KPIs rápidos + filtro */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
        {kpiButtons.map(({ id, label, value, Icon, tone }) => {
          const active = stageFilter === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setStageFilter(active && id !== "all" ? "all" : id)}
              className={`rounded-2xl border p-3.5 text-left transition ${
                active
                  ? "border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-medium text-gray-500">{label}</span>
                <Icon className={`h-4 w-4 ${tone}`} aria-hidden />
              </div>
              <p className={`mt-1.5 text-2xl font-bold tabular-nums ${tone}`}>{value}</p>
            </button>
          );
        })}

        <div className="col-span-2 sm:col-span-1 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3.5">
          <p className="text-xs font-medium text-emerald-800">Pagados</p>
          <p className="mt-1.5 text-xl font-bold tabular-nums text-emerald-900">
            {formatUSD(stats.paidTotalCents)}
          </p>
        </div>
      </div>

      {/* Buscador y filtros */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por código FR…, cliente, teléfono o producto…"
            aria-label="Buscar pedidos"
            className="w-full min-h-[44px] rounded-xl border border-gray-200 bg-white pl-9 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <select
          value={fulfillmentFilter}
          onChange={(e) => setFulfillmentFilter(e.target.value as "" | FulfillmentStatus)}
          aria-label="Filtrar por etapa de entrega"
          className="min-h-[44px] rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="">Todas las etapas</option>
          <option value="nuevo">Nuevo / Recibido</option>
          <option value="preparando">En preparación</option>
          <option value="coordinado">Coordinado</option>
          <option value="entregado">Entregado</option>
        </select>

        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setStageFilter("all");
              setFulfillmentFilter("");
            }}
            className="inline-flex min-h-[44px] items-center justify-center gap-1 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-600 hover:bg-gray-50"
          >
            <X className="h-3.5 w-3.5" />
            Limpiar
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-200 bg-white py-10 text-center text-sm text-gray-500">
          Ningún pedido coincide con los filtros actuales.
        </p>
      ) : (
        <>
          {/* Vista móvil: tarjetas ergonómicas */}
          <div className="md:hidden space-y-3">
            {filtered.map((o) => {
              const waUrl = buildWhatsAppUrl(
                whatsAppNumber(o.customerPhone),
                `Hola ${o.customerName}, te escribimos de Fraylin sobre tu pedido ${o.clientTransactionId}.`
              );
              const isCopied = copiedCode === o.clientTransactionId;
              return (
                <article
                  key={o.id}
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-amber-800">
                          {o.clientTransactionId}
                        </span>
                        <button
                          type="button"
                          onClick={() => void copyCode(o.clientTransactionId)}
                          className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                          aria-label={`Copiar código ${o.clientTransactionId}`}
                        >
                          {isCopied ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                      <h2 className="mt-0.5 truncate text-base font-bold text-gray-900">
                        {o.customerName}
                      </h2>
                      <p className="text-xs text-gray-500">{formatDate(o.createdAt)}</p>
                    </div>
                    <StatusBadge status={o.status} />
                  </div>

                  <p className="rounded-xl bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700">
                    {itemsSummary(o)}
                  </p>

                  <div className="flex items-center justify-between gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-500">{methodLabel(o.paymentMethod)}</p>
                      <p className="text-lg font-bold text-gray-900">{formatUSD(o.totalCents)}</p>
                    </div>
                    <div className="text-right">
                      <span className="block text-[11px] font-medium text-gray-500 mb-0.5">
                        Entrega
                      </span>
                      <FulfillmentSelect orderId={o.id} value={o.fulfillmentStatus} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[46px] items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-800 active:bg-emerald-100"
                    >
                      <MessageCircle className="h-4 w-4" aria-hidden />
                      WhatsApp
                    </a>
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="inline-flex min-h-[46px] items-center justify-center gap-1.5 rounded-xl bg-amber-600 px-3 text-sm font-semibold text-white active:bg-amber-700"
                    >
                      <Eye className="h-4 w-4" aria-hidden />
                      Gestionar
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Vista escritorio: tabla */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full min-w-[880px] text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Código / Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Productos
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Entrega
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs font-bold text-amber-800">
                          {o.clientTransactionId}
                        </span>
                        <button
                          type="button"
                          onClick={() => void copyCode(o.clientTransactionId)}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                          title="Copiar código"
                        >
                          {copiedCode === o.clientTransactionId ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">{formatDate(o.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{o.customerName}</p>
                      <p className="text-xs text-gray-500">{o.customerPhone}</p>
                    </td>
                    <td className="px-4 py-3 max-w-[220px]">
                      <p className="truncate text-xs font-medium text-gray-700">
                        {itemsSummary(o)}
                      </p>
                      <p className="text-[11px] text-gray-400">{methodLabel(o.paymentMethod)}</p>
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-900">
                      {formatUSD(o.totalCents)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3">
                      <FulfillmentSelect orderId={o.id} value={o.fulfillmentStatus} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <a
                          href={buildWhatsAppUrl(
                            whatsAppNumber(o.customerPhone),
                            `Hola ${o.customerName}, te escribimos de Fraylin sobre tu pedido ${o.clientTransactionId}.`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-emerald-800 hover:bg-emerald-100"
                          title="Escribir por WhatsApp"
                          aria-label={`Escribir por WhatsApp a ${o.customerName}`}
                        >
                          <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                        </a>
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          <Eye className="h-3.5 w-3.5" aria-hidden />
                          Gestionar
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
