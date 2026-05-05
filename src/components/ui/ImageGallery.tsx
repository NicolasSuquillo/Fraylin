"use client";

import { useState, useCallback, useEffect } from "react";
import SafeImage from "@/components/ui/SafeImage";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ProductImage } from "@/types";

interface ImageGalleryProps {
  images: ProductImage[];
  productName: string;
}

const PLACEHOLDER_DIMS = { w: 800, h: 600 };

export default function ImageGallery({
  images,
  productName,
}: ImageGalleryProps) {
  const [current, setCurrent] = useState(0);
  const [dims, setDims] = useState(PLACEHOLDER_DIMS);

  useEffect(() => {
    setDims(PLACEHOLDER_DIMS);
  }, [current, images[current]?.src]);

  const prev = useCallback(() => {
    setCurrent((c) => (c === 0 ? images.length - 1 : c - 1));
  }, [images.length]);

  const next = useCallback(() => {
    setCurrent((c) => (c === images.length - 1 ? 0 : c + 1));
  }, [images.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prev, next]);

  return (
    <div className="flex flex-col gap-3 w-full lg:w-auto lg:max-w-[min(100%,calc(100vw-3rem))]">
      <div className="relative flex justify-center bg-gray-100 rounded-xl overflow-hidden">
        <SafeImage
          key={images[current].src}
          src={images[current].src}
          alt={images[current].alt}
          width={dims.w}
          height={dims.h}
          className="object-contain max-w-full max-h-[min(70vh,calc(90vh-14rem))] w-auto h-auto"
          sizes="(max-width: 1024px) 100vw, min(640px, 50vw)"
          priority
          onLoadingComplete={(img) =>
            setDims({ w: img.naturalWidth, h: img.naturalHeight })
          }
        />
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors"
              aria-label="Imagen anterior"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors"
              aria-label="Imagen siguiente"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                i === current
                  ? "border-brand-primary"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
              aria-label={`Ver ${productName} imagen ${i + 1}`}
            >
              <SafeImage
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
