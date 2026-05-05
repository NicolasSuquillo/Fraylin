"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";

const galleryItems = [
  {
    src: "/gallery/trabajo-01.jpg",
    alt: "Instalación de cerámica en baño",
    caption: "Instalación de cerámica",
  },
  {
    src: "/gallery/trabajo-02.jpg",
    alt: "Colocación de porcelanato en sala",
    caption: "Porcelanato en sala",
  },
  {
    src: "/gallery/trabajo-03.jpg",
    alt: "Mueble de baño instalado",
    caption: "Mueble de baño completo",
  },
  {
    src: "/gallery/trabajo-04.jpg",
    alt: "Fachaleta de piedra en fachada",
    caption: "Piedra decorativa exterior",
  },
  {
    src: "/gallery/trabajo-05.jpg",
    alt: "Grifería instalada en cocina",
    caption: "Grifería de cocina",
  },
  {
    src: "/gallery/trabajo-06.jpg",
    alt: "Piso flotante instalado",
    caption: "Piso flotante",
  },
];

export default function GaleriaSection() {
  const [lightbox, setLightbox] = useState<number | null>(null);

  const prev = () =>
    setLightbox((c) => (c === null ? null : c === 0 ? galleryItems.length - 1 : c - 1));
  const next = () =>
    setLightbox((c) => (c === null ? null : c === galleryItems.length - 1 ? 0 : c + 1));

  return (
    <section id="galeria" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Galería de Trabajos"
          subtitle="Proyectos realizados con dedicación y materiales de primera calidad"
        />

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {galleryItems.map((item, i) => (
            <button
              key={i}
              onClick={() => setLightbox(i)}
              className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100"
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end p-3">
                <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.caption}
                </span>
              </div>
            </button>
          ))}
        </div>

        <p className="text-center text-neutral-mid text-sm mt-6">
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
      </div>

      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLightbox(null);
          }}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white"
            aria-label="Cerrar"
          >
            <X size={28} />
          </button>
          <button
            onClick={prev}
            className="absolute left-4 text-white/70 hover:text-white"
            aria-label="Anterior"
          >
            <ChevronLeft size={36} />
          </button>
          <div className="relative w-full max-w-3xl aspect-[4/3]">
            <Image
              src={galleryItems[lightbox].src}
              alt={galleryItems[lightbox].alt}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
          <button
            onClick={next}
            className="absolute right-4 text-white/70 hover:text-white"
            aria-label="Siguiente"
          >
            <ChevronRight size={36} />
          </button>
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
            {galleryItems[lightbox].caption} — {lightbox + 1}/{galleryItems.length}
          </p>
        </div>
      )}
    </section>
  );
}
