import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";
import type { Category } from "@/types";

interface AmbientesSectionProps {
  categories: Category[];
}

export default function AmbientesSection({ categories }: AmbientesSectionProps) {
  return (
    <section
      id="ambientes"
      className="relative z-10 border-y border-[#E6E1D6] bg-[#F2EFE9]/75 py-14 sm:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-bold tracking-[0.16em] text-[#7A6336] uppercase">
              Líneas y Ambientes
            </p>
            <h2
              className="text-3xl font-bold tracking-tight text-[#1F1D1A] sm:text-4xl"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Categorías por familia y espacio
            </h2>
          </div>
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#7A6336] transition-colors hover:text-[#1F1D1A]"
          >
            <span>Ver todo el catálogo</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/catalogo?category=${encodeURIComponent(cat.slug)}`}
              className="group flex flex-col justify-between rounded-2xl border border-[#E6E1D6] bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C9B079] hover:shadow-xl hover:shadow-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9B079]"
            >
              <div className="space-y-3">
                <div className="inline-flex size-10 items-center justify-center rounded-xl bg-[#F2EFE9] text-[#7A6336] transition-colors group-hover:bg-[#C9B079] group-hover:text-[#1F1D1A]">
                  <Layers className="size-5" aria-hidden="true" />
                </div>
                <h3 className="font-sans text-lg font-semibold text-[#1F1D1A]">
                  {cat.label}
                </h3>
                {cat.description && (
                  <p className="line-clamp-2 text-sm leading-relaxed text-[#6E6A63]">
                    {cat.description}
                  </p>
                )}
              </div>
              <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-[#7A6336] group-hover:text-[#1F1D1A]">
                <span>Explorar línea</span>
                <ArrowRight
                  className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
