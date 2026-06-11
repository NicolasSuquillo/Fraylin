"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import SafeImage from "@/components/ui/SafeImage";
import Reveal from "@/components/ui/Reveal";
import type { GalleryItem } from "@/types";

const PLACEHOLDER_SLOTS = 6;

interface GaleriaSectionProps {
  items: GalleryItem[];
}

export default function GaleriaSection({ items: galleryItems }: GaleriaSectionProps) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  const hasPhotos = galleryItems.length > 0;

  const prev = () =>
    setLightbox((c) =>
      c === null ? null : c === 0 ? galleryItems.length - 1 : c - 1
    );
  const next = () =>
    setLightbox((c) =>
      c === null ? null : c === galleryItems.length - 1 ? 0 : c + 1
    );

  return (
    <section id="galeria" className="py-16 md:py-20 bg-neutral-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal delay={0}>
          <SectionHeading
            title="Galería de Trabajos"
            subtitle="Proyectos realizados con dedicación y materiales de primera calidad"
          />
        </Reveal>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {!hasPhotos
            ? Array.from({ length: PLACEHOLDER_SLOTS }, (_, i) => (
                <Reveal key={`placeholder-${i}`} delay={i * 0.06}>
                <div
                  className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-stone-200 bg-neutral-light"
                >
                  <SafeImage
                    src="/placeholder.svg"
                    alt="Foto próximamente"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                </div>
                </Reveal>
              ))
            : galleryItems.map((item, i) => (
                <Reveal key={`${item.src}-${i}`} delay={i * 0.06}>
                <button
                  type="button"
                  onClick={() => setLightbox(i)}
                  className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-neutral-light text-left border border-transparent hover:border-brand-primary/30 transition-colors w-full"
                >
                  <SafeImage
                    src={item.src}
                    alt={item.alt}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-[rgba(201,168,76,0.25)] transition-colors flex items-end p-3">
                    <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md">
                      {item.caption ?? item.alt}
                    </span>
                  </div>
                </button>
                </Reveal>
              ))}
        </div>

        <Reveal delay={0.2}>
        <p className="text-center text-text-secondary text-sm mt-6">
          ¿Quieres ver más trabajos?{" "}
          <a
            href="https://www.instagram.com/fraylin.acabados"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-primary font-semibold hover:underline"
          >
            Síguenos en Instagram
          </a>
        </p>
        </Reveal>
      </div>

      {hasPhotos && lightbox !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLightbox(null);
          }}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white"
            aria-label="Cerrar"
          >
            <X size={28} />
          </button>
          <button
            type="button"
            onClick={prev}
            className="absolute left-4 text-white/70 hover:text-white"
            aria-label="Anterior"
          >
            <ChevronLeft size={36} />
          </button>
          <div className="relative w-full max-w-3xl aspect-[4/3]">
            <SafeImage
              src={galleryItems[lightbox].src}
              alt={galleryItems[lightbox].alt}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
          <button
            type="button"
            onClick={next}
            className="absolute right-4 text-white/70 hover:text-white"
            aria-label="Siguiente"
          >
            <ChevronRight size={36} />
          </button>
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
            {galleryItems[lightbox].caption ?? galleryItems[lightbox].alt} — {lightbox + 1}/
            {galleryItems.length}
          </p>
        </div>
      )}
    </section>
  );
}
