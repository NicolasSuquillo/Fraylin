import { NextResponse } from "next/server";
import { getSession } from "@/lib/admin-auth";
import { getOrders } from "@/lib/orders";

export async function GET() {
  if (!(await getSession())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const orders = await getOrders();
  return NextResponse.json({ orders });
}
