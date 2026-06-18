"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Revela el contenido con un fade + translate sutil al entrar en el viewport.
 * SSR y entornos sin IntersectionObserver (o con prefers-reduced-motion)
 * muestran el contenido visible desde el inicio — nunca queda oculto.
 */
type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  immediate?: boolean;
};

export default function Reveal({ children, className, delay = 0, immediate = false }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  // Visible por defecto (SSR / fallback); solo se oculta si vamos a animar.
  const [visible, setVisible] = useState(true);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (immediate) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Ya está en el viewport en el primer render: no ocultar (evita parpadeo en hero/above-the-fold).
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) return;

    setVisible(false);
    setArmed(true);
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [immediate]);

  return (
    <div
      ref={ref}
      className={`${className ?? ""} ${
        armed
          ? `transition-all duration-700 ease-out ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`
          : ""
      }`.trim()}
      style={armed && visible ? { transitionDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
}
