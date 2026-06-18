import { getSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
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
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Pedidos</h1>
      <OrdersTable orders={orders} />
    </div>
  );
}
