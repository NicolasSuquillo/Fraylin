import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { verifyIntegrationAuth } from "@/lib/integration-auth";
import { buildSyncOrderPayload, syncAllOrdersToPortal } from "@/lib/portal-sync";

export async function GET(req: NextRequest) {
  if (!verifyIntegrationAuth(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const rows = await db
    .select({ id: orders.id })
    .from(orders)
    .orderBy(desc(orders.createdAt));

  const payloads = [];
  for (const row of rows) {
    const p = await buildSyncOrderPayload(row.id);
    if (p) payloads.push(p);
  }

  return NextResponse.json({ orders: payloads });
}

export async function POST(req: NextRequest) {
  if (!verifyIntegrationAuth(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const synced = await syncAllOrdersToPortal();
  return NextResponse.json({ ok: true, synced });
}

