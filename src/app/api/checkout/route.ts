import { NextRequest, NextResponse } from "next/server";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderItems, products } from "@/db/schema";
import { firstCheckoutError, validateCheckoutCustomer } from "@/lib/checkout-validation";
import { computeTaxBreakdown } from "@/lib/money";
import { PAYMENT_METHODS, type CheckoutCustomer, type PaymentMethod } from "@/types";

interface CheckoutRequestItem {
  productId: string;
  quantity: number;
}

interface CheckoutRequestBody {
  customer: CheckoutCustomer;
  items: CheckoutRequestItem[];
  paymentMethod?: PaymentMethod;
}

function generateClientTransactionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `FR${timestamp}${random}`.toUpperCase();
}

export async function POST(req: NextRequest) {
  let body: CheckoutRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  try {
    const { customer, items } = body;
    const paymentMethod: PaymentMethod = body.paymentMethod ?? "payphone";

    if (!PAYMENT_METHODS.includes(paymentMethod)) {
      return NextResponse.json({ error: "Método de pago inválido" }, { status: 400 });
    }

    const customerValidation = validateCheckoutCustomer(customer ?? {});
    if (!customerValidation.valid) {
      return NextResponse.json({ error: firstCheckoutError(customerValidation.errors) }, { status: 400 });
    }
    const normalizedCustomer = customerValidation.normalized;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 });
    }

    for (const item of items) {
      if (!item.productId || !Number.isInteger(item.quantity) || item.quantity < 1) {
        return NextResponse.json({ error: "Cantidad inválida" }, { status: 400 });
      }
    }

    const dbProducts = await db.query.products.findMany({
      where: inArray(
        products.id,
        items.map((i) => i.productId)
      ),
    });

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json({ error: `Producto no encontrado: ${item.productId}` }, { status: 400 });
      }
      if (product.priceCents == null) {
        return NextResponse.json(
          { error: `${product.name} no está disponible para compra en línea` },
          { status: 400 }
        );
      }
      if (product.stock != null && product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Stock insuficiente para ${product.name} (disponible: ${product.stock})` },
          { status: 400 }
        );
      }
    }

    const totalCents = items.reduce((sum, item) => {
      const product = productMap.get(item.productId)!;
      return sum + product.priceCents! * item.quantity;
    }, 0);

    const { subtotalCents, taxCents } = computeTaxBreakdown(totalCents);
    const clientTransactionId = generateClientTransactionId();

    const order = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(orders)
        .values({
          clientTransactionId,
          paymentMethod,
          customerName: normalizedCustomer.name,
          customerPhone: normalizedCustomer.phone,
          customerEmail: normalizedCustomer.email,
          customerAddress: normalizedCustomer.address,
          subtotalCents,
          taxCents,
          totalCents,
        })
        .returning();

      await tx.insert(orderItems).values(
        items.map((item) => {
          const product = productMap.get(item.productId)!;
          return {
            orderId: created.id,
            productId: product.id,
            productName: product.name,
            unitPriceCents: product.priceCents!,
            quantity: item.quantity,
            lineTotalCents: product.priceCents! * item.quantity,
          };
        })
      );

      return created;
    });

    return NextResponse.json({
      orderId: order.id,
      clientTransactionId: order.clientTransactionId,
      paymentMethod: order.paymentMethod,
      totalCents: order.totalCents,
      subtotalCents: order.subtotalCents,
      taxCents: order.taxCents,
    });
  } catch (error) {
    console.error("Error en checkout:", error);
    return NextResponse.json(
      { error: "No se pudo crear el pedido. Intenta de nuevo." },
      { status: 500 }
    );
  }
}
