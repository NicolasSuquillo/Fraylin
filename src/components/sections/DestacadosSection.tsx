"use client";

import { useRef, useLayoutEffect, useState } from "react";
import { motion, useMotionValue, animate, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/ui/Reveal";
import ProductCard from "@/components/products/ProductCard";
import type { Product } from "@/types";

interface DestacadosSectionProps {
  products: Product[];
  onSelect: (product: Product) => void;
}

export default function DestacadosSection({
  products,
  onSelect,
}: DestacadosSectionProps) {
  const reduced = useReducedMotion();
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [maxDrag, setMaxDrag] = useState(0);

  // x (useMotionValue) es estable; solo re-medimos al cambiar la lista de destacados
  useLayoutEffect(() => {
    const vp = viewportRef.current;
    const tr = trackRef.current;
    if (!vp || !tr) return;

    const measure = () => {
      const overflow = Math.max(0, tr.scrollWidth - vp.clientWidth);
      setMaxDrag(overflow);
      const current = x.get();
      x.set(Math.min(0, Math.max(-overflow, current)));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(vp);
    ro.observe(tr);
    return () => ro.disconnect();
  }, [products]);

  if (products.length === 0) return null;

  const nudge = (dir: -1 | 1) => {
    const vp = viewportRef.current?.clientWidth ?? 320;
    const step = vp * 0.55;
    const next = Math.max(-maxDrag, Math.min(0, x.get() - dir * step));
    if (reduced) x.set(next);
    else animate(x, next, { type: "spring", stiffness: 280, damping: 34 });
  };

  return (
    <section
      aria-label="Productos destacados"
      className="py-16 bg-accent-cream border-y border-brand-primary/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal delay={0}>
          <SectionHeading
            title="Selección destacada"
            subtitle="Productos que recomendamos por su demanda y calidad"
          />
        </Reveal>

        <div className="relative mt-2">
          {maxDrag > 8 && (
            <>
              <button
                type="button"
                onClick={() => nudge(-1)}
                aria-label="Desplazar destacados hacia la izquierda"
                className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 h-11 w-11 items-center justify-center rounded-full border border-brand-primary/30 bg-surface-primary text-brand-dark shadow-md hover:bg-brand-primary/10 transition-colors -translate-x-1/2"
              >
                <ChevronLeft className="w-5 h-5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => nudge(1)}
                aria-label="Desplazar destacados hacia la derecha"
                className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 h-11 w-11 items-center justify-center rounded-full border border-brand-primary/30 bg-surface-primary text-brand-dark shadow-md hover:bg-brand-primary/10 transition-colors translate-x-1/2"
              >
                <ChevronRight className="w-5 h-5" aria-hidden />
              </button>
            </>
          )}

          <div ref={viewportRef} className="overflow-hidden px-1 -mx-1">
            <motion.div
              ref={trackRef}
              style={{ x }}
              drag={reduced || maxDrag <= 0 ? false : "x"}
              dragConstraints={{ left: -maxDrag, right: 0 }}
              dragElastic={0.06}
              className="flex gap-4 md:gap-5 cursor-grab active:cursor-grabbing touch-pan-y pb-1"
            >
              {products.map((p) => (
                <div
                  key={p.id}
                  className="flex-[0_0_86%] min-w-0 sm:flex-[0_0_38%] md:flex-[0_0_31%] lg:flex-[0_0_24%] shrink-0"
                >
                  <ProductCard product={p} onSelect={onSelect} />
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
