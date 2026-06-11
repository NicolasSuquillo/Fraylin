import { revalidatePath } from "next/cache";
import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { BUSINESS, buildWhatsAppUrl } from "@/lib/constants";
import { formatUSD } from "@/lib/money";
import { cancelOrder, finalizeOrder, getOrderByClientTransactionId } from "@/lib/orders";
import ClearCartOnSuccess from "./ClearCartOnSuccess";

interface RespuestaPageProps {
  searchParams: Promise<{ id?: string; clientTransactionId?: string }>;
}

export default async function RespuestaPage({ searchParams }: RespuestaPageProps) {
  const { id, clientTransactionId } = await searchParams;

  let order = clientTransactionId ? await getOrderByClientTransactionId(clientTransactionId) : null;
  let confirmError = false;

  if (order && order.status === "pending") {
    const payphoneId = id ? Number(id) : 0;
    try {
      if (payphoneId > 0) {
        order = await finalizeOrder(order.id, payphoneId);
        if (order.status === "paid") {
          revalidatePath("/");
        }
      } else {
        order = await cancelOrder(order.id);
      }
    } catch (error) {
      console.error("Error al confirmar pedido:", error);
      confirmError = true;
    }
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
