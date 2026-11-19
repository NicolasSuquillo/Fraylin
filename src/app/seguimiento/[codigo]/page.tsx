import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ArchitecturalBackground from "@/components/ui/ArchitecturalBackground";
import { BUSINESS, buildWhatsAppUrl } from "@/lib/constants";
import { buildPortalUrl } from "@/lib/site";
import { getPublicOrderTracking } from "@/lib/orders";
import { getPricingSettings } from "@/lib/pricing";
import TrackingSearchForm from "../TrackingSearchForm";
import TrackingOrderClient from "./TrackingOrderClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ codigo: string }>;
}): Promise<Metadata> {
  const { codigo } = await params;
  return {
    title: `Pedido ${codigo.toUpperCase()} — Seguimiento`,
    robots: { index: false, follow: false },
  };
}

export default async function SeguimientoDetallePage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  const normalized = codigo.trim().toUpperCase();
  const [tracking, pricing] = await Promise.all([
    getPublicOrderTracking(normalized),
    getPricingSettings(),
  ]);

  const portalTrackingUrl =
    buildPortalUrl(`/seguimiento/${encodeURIComponent(normalized)}`) ??
    undefined;

  return (
    <div className="relative min-h-dvh bg-[#F4F1EA]">
      <ArchitecturalBackground />
      <Header />
      <main
        id="contenido-principal"
        tabIndex={-1}
        className="relative z-10 min-h-[75vh] px-4 pt-28 pb-16 outline-none"
      >
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/seguimiento"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary hover:text-brand-dark transition-colors"
            >
              <ArrowLeft size={16} />
              Buscar otro pedido
            </Link>
          </div>

          {!tracking ? (
            <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-8 text-center space-y-5 max-w-xl mx-auto">
              <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <AlertCircle size={28} />
              </div>
              <div className="space-y-2">
                <h1
                  className="text-2xl font-bold text-text-primary"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  No encontramos el pedido {normalized}
                </h1>
                <p className="text-sm text-text-secondary">
                  Verifica que el código esté bien escrito e inténtalo de nuevo.
                </p>
              </div>
              <TrackingSearchForm initialCode={normalized} />
            </div>
          ) : (
            <TrackingOrderClient
              tracking={tracking}
              comprobanteEnabled={pricing.comprobanteEnabled}
              portalTrackingUrl={portalTrackingUrl}
              whatsappUrl={buildWhatsAppUrl(
                BUSINESS.whatsapp[0].number,
                `Hola Fraylin, consulto por el seguimiento de mi pedido ${tracking.clientTransactionId}.`
              )}
            />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

