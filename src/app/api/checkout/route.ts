import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderItems, products } from "@/db/schema";
import { firstCheckoutError, validateCheckoutCustomer } from "@/lib/checkout-validation";
import { computeTaxBreakdown } from "@/lib/money";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getPricingSettings } from "@/lib/pricing";
import { PAYMENT_METHODS, type CheckoutCustomer, type PaymentMethod } from "@/types";

interface CheckoutRequestItem {
  productId: string;
  quantity: number;
}

interface CheckoutRequestBody {
  customer: CheckoutCustomer;
  items: CheckoutRequestItem[];
  paymentMethod?: PaymentMethod;
  shippingZoneId?: string;
  installationRequested?: boolean;
}

function generateClientTransactionId(): string {
  return `FR${randomBytes(8).toString("hex").toUpperCase()}`;
}

const MAX_ITEMS = 50;
const MAX_QUANTITY = 99;
const MAX_PRODUCT_ID_LENGTH = 100;
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 min

export async function POST(req: NextRequest) {
  if (!checkRateLimit(`checkout:${getClientIp(req)}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Demasiados pedidos seguidos. Intenta de nuevo en unos minutos." },
      { status: 429 }
    );
  }

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

    const pricing = await getPricingSettings();
    const isTransfer = paymentMethod === "transferencia";

    // Necesitamos los productos antes de validar envío (para los flags de gratis)
    // Validación preliminar de items
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 });
    }

    const dbProductsEarly = await db.query.products.findMany({
      where: inArray(products.id, body.items.map((i: CheckoutRequestItem) => i.productId)),
    });

    const allFreeShipping = dbProductsEarly.length > 0 && dbProductsEarly.every((p) => p.freeShipping);
    const allFreeInstallation = dbProductsEarly.length > 0 && dbProductsEarly.every((p) => p.freeInstallation);

    // Precio de instalación por producto según método (transferencia vs tarjeta).
    const installationForProduct = (p: typeof dbProductsEarly[number]): number =>
      isTransfer
        ? p.installationTransferCents ?? pricing.installationTransferCents
        : p.installationCents ?? pricing.installationCents;

    const uniqueProductIds = [...new Set(body.items.map((i: CheckoutRequestItem) => i.productId))];
    const totalInstallationIfRequested = uniqueProductIds.reduce((sum: number, pid: string) => {
      const p = dbProductsEarly.find((dp) => dp.id === pid);
      if (!p || p.freeInstallation) return sum;
      return sum + installationForProduct(p);
    }, 0);

    let shippingZone: { id: string; label: string; cents: number };
    if (allFreeShipping) {
      shippingZone = { id: "free", label: "Envío gratis", cents: 0 };
    } else {
      const found = pricing.zones.find((z) => z.id === body.shippingZoneId);
      if (pricing.shippingEnabled) {
        if (!found) {
          return NextResponse.json({ error: "Zona de envío inválida" }, { status: 400 });
        }
        // Cobro de envío según método de pago.
        shippingZone = {
          id: found.id,
          label: found.label,
          cents: isTransfer ? found.transferCents : found.cents,
        };
      } else {
        shippingZone = { id: "none", label: "", cents: 0 };
      }
    }

    const installationRequested = allFreeInstallation || (pricing.installationEnabled && body.installationRequested === true);

    const customerValidation = validateCheckoutCustomer(customer ?? {});
    if (!customerValidation.valid) {
      return NextResponse.json({ error: firstCheckoutError(customerValidation.errors) }, { status: 400 });
    }
    const normalizedCustomer = customerValidation.normalized;

    if (items.length > MAX_ITEMS) {
      return NextResponse.json({ error: "El carrito tiene demasiados productos" }, { status: 400 });
    }

    for (const item of items) {
      if (
        !item.productId ||
        typeof item.productId !== "string" ||
        item.productId.length > MAX_PRODUCT_ID_LENGTH ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > MAX_QUANTITY
      ) {
        return NextResponse.json({ error: "Cantidad inválida" }, { status: 400 });
      }
    }

    const productMap = new Map(dbProductsEarly.map((p) => [p.id, p]));

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

    // Precio unitario del producto según método: transferencia (base) o tarjeta
    // (incluye comisión Payphone). Fallback a precio tarjeta si falta el de transferencia.
    const unitPriceFor = (product: typeof dbProductsEarly[number]): number =>
      isTransfer ? product.transferPriceCents ?? product.priceCents! : product.priceCents!;

    const productSubtotalCents = items.reduce((sum, item) => {
      const product = productMap.get(item.productId)!;
      return sum + unitPriceFor(product) * item.quantity;
    }, 0);

    const { subtotalCents, taxCents } = computeTaxBreakdown(productSubtotalCents);
    const shippingCents = shippingZone.cents;
    const installationCents = installationRequested ? totalInstallationIfRequested : 0;
    const totalCents = productSubtotalCents + shippingCents + installationCents;
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
          shippingCents,
          installationCents,
          shippingZoneLabel: shippingZone.label || null,
          totalCents,
        })
        .returning();

      await tx.insert(orderItems).values(
        items.map((item) => {
          const product = productMap.get(item.productId)!;
          const unit = unitPriceFor(product);
          return {
            orderId: created.id,
            productId: product.id,
            productName: product.name,
            unitPriceCents: unit,
            quantity: item.quantity,
            lineTotalCents: unit * item.quantity,
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
      shippingCents: order.shippingCents,
      installationCents: order.installationCents,
      shippingZoneLabel: order.shippingZoneLabel,
    });
  } catch (error) {
    console.error("Error en checkout:", error);
    return NextResponse.json(
      { error: "No se pudo crear el pedido. Intenta de nuevo." },
      { status: 500 }
    );
  }
}
