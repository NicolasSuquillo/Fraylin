"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { BUSINESS, buildWhatsAppUrl } from "@/lib/constants";
import WhatsAppButton, { WhatsAppIcon } from "@/components/ui/WhatsAppButton";

export default function FloatingWhatsApp() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 sm:bottom-8 sm:right-8">
      {open && (
        <div
          className="w-[min(100vw-3rem,17rem)] origin-bottom-right rounded-2xl border border-brand-primary/12 bg-surface-primary p-4 shadow-[0_24px_48px_-12px_rgba(10,10,10,0.22)] ring-1 ring-black/[0.04]"
          role="dialog"
          aria-label="Opciones de WhatsApp"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-secondary">
            Fraylin
          </p>
          <p
            className="mt-1 text-base font-semibold text-text-primary"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Escríbenos por WhatsApp
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
            Elige una línea y te abrimos el chat listo para escribir.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            {BUSINESS.whatsapp.map((wa) => (
              <WhatsAppButton
                key={wa.number}
                href={buildWhatsAppUrl(
                  wa.number,
                  "Hola Fraylin, me gustaría recibir más información."
                )}
                variant="compact"
                label={wa.label}
                sublabel="Abrir chat"
              />
            ))}
          </div>
        </div>
      )}

      <div className="relative">
        <span
          className="pointer-events-none absolute -inset-3 rounded-full bg-gradient-to-br from-brand-primary/25 via-brand-light/15 to-transparent opacity-90 blur-md"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute -inset-1 rounded-full border border-brand-primary/20"
          aria-hidden
        />
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#25D366] via-[#1ebe57] to-emerald-800 text-white shadow-[0_12px_36px_-10px_rgba(16,120,72,0.55)] ring-2 ring-white/40 ring-offset-2 ring-offset-accent-cream transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_44px_-12px_rgba(16,120,72,0.6)] hover:ring-white/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary active:translate-y-0"
          aria-expanded={open}
          aria-label={open ? "Cerrar menú de WhatsApp" : "Abrir WhatsApp"}
        >
          <span
            className="pointer-events-none absolute inset-0 rounded-full bg-emerald-300/20 animate-pulse"
            aria-hidden
          />
          <span className="relative z-[1] drop-shadow-sm">
            {open ? <X className="h-6 w-6" strokeWidth={2.25} /> : <WhatsAppIcon />}
          </span>
        </button>
      </div>
    </div>
  );
}
