"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import SafeImage from "@/components/ui/SafeImage";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import type { ProductImage } from "@/types";

interface ImageGalleryProps {
  images: ProductImage[];
  productName: string;
}

const SLIDE_TRANSITION = "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)";

export default function ImageGallery({
  images,
  productName,
}: ImageGalleryProps) {
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const isMulti = images.length > 1;
  const activeIndex =
    images.length === 0 ? 0 : Math.min(current, images.length - 1);
  const activeImage = images[activeIndex];

  const goTo = useCallback(
    (index: number) => {
      if (images.length === 0) return;
      setCurrent(((index % images.length) + images.length) % images.length);
    },
    [images.length]
  );

  const prev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);
  const next = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!lightbox) return;
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape") setLightbox(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prev, next, lightbox]);

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

  const lightboxStyle = {
    transform: `translateX(-${activeIndex * 100}%)`,
    transition: SLIDE_TRANSITION,
  };

  if (!activeImage) return null;

  return (
    <>
      <div className="flex w-full flex-col gap-3 px-4 sm:px-5 lg:px-0">
        <div className="relative">
          <button
            type="button"
            onClick={() => setLightbox(true)}
            className="group relative block aspect-[4/3] w-full overflow-hidden rounded-2xl bg-neutral-light"
            aria-label={`Ampliar imagen de ${productName}`}
          >
            <SafeImage
              key={activeImage.src}
              src={activeImage.src}
              alt={activeImage.alt}
              fill
              className="object-contain transition-transform duration-500 group-active:scale-[0.99]"
              sizes="(max-width: 640px) 92vw, (max-width: 1024px) 55vw, 480px"
              priority
            />

            <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
              <ZoomIn size={14} aria-hidden />
              Ampliar
            </span>

            {isMulti && (
              <span
                className="absolute top-3 left-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm"
                aria-live="polite"
              >
                {activeIndex + 1} / {images.length}
              </span>
            )}
          </button>

          {isMulti && (
            <>
              <button
                type="button"
                onClick={prev}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/95 p-2 text-brand-dark shadow-md transition-colors hover:bg-white"
                aria-label="Imagen anterior"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={next}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/95 p-2 text-brand-dark shadow-md transition-colors hover:bg-white"
                aria-label="Imagen siguiente"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>

        {isMulti && (
          <div
            className="grid grid-cols-4 gap-2 sm:grid-cols-5"
            role="tablist"
            aria-label={`Miniaturas de ${productName}`}
          >
            {images.map((img, i) => (
              <button
                key={img.src}
                type="button"
                role="tab"
                onClick={() => goTo(i)}
                className={`relative aspect-square overflow-hidden rounded-xl transition-all ${
                  i === activeIndex
                    ? "ring-2 ring-brand-primary ring-offset-2 ring-offset-surface-primary"
                    : "opacity-60 hover:opacity-100"
                }`}
                aria-label={`Ver imagen ${i + 1} de ${images.length}`}
                aria-selected={i === activeIndex}
              >
                <SafeImage
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-contain bg-neutral-light"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <dialog
        ref={dialogRef}
        className="fixed inset-0 m-auto max-h-none max-w-none h-screen w-screen bg-transparent p-0 backdrop:bg-black/95"
        onClick={() => setLightbox(false)}
      >
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden p-4">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox(false);
            }}
            className="absolute top-4 right-4 z-10 rounded-full bg-white/15 p-2 text-white transition-colors hover:bg-white/30"
            aria-label="Cerrar"
          >
            <X size={24} />
          </button>

          {isMulti && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/15 p-2 text-white transition-colors hover:bg-white/30"
                aria-label="Imagen anterior"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/15 p-2 text-white transition-colors hover:bg-white/30"
                aria-label="Imagen siguiente"
              >
                <ChevronRight size={24} />
              </button>
              <span className="pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm text-white backdrop-blur-sm">
                {activeIndex + 1} / {images.length}
              </span>
            </>
          )}

          <div className="pointer-events-none relative h-full w-full max-w-5xl overflow-hidden">
            <div className="flex h-full w-full" style={lightboxStyle}>
              {images.map((image, i) => (
                <div
                  key={image.src}
                  className="flex h-full min-w-full w-full shrink-0 items-center justify-center"
                  aria-hidden={i !== activeIndex}
                >
                  <SafeImage
                    src={image.src}
                    alt={image.alt}
                    width={1600}
                    height={1200}
                    className="pointer-events-auto max-h-[calc(100dvh-2rem)] max-w-[min(100vw-2rem,64rem)] h-auto w-auto object-contain"
                    sizes="100vw"
                    priority={i === activeIndex}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
