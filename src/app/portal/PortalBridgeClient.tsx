"use client";

import { useState } from "react";
import Image from "next/image";
import { ExternalLink, ShieldCheck } from "lucide-react";
import TrackingSearchForm from "@/app/seguimiento/TrackingSearchForm";
import { BUSINESS, buildWhatsAppUrl } from "@/lib/constants";

type PortalTab = "acceso" | "rastreo";

interface PortalBridgeClientProps {
  portalLoginUrl: string | null;
}

export default function PortalBridgeClient({
  portalLoginUrl,
}: PortalBridgeClientProps) {
  const [tab, setTab] = useState<PortalTab>("acceso");

  function handleTabKeyDown(e: React.KeyboardEvent, current: PortalTab) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const order: PortalTab[] = ["acceso", "rastreo"];
    const idx = order.indexOf(current);
    const next =
      e.key === "ArrowRight"
        ? order[(idx + 1) % order.length]
        : order[(idx - 1 + order.length) % order.length];
    setTab(next);
    document.getElementById(`portal-tab-${next}`)?.focus();
  }

  const supportWa = buildWhatsAppUrl(
    BUSINESS.whatsapp[0].number,
    "Hola Fraylin, necesito ayuda para ingresar al Portal Clientes."
  );

  return (
    <section
      aria-label="Acceso al Portal y seguimiento de pedidos"
      className="relative z-10 w-full max-w-[440px] rounded-2xl border border-[#E6E1D6] bg-white p-6 shadow-xl shadow-black/5 sm:p-8"
    >
      {/* Cabecera de Marca */}
      <header className="mb-6 flex flex-col items-center text-center">
        <div className="mb-2.5 flex items-center gap-2.5">
          <Image
            src="/logotipo.png"
            alt=""
            width={34}
            height={34}
            className="size-8 rounded-lg border border-[#E6E1D6] object-cover"
            priority
          />
          <span className="text-xl font-bold tracking-[0.18em] text-[#B89B5E]">
            FRAYLIN
          </span>
        </div>
        <p className="text-xs font-medium tracking-[0.2em] text-[#6E6A63] uppercase">
          PORTAL CLIENTES
        </p>
      </header>

      {/* Selector de Modo (Segmented Pill Tabs) */}
      <div
        role="tablist"
        aria-label="Modo de consulta"
        className="mb-6 grid grid-cols-2 rounded-full bg-[#F2EFE9] p-1"
      >
        <button
          type="button"
          role="tab"
          id="portal-tab-acceso"
          tabIndex={tab === "acceso" ? 0 : -1}
          aria-selected={tab === "acceso"}
          aria-controls="portal-panel-acceso"
          onClick={() => setTab("acceso")}
          onKeyDown={(e) => handleTabKeyDown(e, "acceso")}
          className={`cursor-pointer rounded-full px-3 py-2 text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9B079]/50 sm:text-sm ${
            tab === "acceso"
              ? "bg-[#C9B079] font-semibold text-[#1F1D1A] shadow-xs"
              : "bg-transparent text-[#6E6A63] hover:text-[#1F1D1A]"
          }`}
        >
          Acceso al Portal
        </button>
        <button
          type="button"
          role="tab"
          id="portal-tab-rastreo"
          tabIndex={tab === "rastreo" ? 0 : -1}
          aria-selected={tab === "rastreo"}
          aria-controls="portal-panel-rastreo"
          onClick={() => setTab("rastreo")}
          onKeyDown={(e) => handleTabKeyDown(e, "rastreo")}
          className={`cursor-pointer rounded-full px-3 py-2 text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9B079]/50 sm:text-sm ${
            tab === "rastreo"
              ? "bg-[#C9B079] font-semibold text-[#1F1D1A] shadow-xs"
              : "bg-transparent text-[#6E6A63] hover:text-[#1F1D1A]"
          }`}
        >
          Rastrear Pedido
        </button>
      </div>

      {/* Paneles */}
      <div className="transition-all duration-200">
        <div
          id="portal-panel-acceso"
          role="tabpanel"
          aria-labelledby="portal-tab-acceso"
          hidden={tab !== "acceso"}
          className={tab !== "acceso" ? "hidden" : "space-y-4"}
        >
          <div className="rounded-xl border border-[#E6E1D6] bg-[#F2EFE9]/60 p-4 text-xs leading-relaxed text-[#6E6A63]">
            <p className="mb-1.5 flex items-center gap-1.5 font-semibold text-[#1F1D1A]">
              <ShieldCheck className="size-4 text-[#7A6336]" aria-hidden="true" />
              Ingreso seguro con Cédula o RUC
            </p>
            <p>
              Accede a tus pedidos, solicitudes de obra, comprobantes y acuerdos
              desde el Portal Clientes de Fraylin.
            </p>
          </div>

          {portalLoginUrl ? (
            <a
              href={portalLoginUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-lg bg-[#C9B079] px-5 py-3 text-sm font-semibold text-[#1F1D1A] transition-colors duration-200 hover:bg-[#D2BD8A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9B079]"
            >
              <span>Ingresar al Portal Clientes</span>
              <ExternalLink className="size-4" aria-hidden="true" />
            </a>
          ) : (
            <a
              href={supportWa}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-lg bg-[#C9B079] px-5 py-3 text-sm font-semibold text-[#1F1D1A] transition-colors duration-200 hover:bg-[#D2BD8A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9B079]"
            >
              <span>Solicitar acceso por WhatsApp</span>
              <ExternalLink className="size-4" aria-hidden="true" />
            </a>
          )}
        </div>

        <div
          id="portal-panel-rastreo"
          role="tabpanel"
          aria-labelledby="portal-tab-rastreo"
          hidden={tab !== "rastreo"}
          className={tab !== "rastreo" ? "hidden" : "space-y-4"}
        >
          <p className="text-xs leading-relaxed text-[#6E6A63]">
            Ingresa el código de tu pedido para consultar su estado y
            trazabilidad sin iniciar sesión.
          </p>
          <TrackingSearchForm />
        </div>
      </div>

      {/* Footer de la Tarjeta */}
      <footer className="mt-7 border-t border-[#E6E1D6]/70 pt-4 text-center">
        <p className="text-[11px] text-[#8C877E]">
          Fraylin Acabados © 2026. Todos los derechos reservados.
        </p>
      </footer>
    </section>
  );
}
