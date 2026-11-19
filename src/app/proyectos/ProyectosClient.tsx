"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import type { GalleryItem, Category } from "@/types";

interface ProyectosClientProps {
  items: GalleryItem[];
  categories: Category[];
}

export default function ProyectosClient({ items, categories }: ProyectosClientProps) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const wrap = (c: number | null, delta: number) => {
    if (c === null || items.length === 0) return null;
    return (c + delta + items.length) % items.length;
  };

  useEffect(() => {
    if (lightbox === null) return;
    const root = dialogRef.current;
    const prevFocus = document.activeElement as HTMLElement | null;
    root
      ?.querySelector<HTMLElement>("button[aria-label='Cerrar vista ampliada']")
      ?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightbox(null);
        return;
      }
      if (e.key === "ArrowLeft") {
        setLightbox((c) => (c === null || items.length === 0 ? null : (c - 1 + items.length) % items.length));
        return;
      }
      if (e.key === "ArrowRight") {
        setLightbox((c) => (c === null || items.length === 0 ? null : (c + 1) % items.length));
        return;
      }
      if (e.key === "Tab" && root) {
        const focusables = Array.from(
          root.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
      prevFocus?.focus?.();
    };
  }, [lightbox, items.length]);

  const prev = () => setLightbox((c) => wrap(c, -1));
  const next = () => setLightbox((c) => wrap(c, 1));

  return (
    <div className="space-y-14">
      <div className="max-w-2xl space-y-3">
        <p className="text-xs font-bold tracking-[0.16em] text-[#7A6336] uppercase">
          Galería Editorial
        </p>
        <h1
          className="text-3xl font-bold tracking-tight text-[#1F1D1A] sm:text-4xl lg:text-5xl"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Proyectos y Ambientes
        </h1>
        <p className="text-sm leading-relaxed text-[#6E6A63] sm:text-base">
          Espacios residenciales y comerciales terminados con materiales e
          instalación de Fraylin Acabados en Quito y los valles.
        </p>
      </div>

      {/* Galería de obras */}
      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <button
              key={`${item.src}-${i}`}
              type="button"
              onClick={() => setLightbox(i)}
              className="group flex flex-col overflow-hidden rounded-2xl border border-[#E6E1D6] bg-white text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C9B079] hover:shadow-xl hover:shadow-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9B079]"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F2EFE9]">
                <SafeImage
                  src={item.src}
                  alt={item.alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
                />
              </div>
              <div className="p-4 sm:p-5">
                <p className="text-sm font-semibold text-[#1F1D1A]">
                  {item.caption ?? item.alt}
                </p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-[#E6E1D6] bg-white p-10 text-center">
          <p className="text-sm text-[#6E6A63]">
            Próximamente publicaremos nuevas fotografías de obras terminadas.
          </p>
        </div>
      )}

      {/* Enlace directo a líneas del catálogo */}
      {categories.length > 0 && (
        <section className="rounded-2xl border border-[#E6E1D6] bg-white p-6 sm:p-8">
          <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2
                className="text-2xl font-bold text-[#1F1D1A]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Acabados empleados por línea
              </h2>
              <p className="text-sm text-[#6E6A63]">
                Explora los materiales disponibles en nuestro catálogo según el ambiente de tu proyecto.
              </p>
            </div>
            <Link
              href="/catalogo"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#7A6336] hover:text-[#1F1D1A]"
            >
              <span>Ver catálogo completo</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/catalogo?category=${encodeURIComponent(cat.slug)}`}
                className="inline-flex items-center gap-2 rounded-full border border-[#E6E1D6] bg-[#F2EFE9] px-4 py-2 text-xs font-semibold text-[#1F1D1A] transition-colors duration-200 hover:border-[#C9B079] hover:bg-[#C9B079]"
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Lightbox accesible */}
      {lightbox !== null && items[lightbox] && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Vista ampliada de proyecto"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            aria-label="Cerrar vista ampliada"
            className="absolute top-4 right-4 z-10 rounded-full bg-white/15 p-2.5 text-white transition-colors hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9B079]"
          >
            <X size={22} aria-hidden="true" />
          </button>

          {items.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                aria-label="Proyecto anterior"
                className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/15 p-2.5 text-white transition-colors hover:bg-white/30"
              >
                <ChevronLeft size={24} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                aria-label="Siguiente proyecto"
                className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/15 p-2.5 text-white transition-colors hover:bg-white/30"
              >
                <ChevronRight size={24} aria-hidden="true" />
              </button>
            </>
          )}

          <div
            className="relative max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-[#1F1D1A]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[4/3] w-full">
              <SafeImage
                src={items[lightbox].src}
                alt={items[lightbox].alt}
                fill
                className="object-contain"
                sizes="100vw"
              />
            </div>
            {(items[lightbox].caption || items[lightbox].alt) && (
              <div className="border-t border-white/10 px-5 py-3 text-center text-sm text-white/90">
                {items[lightbox].caption ?? items[lightbox].alt}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
