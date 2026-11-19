"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  ShoppingCart,
  Minus,
  Plus,
  Truck,
  Wrench,
  Sparkles,
} from "lucide-react";
import ImageGallery from "@/components/ui/ImageGallery";
import { useCart } from "@/components/cart/CartProvider";
import { BUSINESS, buildWhatsAppUrl } from "@/lib/constants";
import { formatUSD } from "@/lib/money";
import type { Product } from "@/types";

interface ProductDetailClientProps {
  product: Product;
  categoryLabel: string;
}

const MAX_UNITS = 9_999;

export default function ProductDetailClient({
  product,
  categoryLabel,
}: ProductDetailClientProps) {
  const { addItem, open: openCart } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const t = window.setTimeout(() => setAdded(false), 2000);
    return () => window.clearTimeout(t);
  }, [added]);

  const buyable = product.priceCents != null && product.showOnWeb !== false;
  const soldOut = buyable && product.stock === 0;
  const maxQty = product.stock != null ? product.stock : MAX_UNITS;
  const transferCents = product.transferPriceCents ?? null;
  const cardCents = product.priceCents ?? null;
  const hasDual =
    transferCents != null && cardCents != null && cardCents > transferCents;

  function handleAddToCart() {
    if (!buyable || soldOut) return;
    addItem(
      {
        productId: product.id,
        name: product.name,
        priceCents: product.priceCents!,
        transferPriceCents: product.transferPriceCents ?? product.priceCents!,
        image: product.images[0]?.src ?? "",
        stock: product.stock,
        freeShipping: product.freeShipping,
        freeInstallation: product.freeInstallation,
        installationCents: product.installationCents,
        installationTransferCents: product.installationTransferCents,
      },
      qty
    );
    setAdded(true);
    openCart();
  }

  return (
    <div className="space-y-10">
      {/* Breadcrumb */}
      <nav aria-label="Ruta de navegación" className="flex flex-wrap items-center gap-1.5 text-xs text-[#6E6A63]">
        <Link href="/" className="hover:text-[#1F1D1A]">
          Inicio
        </Link>
        <ChevronRight className="size-3.5" aria-hidden="true" />
        <Link href="/catalogo" className="hover:text-[#1F1D1A]">
          Catálogo
        </Link>
        <ChevronRight className="size-3.5" aria-hidden="true" />
        <Link
          href={`/catalogo?category=${encodeURIComponent(product.category)}`}
          className="hover:text-[#1F1D1A]"
        >
          {categoryLabel}
        </Link>
        <ChevronRight className="size-3.5" aria-hidden="true" />
        <span className="font-medium text-[#1F1D1A]">{product.name}</span>
      </nav>

      {/* Grid Principal: Galería + Panel Técnico/Comercial */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
        <div className="rounded-2xl border border-[#E6E1D6] bg-white p-3 sm:p-5 lg:col-span-7">
          <ImageGallery
            images={
              product.images.length > 0
                ? product.images
                : [{ src: "/placeholder.svg", alt: product.name }]
            }
            productName={product.name}
          />
        </div>

        <div className="space-y-6 rounded-2xl border border-[#E6E1D6] bg-white p-6 shadow-xl shadow-black/5 sm:p-8 lg:col-span-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#F2EFE9] px-3 py-1 text-[11px] font-semibold tracking-wider text-[#7A6336] uppercase">
                {categoryLabel}
              </span>
              {product.featured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#C9B079]/25 px-2.5 py-1 text-[11px] font-semibold text-[#1F1D1A]">
                  <Sparkles className="size-3" aria-hidden="true" />
                  Destacado
                </span>
              )}
            </div>
            <h1
              className="text-2xl font-bold leading-snug text-[#1F1D1A] sm:text-3xl"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {product.name}
            </h1>
            <p className="font-mono text-xs text-[#6E6A63]">Ref. {product.id}</p>
          </div>

          {/* Precios */}
          <div className="border-y border-[#E6E1D6] py-4">
            {buyable ? (
              <div className="space-y-1">
                <div className="flex items-baseline gap-2.5">
                  <span className="text-3xl font-bold text-[#1F1D1A]">
                    {formatUSD(transferCents ?? cardCents!)}
                  </span>
                  <span className="text-xs font-medium text-[#7A6336]">
                    {transferCents != null ? "Transferencia / Deuna" : "Precio"}
                  </span>
                </div>
                {hasDual && (
                  <p className="text-xs text-[#6E6A63]">
                    Precio con tarjeta: <span className="font-medium">{formatUSD(cardCents!)}</span>
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm font-medium text-[#6E6A63]">
                Precio y disponibilidad bajo cotización.
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {product.freeShipping && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
                  <Truck className="size-3.5" aria-hidden="true" />
                  Envío gratis
                </span>
              )}
              {product.freeInstallation && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
                  <Wrench className="size-3.5" aria-hidden="true" />
                  Instalación gratis
                </span>
              )}
              {product.stock != null && product.stock > 0 && (
                <span className="rounded-full bg-[#F2EFE9] px-2.5 py-1 text-xs font-medium text-[#1F1D1A]">
                  Stock disponible: {product.stock}
                </span>
              )}
            </div>
          </div>

          {/* Descripción & Especificaciones */}
          {(product.description || product.specs) && (
            <div className="space-y-3">
              {product.description && (
                <p className="text-sm leading-relaxed text-[#6E6A63]">
                  {product.description}
                </p>
              )}
              {product.specs && (
                <div className="rounded-xl border border-[#E6E1D6] bg-[#F2EFE9]/60 p-4">
                  <h2 className="mb-1.5 font-sans text-xs font-bold tracking-wider text-[#7A6336] uppercase">
                    Especificaciones técnicas
                  </h2>
                  <p className="whitespace-pre-line text-xs leading-relaxed text-[#1F1D1A]">
                    {product.specs}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Acciones de compra / cotización */}
          <div className="space-y-3">
            {buyable && !soldOut ? (
              <div className="flex items-center gap-2.5">
                <div className="flex items-center rounded-lg border border-[#E2DDD3] bg-white">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                    aria-label="Disminuir cantidad"
                    className="flex size-11 items-center justify-center text-[#1F1D1A] transition-colors hover:bg-[#F2EFE9] disabled:opacity-40"
                  >
                    <Minus size={15} aria-hidden="true" />
                  </button>
                  <span className="w-10 text-center text-sm font-semibold text-[#1F1D1A]">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                    disabled={qty >= maxQty}
                    aria-label="Aumentar cantidad"
                    className="flex size-11 items-center justify-center text-[#1F1D1A] transition-colors hover:bg-[#F2EFE9] disabled:opacity-40"
                  >
                    <Plus size={15} aria-hidden="true" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg bg-[#C9B079] px-5 py-3 text-sm font-semibold text-[#1F1D1A] transition-colors duration-200 hover:bg-[#D2BD8A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9B079]"
                >
                  <ShoppingCart size={16} aria-hidden="true" />
                  <span>{added ? "¡Agregado al carrito!" : "Agregar al Carrito"}</span>
                </button>
              </div>
            ) : soldOut ? (
              <div className="rounded-lg border border-[#E6E1D6] bg-[#F2EFE9] py-3 text-center text-sm font-semibold text-[#6E6A63]">
                Temporalmente agotado
              </div>
            ) : (
              <a
                href={buildWhatsAppUrl(
                  BUSINESS.whatsapp[0].number,
                  `Hola Fraylin, quiero cotizar: *${product.name}* (Ref. ${product.id}).`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[#C9B079] px-5 py-3 text-sm font-semibold text-[#1F1D1A] transition-colors duration-200 hover:bg-[#D2BD8A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9B079]"
              >
                Cotizar por WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
