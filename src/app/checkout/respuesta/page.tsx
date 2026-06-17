import { revalidatePath } from "next/cache";
import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { BUSINESS, buildWhatsAppUrl } from "@/lib/constants";
import { formatUSD } from "@/lib/money";
import { cancelOrder, finalizeOrder, getOrderByClientTransactionId } from "@/lib/orders";
import { touchCatalogVersion } from "@/lib/cache-version";
import ClearCartOnSuccess from "./ClearCartOnSuccess";

interface RespuestaPageProps {
  searchParams: Promise<{ id?: string; clientTransactionId?: string }>;
}

export default async function RespuestaPage({ searchParams }: RespuestaPageProps) {
  const { id, clientTransactionId } = await searchParams;

  let order = null;
  try {
    order = clientTransactionId ? await getOrderByClientTransactionId(clientTransactionId) : null;
  } catch (error) {
    console.error("Error al buscar pedido:", error);
  }

  // Si la orden ya fue procesada por Payphone, verificar que el payphoneId del URL coincida.
  // Previene que un clientTransactionId robado/filtrado muestre datos ajenos.
  const numericId = id && /^\d+$/.test(id) ? id : null;
  if (
    order &&
    numericId &&
    order.payphoneTransactionId &&
    order.payphoneTransactionId !== numericId
  ) {
    order = null;
  }
  let confirmError = false;

  if (order && order.status === "pending") {
    const payphoneId = id && /^\d+$/.test(id) ? Number(id) : NaN;
    try {
      if (payphoneId > 0) {
        order = await finalizeOrder(order.id, payphoneId);
        if (order.status === "paid") {
          await touchCatalogVersion();
          revalidatePath("/");
        }
      } else if (payphoneId === 0) {
        // Payphone redirige con id=0 cuando el usuario cancela en la Cajita.
        order = await cancelOrder(order.id);
      } else {
        // id ausente o no numérico: no tocar la orden; mostrar estado de verificación.
        confirmError = true;
      }
    } catch (error) {
      console.error("Error al confirmar pedido:", error);
      confirmError = true;
    }
  }

  // "processing" = otro request está confirmando (o quedó a medias): no es un fallo definitivo.
  if (order?.status === "processing") {
    confirmError = true;
  }

  const success = order?.status === "paid";

  return (
    <>
      <Header />
      <main className="min-h-[60vh] max-w-2xl mx-auto px-4 pt-32 pb-16 flex flex-col items-center text-center gap-4">
        {!order ? (
          <>
            <XCircle size={48} className="text-red-500" />
            <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-heading)" }}>
              No encontramos tu pedido
            </h1>
            <p className="text-text-secondary">Verifica el enlace o vuelve a intentar el checkout.</p>
            <Link
              href="/checkout"
              className="px-5 py-2.5 bg-brand-primary text-neutral-dark hover:bg-brand-dark hover:text-accent-cream font-semibold rounded-lg transition-colors"
            >
              Volver al checkout
            </Link>
          </>
        ) : success ? (
          <>
            <ClearCartOnSuccess />
            <CheckCircle2 size={48} className="text-emerald-600" />
            <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-heading)" }}>
              ¡Pago confirmado!
            </h1>
            <p className="text-text-secondary">
              Pedido <span className="font-semibold text-text-primary">{order.clientTransactionId}</span> por{" "}
              <span className="font-semibold text-brand-primary">{formatUSD(order.totalCents)}</span>.
            </p>
            <p className="text-sm text-text-secondary">Coordina la entrega de tu pedido por WhatsApp.</p>
            <a
              href={buildWhatsAppUrl(
                BUSINESS.whatsapp[0].number,
                `Hola, acabo de pagar el pedido ${order.clientTransactionId}. ¿Cómo coordinamos la entrega?`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-brand-primary text-neutral-dark hover:bg-brand-dark hover:text-accent-cream font-semibold rounded-lg transition-colors"
            >
              Coordinar por WhatsApp
            </a>
          </>
        ) : confirmError ? (
          <>
            <Clock size={48} className="text-amber-500" />
            <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-heading)" }}>
              Estamos verificando tu pago
            </h1>
            <p className="text-text-secondary">
              No pudimos confirmar el estado del pedido{" "}
              <span className="font-semibold text-text-primary">{order.clientTransactionId}</span> en este momento.
              Si ya pagaste, no vuelvas a pagar: recarga esta página en unos minutos o escríbenos por WhatsApp.
            </p>
            <a
              href={buildWhatsAppUrl(
                BUSINESS.whatsapp[0].number,
                `Hola, pagué el pedido ${order.clientTransactionId} pero la página no pudo confirmarlo. ¿Me ayudan a verificar?`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-brand-primary text-neutral-dark hover:bg-brand-dark hover:text-accent-cream font-semibold rounded-lg transition-colors"
            >
              Verificar por WhatsApp
            </a>
          </>
        ) : (
          <>
            <XCircle size={48} className="text-red-500" />
            <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-heading)" }}>
              Pago no completado
            </h1>
            <p className="text-text-secondary">
              Tu pedido <span className="font-semibold text-text-primary">{order.clientTransactionId}</span> fue
              cancelado o no pudo procesarse. Tu carrito sigue intacto.
            </p>
            <Link
              href="/checkout"
              className="px-5 py-2.5 bg-brand-primary text-neutral-dark hover:bg-brand-dark hover:text-accent-cream font-semibold rounded-lg transition-colors"
            >
              Volver al checkout
            </Link>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
