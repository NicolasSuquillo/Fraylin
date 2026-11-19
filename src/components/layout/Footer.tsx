import Image from "next/image";
import Link from "next/link";
import { MapPin, Phone, Clock, PackageCheck } from "lucide-react";
import { BUSINESS } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-[#E6E1D6] bg-white text-[#1F1D1A]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Marca */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <Image
                src="/logotipo.png"
                alt="Fraylin Acabados"
                width={40}
                height={40}
                className="size-10 rounded-lg border border-[#E6E1D6] object-cover"
              />
              <div>
                <span className="block text-lg font-bold tracking-[0.18em] text-[#B89B5E] uppercase">
                  FRAYLIN
                </span>
                <span className="block text-[11px] font-medium tracking-[0.12em] text-[#6E6A63] uppercase">
                  Acabados arquitectónicos
                </span>
              </div>
            </Link>
            <p className="text-sm leading-relaxed text-[#6E6A63]">
              {BUSINESS.description}
            </p>
            <div className="flex gap-2.5 pt-1">
              <a
                href={BUSINESS.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook de Fraylin"
                className="flex size-9 items-center justify-center rounded-lg border border-[#E6E1D6] bg-[#F2EFE9] text-[#1F1D1A] transition-colors duration-200 hover:border-[#C9B079] hover:bg-[#C9B079]"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden="true">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
              </a>
              <a
                href={BUSINESS.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram de Fraylin"
                className="flex size-9 items-center justify-center rounded-lg border border-[#E6E1D6] bg-[#F2EFE9] text-[#1F1D1A] transition-colors duration-200 hover:border-[#C9B079] hover:bg-[#C9B079]"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden="true">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
              <a
                href={BUSINESS.social.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok de Fraylin"
                className="flex size-9 items-center justify-center rounded-lg border border-[#E6E1D6] bg-[#F2EFE9] text-xs font-bold text-[#1F1D1A] transition-colors duration-200 hover:border-[#C9B079] hover:bg-[#C9B079]"
              >
                TK
              </a>
            </div>
          </div>

          {/* Tienda */}
          <div>
            <h3 className="mb-4 font-sans text-xs font-bold tracking-[0.15em] text-[#7A6336] uppercase">
              Tienda
            </h3>
            <ul className="space-y-2.5 text-sm text-[#6E6A63]">
              <li>
                <Link href="/catalogo" className="transition-colors hover:text-[#1F1D1A]">
                  Catálogo completo
                </Link>
              </li>
              <li>
                <Link href="/#ambientes" className="transition-colors hover:text-[#1F1D1A]">
                  Líneas y ambientes
                </Link>
              </li>
              <li>
                <Link href="/#destacados" className="transition-colors hover:text-[#1F1D1A]">
                  Acabados destacados
                </Link>
              </li>
              <li>
                <Link href="/checkout" className="transition-colors hover:text-[#1F1D1A]">
                  Finalizar compra
                </Link>
              </li>
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <h3 className="mb-4 font-sans text-xs font-bold tracking-[0.15em] text-[#7A6336] uppercase">
              Empresa
            </h3>
            <ul className="space-y-2.5 text-sm text-[#6E6A63]">
              <li>
                <Link href="/proyectos" className="transition-colors hover:text-[#1F1D1A]">
                  Proyectos realizados
                </Link>
              </li>
              <li>
                <Link href="/#manifiesto" className="transition-colors hover:text-[#1F1D1A]">
                  Materialidad y calidad
                </Link>
              </li>
              <li>
                <Link href="/#contacto" className="transition-colors hover:text-[#1F1D1A]">
                  Asesoría técnica
                </Link>
              </li>
            </ul>
            <div className="mt-5 space-y-2 border-t border-[#E6E1D6] pt-4 text-xs text-[#6E6A63]">
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-[#7A6336]" aria-hidden="true" />
                <a
                  href={BUSINESS.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#1F1D1A]"
                >
                  {BUSINESS.address}
                </a>
              </p>
              <p className="flex items-start gap-2">
                <Clock className="mt-0.5 size-3.5 shrink-0 text-[#7A6336]" aria-hidden="true" />
                <span>
                  {BUSINESS.hours.weekdays}
                  <br />
                  {BUSINESS.hours.saturday}
                </span>
              </p>
            </div>
          </div>

          {/* Soporte y Rastreo */}
          <div>
            <h3 className="mb-4 font-sans text-xs font-bold tracking-[0.15em] text-[#7A6336] uppercase">
              Soporte y Rastreo
            </h3>
            <ul className="space-y-2.5 text-sm text-[#6E6A63]">
              <li>
                <Link
                  href="/seguimiento"
                  className="inline-flex items-center gap-1.5 font-medium text-[#1F1D1A] transition-colors hover:text-[#7A6336]"
                >
                  <PackageCheck className="size-4 text-[#7A6336]" aria-hidden="true" />
                  Rastrear pedido
                </Link>
              </li>
              <li>
                <Link href="/portal" className="transition-colors hover:text-[#1F1D1A]">
                  Portal Clientes
                </Link>
              </li>
              {BUSINESS.phones.map((phone) => (
                <li key={phone} className="flex items-center gap-2">
                  <Phone className="size-3.5 shrink-0 text-[#7A6336]" aria-hidden="true" />
                  <a
                    href={`tel:+593${phone.replace(/\s/g, "").slice(1)}`}
                    className="transition-colors hover:text-[#1F1D1A]"
                  >
                    {phone}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-[#E6E1D6] pt-6 text-xs text-[#6E6A63] sm:flex-row">
          <p>Fraylin Acabados © 2026. Todos los derechos reservados.</p>
          <p className="text-[#8C877E]">fraylinacabados.com · Quito, Ecuador</p>
        </div>
      </div>
    </footer>
  );
}
