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
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-md"
          : "bg-transparent"
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
            <p
              className={`text-[11px] sm:text-xs transition-colors leading-snug max-w-[13rem] sm:max-w-[11rem] ${
                scrolled ? "text-neutral-mid" : "text-white/85"
              }`}
            >
              Acabados para la construcción
            </p>
          </a>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  scrolled
                    ? "text-neutral-dark hover:text-brand-primary hover:bg-accent-cream"
                    : "text-white/90 hover:text-white hover:bg-white/10"
                }`}
              >
                {link.label}
              </a>
            ))}
            <a
              href="#contacto"
              className="ml-2 px-4 py-2 bg-brand-primary hover:bg-brand-dark text-white text-sm font-semibold rounded-lg transition-colors"
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
              <X
                size={24}
                className={scrolled ? "text-neutral-dark" : "text-white"}
              />
            ) : (
              <Menu
                size={24}
                className={scrolled ? "text-neutral-dark" : "text-white"}
              />
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <nav className="px-4 py-3 flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="px-3 py-2.5 text-neutral-dark hover:text-brand-primary hover:bg-accent-cream rounded-lg text-sm font-medium transition-colors"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#contacto"
              onClick={() => setMenuOpen(false)}
              className="mt-2 px-4 py-2.5 bg-brand-primary text-white text-sm font-semibold rounded-lg text-center"
            >
              Cotizar ahora
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
