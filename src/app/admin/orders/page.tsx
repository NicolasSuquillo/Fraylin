import { getSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { getOrders } from "@/lib/orders";
import OrdersTable from "./OrdersTable";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const session = await getSession();
  if (!session) redirect("/admin-login");

  const orders = await getOrders();

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Pedidos</h1>
      <OrdersTable orders={orders} />
    </div>
  );
}
