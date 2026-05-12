"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import SafeImage from "@/components/ui/SafeImage";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import type { ProductImage } from "@/types";

interface ImageGalleryProps {
  images: ProductImage[];
  productName: string;
}

const PLACEHOLDER_DIMS = { w: 800, h: 600 };

function GallerySlideImage({ image }: { image: ProductImage }) {
  const [dims, setDims] = useState(PLACEHOLDER_DIMS);
  return (
    <SafeImage
      src={image.src}
      alt={image.alt}
      width={dims.w}
      height={dims.h}
      className="object-contain max-h-full max-w-full w-auto h-auto p-2 sm:p-3"
      sizes="(max-width: 1024px) 92vw, min(860px, 65vw)"
      priority
      onLoadingComplete={(img) =>
        setDims({ w: img.naturalWidth, h: img.naturalHeight })
      }
    />
  );
}

function LightboxSlideImage({ image }: { image: ProductImage }) {
  const [dims, setDims] = useState(PLACEHOLDER_DIMS);
  return (
    <SafeImage
      src={image.src}
      alt={image.alt}
      width={dims.w}
      height={dims.h}
      className="object-contain max-w-full max-h-full w-auto h-auto"
      sizes="100vw"
      priority
      onLoadingComplete={(img) =>
        setDims({ w: img.naturalWidth, h: img.naturalHeight })
      }
    />
  );
}

export default function ImageGallery({
  images,
  productName,
}: ImageGalleryProps) {
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

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
      if (e.key === "Escape") setLightbox(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prev, next]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (lightbox) {
      dialog.showModal();
      document.body.style.overflow = "hidden";
    } else {
      dialog.close();
      document.body.style.overflow = "";
    }
  }, [lightbox]);

  return (
    <>
      <div className="flex min-h-0 w-full flex-1 flex-col gap-3">
        <div
          className="relative flex min-h-[min(260px,42vh)] flex-1 w-full min-w-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-stone-100 to-stone-200/80 shadow-inner cursor-zoom-in group lg:min-h-[min(480px,calc(92vh-11rem))] lg:max-h-[min(78vh,calc(92vh-11rem))]"
          onClick={() => setLightbox(true)}
        >
          <GallerySlideImage
            key={images[current].src}
            image={images[current]}
          />
          <span className="absolute top-2 right-2 bg-black/40 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <ZoomIn size={16} />
          </span>
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors"
                aria-label="Imagen anterior"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
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

      <dialog
        ref={dialogRef}
        className="fixed inset-0 m-auto p-0 bg-transparent max-w-none max-h-none w-screen h-screen backdrop:bg-black/90"
        onClick={() => setLightbox(false)}
      >
        <div className="flex items-center justify-center w-full h-full p-4" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-colors"
            aria-label="Cerrar"
          >
            <X size={24} />
          </button>
          {images.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-colors"
                aria-label="Imagen anterior"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={next}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-colors"
                aria-label="Imagen siguiente"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
          <LightboxSlideImage
            key={images[current].src}
            image={images[current]}
          />
        </div>
      </dialog>
    </>
  );
}
