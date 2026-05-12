"use client";

import type { ReactNode } from "react";

/** Contenedor neutro: sin animación al hacer scroll (la página carga completa de una vez). */
type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  immediate?: boolean;
};

export default function Reveal({ children, className }: RevealProps) {
  return <div className={className}>{children}</div>;
}
