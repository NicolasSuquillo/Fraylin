"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Inicio", href: "#inicio" },
  { label: "Servicios", href: "#servicios" },
  { label: "Productos", href: "#productos" },
  { label: "Galería", href: "#galeria" },
  { label: "Nosotros", href: "#nosotros" },
  { label: "Contacto", href: "#contacto" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 bg-neutral-dark/95 backdrop-blur-md border-b border-brand-primary/10 ${
        scrolled ? "shadow-[0_4px_20px_-4px_rgba(0,0,0,0.8)]" : ""
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <a
            href="#inicio"
            className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-3 group"
          >
            <Image
              src="/logotipo.png"
              alt="Fraylin"
              width={48}
              height={48}
              className="rounded-lg"
              priority
            />
            <p className="text-[11px] sm:text-xs leading-snug max-w-[13rem] sm:max-w-[11rem] text-accent-cream/60">
              Acabados para la construcción
            </p>
          </a>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-colors text-accent-cream/80 hover:text-brand-primary hover:bg-brand-primary/10"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#contacto"
              className="ml-2 px-4 py-2 border border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-neutral-dark text-sm font-semibold rounded-lg transition-colors"
            >
              Cotizar
            </a>
          </nav>

          <button
            className="md:hidden p-2 rounded-lg"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Menú"
          >
            {menuOpen ? (
              <X size={24} className="text-accent-cream" />
            ) : (
              <Menu size={24} className="text-accent-cream" />
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-surface-primary border-t border-brand-primary/20 shadow-lg">
          <nav className="px-4 py-3 flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="px-3 py-2.5 text-accent-cream/80 hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg text-sm font-medium transition-colors"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#contacto"
              onClick={() => setMenuOpen(false)}
              className="mt-2 px-4 py-2.5 border border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-neutral-dark text-sm font-semibold rounded-lg text-center transition-colors"
            >
              Cotizar ahora
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
