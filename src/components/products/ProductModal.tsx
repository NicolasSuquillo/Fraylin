"use client";

import { useEffect } from "react";
import { X, Tag, Sparkles } from "lucide-react";
import ImageGallery from "@/components/ui/ImageGallery";
import AddToCartButton from "@/components/cart/AddToCartButton";
import WhatsAppButton from "@/components/ui/WhatsAppButton";
import { labelForSlug } from "@/components/products/ProductSearch";
import { BUSINESS, buildWhatsAppUrl } from "@/lib/constants";
import { formatUSD } from "@/lib/money";
import type { Product, Category } from "@/types";

interface ProductModalProps {
  product: Product;
  onClose: () => void;
  categories?: Category[];
}

export default function ProductModal({ product, onClose, categories = [] }: ProductModalProps) {
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

  const whatsappMessage = `Hola Fraylin, me interesa el producto: *${product.name}*. ¿Podrían darme más información?`;
  const buyable = product.priceCents != null;
  const soldOut = buyable && product.stock === 0;
  const lowStock = buyable && product.stock != null && product.stock > 0 && product.stock <= 3;
  const categoryLabel = categories.length > 0 ? labelForSlug(categories, product.category) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface-primary rounded-t-3xl sm:rounded-3xl shadow-2xl border border-stone-200 w-full max-w-[min(100vw,1100px)] sm:max-w-[min(98vw,1100px)] flex flex-col max-h-[min(92dvh,92vh)] sm:max-h-[92vh] min-h-0">
        <div className="flex items-start justify-between gap-3 p-4 sm:p-5 border-b border-stone-100 min-w-0 shrink-0">
          <div className="min-w-0 flex-1 pr-2">
            {(categoryLabel || product.featured) && (
              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                {categoryLabel && (
                  <span className="inline-flex items-center rounded-full bg-brand-primary/10 text-brand-dark text-[11px] font-bold uppercase tracking-wide px-2 py-0.5">
                    {categoryLabel}
                  </span>
                )}
                {product.featured && (
                  <span className="inline-flex items-center gap-1 bg-brand-dark text-accent-cream text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full">
                    <Sparkles className="w-3 h-3 shrink-0" aria-hidden />
                    Destacado
                  </span>
                )}
              </div>
            )}
            <h2
              className="text-base sm:text-lg font-bold text-text-primary min-w-0 break-words text-pretty leading-snug"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {product.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-stone-100 hover:bg-brand-primary/20 text-text-secondary rounded-full flex items-center justify-center transition-colors shrink-0"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain flex flex-col lg:flex-row lg:items-start">
          <div className="w-full shrink-0 lg:flex-1 lg:min-w-0 lg:pt-5">
            <ImageGallery images={product.images} productName={product.name} />
          </div>

          <div className="flex flex-col gap-4 min-w-0 w-full p-4 pb-8 sm:p-5 lg:w-[min(100%,22rem)] lg:shrink-0 lg:max-w-sm lg:pt-5">
            {buyable && (
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Tag size={18} className="text-brand-primary shrink-0" />
                  <span className="text-2xl font-bold text-brand-primary">
                    {formatUSD(product.priceCents!)}
                  </span>
                </div>
                {soldOut && (
                  <span className="inline-flex items-center rounded-full bg-stone-200 text-text-secondary text-[11px] font-bold uppercase tracking-wide px-2.5 py-1">
                    Agotado
                  </span>
                )}
                {lowStock && (
                  <span className="inline-flex items-center rounded-full bg-brand-primary/90 text-brand-dark text-[11px] font-bold uppercase tracking-wide px-2.5 py-1">
                    ¡Últimas {product.stock}!
                  </span>
                )}
              </div>
            )}

            {buyable && (
              <div>
                <AddToCartButton product={product} />
                {product.stock != null && product.stock > 0 && !lowStock && (
                  <p className="mt-1.5 text-xs text-text-secondary">
                    Stock disponible: {product.stock}
                  </p>
                )}
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
                  {buyable ? "¿Prefieres cotizar antes?" : "¿Te interesa este producto?"}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
                  Elige una línea de WhatsApp; abriremos el chat con tu consulta.
                </p>
                <div className="mt-5 flex flex-col gap-2.5">
                  {BUSINESS.whatsapp.map((wa) => (
                    <WhatsAppButton
                      key={wa.number}
                      href={buildWhatsAppUrl(wa.number, whatsappMessage)}
                      variant="card"
                      label="Pedir por WhatsApp"
                      sublabel={wa.label}
                    />
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
