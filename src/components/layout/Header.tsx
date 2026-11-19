"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, UserCheck } from "lucide-react";
import CartButton from "@/components/cart/CartButton";

const navLinks = [
  { label: "Catálogo", href: "/catalogo" },
  { label: "Ambientes", href: "/#ambientes" },
  { label: "Proyectos", href: "/proyectos" },
  { label: "Rastrear Pedido", href: "/seguimiento" },
];

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      setMenuOpen(false);
      menuBtnRef.current?.focus();
    };
    const onResize = () => {
      if (window.innerWidth >= 768) setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, [menuOpen]);

  const isActive = (href: string) => {
    if (href.startsWith("/#")) return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 border-b border-[#E6E1D6] bg-white/90 backdrop-blur-md transition-all duration-200 supports-[backdrop-filter]:bg-white/85 ${
        scrolled ? "shadow-xl shadow-black/5" : ""
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4 md:h-20">
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            aria-label="Fraylin Acabados — Ir al inicio"
            className="group flex items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9B079]"
          >
            <Image
              src="/logotipo.png"
              alt=""
              width={40}
              height={40}
              className="size-9 rounded-lg border border-[#E6E1D6] object-cover sm:size-10"
              priority
            />
            <div className="min-w-0">
              <span className="block text-base font-bold tracking-[0.18em] text-[#B89B5E] uppercase sm:text-lg">
                FRAYLIN
              </span>
              <span className="hidden text-[11px] font-medium tracking-[0.12em] text-[#6E6A63] uppercase sm:block">
                Acabados arquitectónicos
              </span>
            </div>
          </Link>

          <nav aria-label="Navegación principal" className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9B079] ${
                    active
                      ? "bg-[#F2EFE9] font-semibold text-[#1F1D1A]"
                      : "text-[#6E6A63] hover:bg-[#F2EFE9]/70 hover:text-[#1F1D1A]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link
              href="/portal"
              aria-current={isActive("/portal") ? "page" : undefined}
              className="ml-2 inline-flex items-center gap-1.5 rounded-lg border border-[#E6E1D6] bg-[#F2EFE9] px-3.5 py-2 text-sm font-semibold text-[#1F1D1A] transition-all duration-200 hover:border-[#C9B079] hover:bg-[#C9B079] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9B079]"
            >
              <UserCheck className="size-4 text-[#7A6336]" aria-hidden="true" />
              <span>Portal Clientes</span>
            </Link>
          </nav>

          <div className="flex items-center gap-1.5">
            <CartButton />
            <button
              ref={menuBtnRef}
              type="button"
              className="rounded-lg p-2 text-[#1F1D1A] transition-colors duration-200 hover:bg-[#F2EFE9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9B079] md:hidden"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-expanded={menuOpen}
              aria-controls="mobile-primary-nav"
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            >
              {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>

      <div
        id="mobile-primary-nav"
        hidden={!menuOpen}
        className={`border-t border-[#E6E1D6] bg-white shadow-xl shadow-black/5 md:hidden ${
          menuOpen ? "block" : "hidden"
        }`}
      >
        <nav aria-label="Navegación móvil" className="flex flex-col gap-1 px-4 py-4">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9B079] ${
                  active
                    ? "bg-[#F2EFE9] font-semibold text-[#1F1D1A]"
                    : "text-[#6E6A63] hover:bg-[#F2EFE9] hover:text-[#1F1D1A]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/portal"
            onClick={() => setMenuOpen(false)}
            aria-current={isActive("/portal") ? "page" : undefined}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-[#C9B079] px-4 py-2.5 text-sm font-semibold text-[#1F1D1A] transition-colors duration-200 hover:bg-[#D2BD8A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9B079]"
          >
            <UserCheck className="size-4" aria-hidden="true" />
            Portal Clientes
          </Link>
        </nav>
      </div>
    </header>
  );
}
