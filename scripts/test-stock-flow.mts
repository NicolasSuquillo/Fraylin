/**
 * Pruebas de flujo de stock (transferencia, markPaid, cancel, concurrencia).
 * Uso: npx tsx scripts/test-stock-flow.mts
 */
import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import { eq, sql } from "drizzle-orm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
config({ path: resolve(root, ".env.local") });

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL no definida en .env.local");
  process.exit(1);
}

const { db } = await import("../src/db/index.ts");
const { orders, orderItems, products, categories } = await import("../src/db/schema.ts");
const {
  reserveOrderStock,
  StockUnavailableError,
  markOrderPaidManually,
  cancelTransferOrderManually,
  cancelStalePendingTransferOrders,
} = await import("../src/lib/orders.ts");

const TEST_PRODUCT_ID = "__test_stock_flow_product";
const INITIAL_STOCK = 10;
const QTY_RESERVE = 3;

type Result = { name: string; pass: boolean; evidence: string };

const results: Result[] = [];
const orderIds: string[] = [];

function record(name: string, pass: boolean, evidence: string) {
  results.push({ name, pass, evidence });
  const tag = pass ? "PASS" : "FAIL";
  console.log(`[${tag}] ${name}`);
  console.log(`       ${evidence}`);
}

function txId() {
  return `TST${randomBytes(6).toString("hex").toUpperCase()}`;
}

async function getStock(productId: string): Promise<number | null> {
  const row = await db.query.products.findFirst({
    where: eq(products.id, productId),
    columns: { stock: true },
  });
  return row?.stock ?? null;
}


async function withDbRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      const code = (e as { cause?: { code?: string } })?.cause?.code;
      if (code === "57014" && i < attempts - 1) {
        await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
        continue;
      }
      throw e;
    }
  }
  throw last;
}
async function ensureTestProduct(): Promise<void> {
  const cat = await db.query.categories.findFirst({ columns: { slug: true } });
  if (!cat) throw new Error("No hay categorías en la DB");
  await db
    .insert(products)
    .values({
      id: TEST_PRODUCT_ID,
      categorySlug: cat.slug,
      name: "TEST Stock Flow (borrar)",
      priceCents: 1000,
      transferPriceCents: 1000,
      stock: INITIAL_STOCK,
    })
    .onConflictDoUpdate({
      target: products.id,
      set: { stock: INITIAL_STOCK, name: "TEST Stock Flow (borrar)", priceCents: 1000, transferPriceCents: 1000 },
    });
}

async function createTransferOrderReserve(
  quantity: number
): Promise<{ orderId: string; reserved: boolean; error?: string }> {
  try {
    const order = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(orders)
        .values({
          clientTransactionId: txId(),
          paymentMethod: "transferencia",
          customerName: "Test Stock",
          customerPhone: "0999999999",
          customerEmail: "test@example.com",
          customerAddress: "Test addr",
          subtotalCents: 1000 * quantity,
          taxCents: 0,
          totalCents: 1000 * quantity,
        })
        .returning();
      await tx.insert(orderItems).values({
        orderId: created.id,
        productId: TEST_PRODUCT_ID,
        productName: "TEST Stock Flow",
        unitPriceCents: 1000,
        quantity,
        lineTotalCents: 1000 * quantity,
      });
      await reserveOrderStock(tx, created.id);
      return created;
    });
    orderIds.push(order.id);
    return { orderId: order.id, reserved: true };
  } catch (e) {
    if (e instanceof StockUnavailableError) {
      return { orderId: "", reserved: false, error: "StockUnavailableError" };
    }
    throw e;
  }
}

async function getOrderStatus(orderId: string): Promise<string | null> {
  const row = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    columns: { status: true },
  });
  return row?.status ?? null;
}

async function cleanup(): Promise<void> {
  if (orderIds.length > 0) {
    await db.delete(orders).where(sql`${orders.id} IN (${sql.join(orderIds.map((id) => sql`${id}`), sql`, `)})`);
  }
  await db.delete(products).where(eq(products.id, TEST_PRODUCT_ID));
}

