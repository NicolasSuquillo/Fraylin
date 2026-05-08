"use client";

import { useState } from "react";
import { ChevronRight, X } from "lucide-react";
import { BUSINESS, buildWhatsAppUrl } from "@/lib/constants";

const WA_ICON = (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

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
              <a
                key={wa.number}
                href={buildWhatsAppUrl(
                  wa.number,
                  "Hola Fraylin, me gustaría recibir más información."
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2.5 overflow-hidden rounded-xl bg-gradient-to-br from-[#25D366] via-[#20bd5a] to-emerald-700 px-3 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-900/15 ring-1 ring-white/15 transition-all duration-300 hover:-translate-y-px hover:shadow-lg hover:shadow-emerald-900/25 hover:ring-white/25"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20">
                  <span className="scale-90">{WA_ICON}</span>
                </span>
                <span className="min-w-0 flex-1 text-left">
                  <span className="block text-[13px] font-bold leading-tight">
                    {wa.label}
                  </span>
                  <span className="text-[11px] font-medium text-white/85">
                    Abrir chat
                  </span>
                </span>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-white/80 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-white"
                  aria-hidden
                />
              </a>
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
            {open ? <X className="h-6 w-6" strokeWidth={2.25} /> : WA_ICON}
          </span>
        </button>
      </div>
    </div>
  );
}
