import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ExternalLink, PackageCheck, ShieldCheck, Star, Truck } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { BUSINESS, buildWhatsAppUrl } from "@/lib/constants";
import TrackingSearchForm from "./TrackingSearchForm";

export const metadata: Metadata = {
  title: "Seguimiento de pedidos",
  description:
    "Consulta en tiempo real el estado de tu pedido, detalle de productos, trazabilidad de entrega y calificación en Fraylin.",
};

export default function SeguimientoPage() {
  const portalUrl = process.env.NEXT_PUBLIC_PORTAL_URL?.trim();
  const whatsappHelp = buildWhatsAppUrl(
    BUSINESS.whatsapp[0].number,
    "Hola Fraylin, necesito ayuda para consultar el estado de mi pedido."
  );

  return (
    <>
      <Header />
      <main className="min-h-[75vh] pt-28 pb-16 px-4 bg-accent-cream">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-10 text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-primary/15 px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-brand-dark">
              <PackageCheck size={14} />
              Trazabilidad Fraylin
            </div>

            <div className="space-y-2">
              <h1
                className="text-3xl sm:text-4xl font-bold text-text-primary"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Rastrea tu pedido en tiempo real
              </h1>
              <p className="text-sm sm:text-base text-text-secondary max-w-xl mx-auto">
                Ingresa el número de pedido que recibiste al finalizar tu compra (inicia con{" "}
                <span className="font-mono font-semibold text-text-primary">FR</span>) para ver su estado,
                ficha completa de tus productos e historial de entrega.
              </p>
            </div>

            <TrackingSearchForm />

            <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-text-secondary">
              <a
                href={whatsappHelp}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-brand-dark font-medium"
              >
                ¿Olvidaste tu código? Escríbenos por WhatsApp
              </a>
              {portalUrl && (
                <>
                  <span className="text-stone-300">•</span>
                  <a
                    href={`${portalUrl.replace(/\/$/, "")}/seguimiento`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-brand-dark hover:underline"
                  >
                    Abrir en Portal Fraylin
                    <ExternalLink size={12} />
                  </a>
                </>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-brand-primary/15 text-brand-dark flex items-center justify-center">
                <ShieldCheck size={20} />
              </div>
              <h2 className="text-sm font-bold text-text-primary">Estado verificado</h2>
              <p className="text-xs text-text-secondary leading-relaxed">
                Cada actualización queda registrada con fecha, responsable y notas de nuestro equipo.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-brand-primary/15 text-brand-dark flex items-center justify-center">
                <Truck size={20} />
              </div>
              <h2 className="text-sm font-bold text-text-primary">Detalle de entrega</h2>
              <p className="text-xs text-text-secondary leading-relaxed">
                Revisa fotos, especificaciones de tus productos, zona de envío e instalación incluida.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-brand-primary/15 text-brand-dark flex items-center justify-center">
                <Star size={20} />
              </div>
              <h2 className="text-sm font-bold text-text-primary">Reseña al finalizar</h2>
              <p className="text-xs text-text-secondary leading-relaxed">
                Cuando recibas tu pedido podrás calificar tu experiencia con compra verificada.
              </p>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/#productos"
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:underline"
            >
              <CheckCircle2 size={15} />
              Volver al catálogo de productos
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

