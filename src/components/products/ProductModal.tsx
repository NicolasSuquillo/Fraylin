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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[min(95vw,900px)] max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-3 p-5 border-b border-gray-100 min-w-0">
          <h2
            className="text-lg font-bold text-neutral-dark pr-4"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {product.name}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors shrink-0"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-start gap-5 lg:gap-8">
          <div className="w-full lg:w-auto lg:shrink-0">
            <ImageGallery images={product.images} productName={product.name} />
          </div>

          <div className="flex flex-col gap-4 min-w-0 w-full lg:max-w-md lg:flex-1">
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
                <h3 className="text-sm font-semibold text-neutral-dark mb-1">
                  Descripción
                </h3>
                <p className="text-sm text-neutral-mid leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            <div className="mt-auto pt-5">
              <div className="rounded-2xl border border-emerald-100/80 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/40 p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)]">
                <p
                  className="mb-4 text-sm font-semibold text-neutral-dark"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  ¿Te interesa este producto?
                </p>
                <p className="mb-4 text-xs leading-relaxed text-neutral-mid">
                  Escríbenos por WhatsApp y te respondemos en seguida.
                </p>
                <div className="flex flex-col gap-3">
                  {BUSINESS.whatsapp.map((wa) => (
                    <a
                      key={wa.number}
                      href={buildWhatsAppUrl(wa.number, whatsappMessage)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-br from-[#25D366] via-[#20bd5a] to-emerald-600 px-4 py-3.5 text-white shadow-lg shadow-emerald-900/20 ring-1 ring-white/10 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-900/30 hover:ring-white/20 active:translate-y-0"
                    >
                      <span
                        aria-hidden
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm ring-1 ring-white/25 transition-colors group-hover:bg-white/25"
                      >
                        <svg
                          className="h-6 w-6 text-white drop-shadow-sm"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                      </span>
                      <span className="min-w-0 flex-1 text-left">
                        <span className="block text-[15px] font-bold leading-tight tracking-tight">
                          Pedir por WhatsApp
                        </span>
                        <span className="mt-0.5 block text-xs font-medium text-white/90">
                          {wa.label}
                        </span>
                      </span>
                      <ChevronRight
                        className="h-5 w-5 shrink-0 text-white/80 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-white"
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
