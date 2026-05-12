"use client";

import { useEffect } from "react";
import { X, ChevronRight, Tag } from "lucide-react";
import ImageGallery from "@/components/ui/ImageGallery";
import { BUSINESS, buildWhatsAppUrl } from "@/lib/constants";
import type { Product } from "@/types";

interface ProductModalProps {
  product: Product;
  onClose: () => void;
}

export default function ProductModal({ product, onClose }: ProductModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handler);
    };
  }, [onClose]);

  const whatsappMessage = `Hola Fraylin, me interesa el producto: *${product.name}*${product.price ? ` (${product.price})` : ""}. ¿Podrían darme más información?`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface-primary rounded-t-3xl sm:rounded-3xl shadow-2xl border border-stone-200 w-full max-w-[min(100vw,1100px)] sm:max-w-[min(98vw,1100px)] flex flex-col max-h-[min(92dvh,92vh)] sm:max-h-[92vh] min-h-0">
        <div className="flex items-start justify-between gap-3 p-4 sm:p-5 border-b border-stone-100 min-w-0 shrink-0">
          <h2
            className="text-base sm:text-lg font-bold text-text-primary pr-2 min-w-0 flex-1 break-words text-pretty leading-snug"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {product.name}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-stone-100 hover:bg-brand-primary/20 text-text-secondary rounded-full flex items-center justify-center transition-colors shrink-0"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5 flex flex-col lg:flex-row lg:items-stretch gap-5 lg:gap-8">
          <div className="w-full lg:flex-1 lg:min-w-0 lg:min-h-0 flex flex-col">
            <ImageGallery images={product.images} productName={product.name} />
          </div>

          <div className="flex flex-col gap-4 min-w-0 w-full lg:w-[min(100%,22rem)] lg:shrink-0 lg:max-w-sm">
            {product.price && (
              <div className="flex items-center gap-2">
                <Tag size={18} className="text-brand-primary shrink-0" />
                <span className="text-2xl font-bold text-brand-primary">
                  {product.price}
                </span>
              </div>
            )}

            {product.description && (
              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-1">
                  Descripción
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            <div className="mt-auto pt-5">
              <div className="rounded-2xl border border-brand-primary/12 bg-gradient-to-b from-surface-primary to-neutral-light/70 p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] ring-1 ring-stone-900/[0.04]">
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-dark/80"
                >
                  Contacto
                </p>
                <p
                  className="mt-1.5 text-base font-semibold text-text-primary"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  ¿Te interesa este producto?
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
                  Elige una línea de WhatsApp; abriremos el chat con tu consulta.
                </p>
                <div className="mt-5 flex flex-col gap-2.5">
                  {BUSINESS.whatsapp.map((wa) => (
                    <a
                      key={wa.number}
                      href={buildWhatsAppUrl(wa.number, whatsappMessage)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative flex min-h-[4.25rem] items-center gap-3.5 overflow-hidden rounded-2xl border border-stone-200/90 bg-surface-primary px-4 py-3 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.07)] transition-all duration-300 hover:-translate-y-px hover:border-[#25D366]/35 hover:shadow-[0_12px_28px_-12px_rgba(37,211,102,0.22)] active:translate-y-0"
                    >
                      <span
                        aria-hidden
                        className="absolute left-0 top-1/2 h-[60%] w-1 -translate-y-1/2 rounded-full bg-gradient-to-b from-[#25D366] to-emerald-600 opacity-80 transition-opacity group-hover:opacity-100"
                      />
                      <span
                        aria-hidden
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-600/15 transition-all duration-300 group-hover:bg-emerald-500/[0.14] group-hover:ring-emerald-600/25"
                      >
                        <svg
                          className="h-[22px] w-[22px] text-[#128C7E]"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                      </span>
                      <span className="min-w-0 flex-1 pl-0.5 text-left">
                        <span className="block text-[15px] font-semibold leading-snug tracking-tight text-text-primary transition-colors group-hover:text-brand-dark">
                          Pedir por WhatsApp
                        </span>
                        <span className="mt-0.5 block text-[11px] font-medium uppercase tracking-wide text-text-secondary">
                          {wa.label}
                        </span>
                      </span>
                      <ChevronRight
                        className="h-5 w-5 shrink-0 text-stone-400 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-[#25D366]"
                        aria-hidden
                      />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
