import Link from "next/link";
import { ArrowRight, PackageSearch, UserCheck } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import type { GalleryItem } from "@/types";

interface ProjectsBridgeSectionProps {
  items: GalleryItem[];
}

export default function ProjectsBridgeSection({ items }: ProjectsBridgeSectionProps) {
  const previewItems = items.slice(0, 3);

  return (
    <section className="relative z-10 border-t border-[#E6E1D6] bg-[#F2EFE9]/75 py-14 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl space-y-12 px-4 sm:px-6 lg:px-8">
        {/* Proyectos Realizados */}
        <div>
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="max-w-2xl space-y-2">
              <p className="text-xs font-bold tracking-[0.16em] text-[#7A6336] uppercase">
                Obras y Espacios
              </p>
              <h2
                className="text-3xl font-bold tracking-tight text-[#1F1D1A] sm:text-4xl"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Proyectos realizados
              </h2>
            </div>
            <Link
              href="/proyectos"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#7A6336] transition-colors hover:text-[#1F1D1A]"
            >
              <span>Explorar galería completa</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          {previewItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {previewItems.map((item, i) => (
                <Link
                  key={`${item.src}-${i}`}
                  href="/proyectos"
                  className="group overflow-hidden rounded-2xl border border-[#E6E1D6] bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C9B079] hover:shadow-xl hover:shadow-black/5"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F2EFE9]">
                    <SafeImage
                      src={item.src}
                      alt={item.alt}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      sizes="(max-width: 767px) 100vw, 33vw"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-medium text-[#1F1D1A]">
                      {item.caption ?? item.alt}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-[#E6E1D6] bg-white p-8 text-center">
              <p className="text-sm text-[#6E6A63]">
                Conoce nuestros espacios terminados y aplicaciones reales en Quito.
              </p>
              <Link
                href="/proyectos"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#C9B079] px-5 py-2.5 text-sm font-semibold text-[#1F1D1A] transition-colors hover:bg-[#D2BD8A]"
              >
                Ver proyectos y ambientes
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>

        {/* Puente al Portal Clientes y Rastreo */}
        <div className="rounded-2xl border border-[#E6E1D6] bg-white p-6 shadow-xl shadow-black/5 sm:p-8 lg:p-10">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            <div className="space-y-3 lg:col-span-7">
              <p className="text-xs font-bold tracking-[0.16em] text-[#7A6336] uppercase">
                Trazabilidad y Gestión
              </p>
              <h3
                className="text-2xl font-bold text-[#1F1D1A] sm:text-3xl"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Portal Clientes &amp; Rastreo de Pedidos
              </h3>
              <p className="max-w-xl text-sm leading-relaxed text-[#6E6A63] sm:text-base">
                Consulta el estado de tu despacho en tiempo real con tu código{" "}
                <span className="font-mono font-semibold text-[#1F1D1A]">FR</span>{" "}
                o ingresa al Portal Clientes de Fraylin con tu Cédula o RUC.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:col-span-5 lg:justify-end">
              <Link
                href="/seguimiento"
                className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-lg border border-[#E6E1D6] bg-[#F2EFE9] px-5 py-2.5 text-sm font-semibold text-[#1F1D1A] transition-colors duration-200 hover:border-[#C9B079] hover:bg-[#C9B079]/30"
              >
                <PackageSearch className="size-4 text-[#7A6336]" aria-hidden="true" />
                <span>Rastrear Pedido</span>
              </Link>
              <Link
                href="/portal"
                className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-lg bg-[#C9B079] px-5 py-2.5 text-sm font-semibold text-[#1F1D1A] transition-colors duration-200 hover:bg-[#D2BD8A]"
              >
                <UserCheck className="size-4" aria-hidden="true" />
                <span>Ir al Portal Clientes</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
