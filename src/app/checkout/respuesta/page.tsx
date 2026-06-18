import type React from "react";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import Link from "next/link";
import { AlertCircle, Clock, ShoppingBag, XCircle } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { BUSINESS, buildWhatsAppUrl } from "@/lib/constants";
import { formatUSD } from "@/lib/money";
import { cancelOrder, finalizeOrder, getOrderByClientTransactionId } from "@/lib/orders";
import { touchCatalogVersion } from "@/lib/cache-version";
import { getPricingSettings } from "@/lib/pricing";
import PaymentSuccess from "./PaymentSuccess";

interface RespuestaPageProps {
  searchParams: Promise<{ id?: string; clientTransactionId?: string }>;
}

export default async function RespuestaPage({ searchParams }: RespuestaPageProps) {
  const { id, clientTransactionId } = await searchParams;
  const { comprobanteEnabled } = await getPricingSettings();

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
          // revalidatePath/touchCatalogVersion no pueden ejecutarse durante el
          // render de un Server Component (Next lanza "used during render").
          // Se difieren con after() para que corran tras la respuesta: así el
          // caché ISR de "/" se invalida de verdad y el stock se actualiza.
          after(async () => {
            await touchCatalogVersion();
            revalidatePath("/");
          });
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
          <StatusCard
            icon={<AlertCircle size={40} className="text-red-400" />}
            iconBg="bg-red-50"
            title="No encontramos tu pedido"
            description="Verifica el enlace o vuelve a intentar el checkout."
          >
            <Link
              href="/checkout"
              className="px-6 py-3 bg-brand-primary text-neutral-dark hover:bg-brand-dark hover:text-accent-cream font-bold rounded-2xl transition-colors"
            >
              Volver al checkout
            </Link>
          </StatusCard>
        ) : success ? (
          <PaymentSuccess
            clientTransactionId={order.clientTransactionId}
            totalFormatted={formatUSD(order.totalCents)}
            comprobanteEnabled={comprobanteEnabled}
            whatsappUrl={buildWhatsAppUrl(
              BUSINESS.whatsapp[0].number,
              `Hola, acabo de pagar el pedido ${order.clientTransactionId}. ¿Cómo coordinamos la entrega?`
            )}
          />
        ) : confirmError ? (
          <StatusCard
            icon={<Clock size={40} className="text-amber-400" />}
            iconBg="bg-amber-50"
            title="Verificando tu pago…"
            description={
              <>
                No pudimos confirmar el estado del pedido{" "}
                <span className="font-semibold text-text-primary">{order.clientTransactionId}</span> en este
                momento. Si ya pagaste, <strong>no vuelvas a pagar</strong>: recarga en unos minutos o
                escríbenos.
              </>
            }
          >
            <a
              href={buildWhatsAppUrl(
                BUSINESS.whatsapp[0].number,
                `Hola, pagué el pedido ${order.clientTransactionId} pero la página no pudo confirmarlo. ¿Me ayudan a verificar?`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-brand-primary text-neutral-dark hover:bg-brand-dark hover:text-accent-cream font-bold rounded-2xl transition-colors"
            >
              Verificar por WhatsApp
            </a>
          </StatusCard>
        ) : (
          <StatusCard
            icon={<XCircle size={40} className="text-red-400" />}
            iconBg="bg-red-50"
            title="Pago no completado"
            description={
              <>
                El pedido{" "}
                <span className="font-semibold text-text-primary">{order.clientTransactionId}</span> fue
                cancelado o no pudo procesarse. Tu carrito sigue intacto.
              </>
            }
          >
            <Link
              href="/checkout"
              className="px-6 py-3 bg-brand-primary text-neutral-dark hover:bg-brand-dark hover:text-accent-cream font-bold rounded-2xl transition-colors"
            >
              Volver al checkout
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              <ShoppingBag size={15} />
              Seguir explorando
            </Link>
          </StatusCard>
        )}
      </main>
      <Footer />
    </>
  );
}

function StatusCard({
  icon,
  iconBg,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-sm flex flex-col items-center gap-5">
      <div className={`w-20 h-20 rounded-full ${iconBg} flex items-center justify-center`}>
        {icon}
      </div>
      <div className="text-center">
        <h1
          className="text-2xl font-bold text-text-primary"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {title}
        </h1>
        <p className="text-text-secondary mt-2 text-sm leading-relaxed">{description}</p>
      </div>
      <div className="flex flex-col items-center gap-3 w-full">{children}</div>
    </div>
  );
}
