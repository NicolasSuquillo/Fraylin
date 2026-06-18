"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import CartButton from "@/components/cart/CartButton";

const navLinks = [
  { label: "Inicio", href: "/#inicio" },
  { label: "Servicios", href: "/#servicios" },
  { label: "Productos", href: "/#productos" },
  { label: "Galería", href: "/#galeria" },
  { label: "Nosotros", href: "/#nosotros" },
  { label: "Contacto", href: "/#contacto" },
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
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 bg-white/95 backdrop-blur-md border-b border-brand-primary/15 ${
        scrolled ? "shadow-[0_4px_24px_-6px_rgba(0,0,0,0.1)]" : ""
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link
            href="/"
            className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-3 group"
          >
            <Image
              src="/logotipo.png"
              alt="Fraylin Acabados para la Construcción"
              width={48}
              height={48}
              className="rounded-lg"
              priority
            />
            <div className="min-w-0">
              <p
                className="text-sm sm:text-base font-bold text-brand-dark leading-tight group-hover:text-neutral-dark transition-colors"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Fraylin
              </p>
              <p className="text-[11px] sm:text-xs leading-snug text-text-secondary group-hover:text-brand-dark transition-colors">
                Acabados para la construcción
              </p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-colors text-text-primary hover:text-brand-dark hover:bg-brand-primary/10"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/#contacto"
              className="ml-2 px-4 py-2 border border-brand-primary bg-brand-primary text-neutral-dark hover:bg-brand-dark hover:border-brand-dark hover:text-accent-cream text-sm font-semibold rounded-lg transition-colors"
            >
              Cotizar
            </Link>
          </nav>

          <div className="flex items-center gap-1">
            <CartButton />
            <button
              className="md:hidden p-2 rounded-lg text-text-primary hover:bg-brand-primary/10 hover:text-brand-dark transition-colors"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Menú"
            >
              {menuOpen ? (
                <X size={24} />
              ) : (
                <Menu size={24} />
              )}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white border-t border-brand-primary/15 shadow-lg">
          <nav className="px-4 py-3 flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="px-3 py-2.5 text-text-primary hover:text-brand-dark hover:bg-brand-primary/12 rounded-lg text-sm font-medium transition-colors active:bg-brand-primary/18"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/#contacto"
              onClick={() => setMenuOpen(false)}
              className="mt-2 px-4 py-2.5 border border-brand-primary bg-brand-primary text-neutral-dark hover:bg-brand-dark hover:border-brand-dark hover:text-accent-cream text-sm font-semibold rounded-lg text-center transition-colors"
            >
              Cotizar ahora
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
