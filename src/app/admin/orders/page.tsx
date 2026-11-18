import { getSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { cancelStalePendingPayphoneOrders, getOrders } from "@/lib/orders";
import OrdersTable from "./OrdersTable";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const session = await getSession();
  if (!session) redirect("/admin-login");

  // Reconciliación perezosa: al abrir el panel se limpian las órdenes Payphone
  // colgadas en pending (cliente que pagó/abandonó y nunca volvió; Payphone ya
  // auto-reversó la retención). Sin cron ni acción manual. No debe romper la
  // página si falla.
  try {
    await cancelStalePendingPayphoneOrders();
  } catch (err) {
    console.error("[Reconciliación] Falló al limpiar órdenes pending vencidas:", err);
  }

  const orders = await getOrders();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Ventas web y pedidos externos sincronizados con Portal Fraylin
          </p>
        </div>
        <Link
          href="/admin/orders/new"
          className="inline-flex min-h-[48px] sm:min-h-[42px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 active:scale-[0.99]"
        >
          <PlusCircle className="h-4 w-4" aria-hidden />
          Crear pedido manual
        </Link>
      </div>
      <OrdersTable orders={orders} />
    </div>
  );
}