async function run() {
  console.log("=== test-stock-flow ===\n");
  await withDbRetry(() => ensureTestProduct());
  const stock0 = await getStock(TEST_PRODUCT_ID);

  // 1) Transfer checkout reserva stock
  const r1 = await createTransferOrderReserve(QTY_RESERVE);
  const stock1 = await getStock(TEST_PRODUCT_ID);
  const status1 = r1.orderId ? await getOrderStatus(r1.orderId) : null;
  record(
    "Transfer reserva stock atómicamente",
    r1.reserved &&
      stock0 === INITIAL_STOCK &&
      stock1 === INITIAL_STOCK - QTY_RESERVE &&
      status1 === "pending",
    `stock antes=${stock0} después=${stock1} qty=${QTY_RESERVE} order=${r1.orderId} status=${status1}`
  );

  const orderA = r1.orderId;

  // 2) Segundo checkout falla si agotado
  const needMoreThanLeft = INITIAL_STOCK - QTY_RESERVE + 1;
  const r2 = await createTransferOrderReserve(needMoreThanLeft);
  const stock2 = await getStock(TEST_PRODUCT_ID);
  record(
    "Segundo transfer falla sin stock",
    !r2.reserved && r2.error === "StockUnavailableError" && stock2 === stock1,
    `intento qty=${needMoreThanLeft} reserved=${r2.reserved} stock=${stock2} (esperado ${stock1})`
  );

  // 3) markPaid no descuenta de nuevo
  const stockBeforePaid = await getStock(TEST_PRODUCT_ID);
  const paid1 = await markOrderPaidManually(orderA);
  const stockAfterPaid1 = await getStock(TEST_PRODUCT_ID);
  const paid2 = await markOrderPaidManually(orderA);
  const stockAfterPaid2 = await getStock(TEST_PRODUCT_ID);
  record(
    "markPaid no doble-descuenta (idempotente)",
    paid1.status === "paid" &&
      paid2.status === "paid" &&
      stockBeforePaid === stockAfterPaid1 &&
      stockAfterPaid1 === stockAfterPaid2,
    `status1=${paid1.status} status2=${paid2.status} stock antes=${stockBeforePaid} después1=${stockAfterPaid1} después2=${stockAfterPaid2}`
  );

  // 4) cancel restaura stock — nueva orden pending
  const r3 = await createTransferOrderReserve(2);
  const stockAfterReserve = await getStock(TEST_PRODUCT_ID);
  const cancelled = await cancelTransferOrderManually(r3.orderId);
  const stockAfterCancel = await getStock(TEST_PRODUCT_ID);
  record(
    "cancelTransfer restaura stock",
    r3.reserved &&
      cancelled.status === "cancelled" &&
      stockAfterCancel === stockAfterReserve + 2,
    `order=${r3.orderId} stock reserva=${stockAfterReserve} después cancel=${stockAfterCancel} (+2 esperado)`
  );

  // Idempotencia cancel
  const cancelled2 = await cancelTransferOrderManually(r3.orderId);
  const stockAfterCancel2 = await getStock(TEST_PRODUCT_ID);
  record(
    "cancelTransfer idempotente (sin doble restore)",
    cancelled2.status === "cancelled" && stockAfterCancel2 === stockAfterCancel,
    `status=${cancelled2.status} stock=${stockAfterCancel2}`
  );

  // 5) Reconciliación transfer vencida restaura stock
  const rStale = await createTransferOrderReserve(1);
  const stockBeforeStale = await getStock(TEST_PRODUCT_ID);
  await db
    .update(orders)
    .set({ createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000) })
    .where(eq(orders.id, rStale.orderId));
  const n = await cancelStalePendingTransferOrders(48);
  const stockAfterStale = await getStock(TEST_PRODUCT_ID);
  const staleStatus = await getOrderStatus(rStale.orderId);
  record(
    "cancelStalePendingTransfer restaura stock",
    n >= 1 && staleStatus === "cancelled" && stockAfterStale === stockBeforeStale + 1,
    `canceladas=${n} status=${staleStatus} stock antes=${stockBeforeStale} después=${stockAfterStale}`
  );

  // 6) Concurrencia: stock=2, dos reservas de 2 en paralelo
  await db.update(products).set({ stock: 2 }).where(eq(products.id, TEST_PRODUCT_ID));
  const parallel = await Promise.all([
    createTransferOrderReserve(2),
    createTransferOrderReserve(2),
  ]);
  const wins = parallel.filter((p) => p.reserved).length;
  const stockRace = await getStock(TEST_PRODUCT_ID);
  record(
    "Race paralela: una gana, una falla",
    wins === 1 && stockRace === 0,
    `éxitos=${wins} stock final=${stockRace} orders=${parallel.map((p) => p.orderId || "—").join(",")}`
  );

  // Cleanup: restaurar stock contable (orden paid A tiene stock reservado)
  await cleanup();

  console.log("\n=== RESUMEN ===");
  const passed = results.filter((r) => r.pass).length;
  const failed = results.length - passed;
  console.log(`Total: ${results.length} | PASS: ${passed} | FAIL: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(async (err) => {
  console.error(err);
  try {
    await cleanup();
  } catch {
    /* ignore */
  }
  process.exit(1);
});



