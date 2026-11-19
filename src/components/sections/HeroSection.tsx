import Link from "next/link";
import { ArrowRight, MessageSquare } from "lucide-react";
import { BUSINESS, buildWhatsAppUrl } from "@/lib/constants";
import Reveal from "@/components/ui/Reveal";

export default function HeroSection() {
  const waMessage =
    "Hola Fraylin, me gustaría solicitar asesoría y cotización para un proyecto de acabados.";
  const waUrl = buildWhatsAppUrl(BUSINESS.whatsapp[0].number, waMessage);

  return (
    <section
      id="inicio"
      className="relative z-10 pt-24 pb-12 sm:pt-28 sm:pb-16 lg:pt-32 lg:pb-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Columna Editorial Izquierda */}
          <div className="space-y-6 lg:col-span-6">
            <Reveal immediate delay={0}>
              <p className="inline-flex items-center gap-2 rounded-full border border-[#E6E1D6] bg-[#F2EFE9] px-3.5 py-1.5 text-xs font-semibold tracking-[0.14em] text-[#7A6336] uppercase">
                Fraylin Acabados · Quito, Ecuador
              </p>
            </Reveal>

            <Reveal immediate delay={0.06}>
              <h1
                className="text-4xl font-bold leading-[1.12] tracking-tight text-[#1F1D1A] sm:text-5xl lg:text-[3.25rem]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Superficies y acabados que definen la{" "}
                <span className="text-[#B89B5E]">arquitectura</span> de tu espacio.
              </h1>
            </Reveal>

            <Reveal immediate delay={0.12}>
              <p className="max-w-xl text-base leading-relaxed text-[#6E6A63] sm:text-lg">
                Porcelanatos, revestimientos de muro, piedras naturales, cocinas y
                grifería de alto desempeño. Asesoría e instalación
                para obra residencial y comercial.
              </p>
            </Reveal>

            <Reveal
              immediate
              delay={0.18}
              className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center"
            >
              <Link
                href="/catalogo"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-[#C9B079] px-6 py-3 text-sm font-semibold text-[#1F1D1A] shadow-xs transition-all duration-200 hover:bg-[#D2BD8A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9B079]"
              >
                <span>Explorar Catálogo</span>
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg border border-[#E6E1D6] bg-white px-6 py-3 text-sm font-semibold text-[#1F1D1A] transition-all duration-200 hover:border-[#C9B079] hover:bg-[#F2EFE9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9B079]"
              >
                <MessageSquare className="size-4 text-[#7A6336]" aria-hidden="true" />
                <span>Solicitar Asesoría / Cotizar</span>
              </a>
            </Reveal>
          </div>

          {/* Columna Fotografía Arquitectónica Derecha */}
          <div className="lg:col-span-6">
            <Reveal immediate delay={0.1}>
              <div className="overflow-hidden rounded-2xl border border-[#E6E1D6] bg-white p-2.5 shadow-xl shadow-black/5">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-[#F2EFE9]">
                  <picture className="block size-full">
                    <source
                      media="(max-width: 767px)"
                      srcSet="/fondo-mobile.webp"
                      type="image/webp"
                    />
                    <source srcSet="/fondo.webp" type="image/webp" />
                    <img
                      src="/fondo.webp"
                      alt="Showroom y materiales arquitectónicos de Fraylin Acabados"
                      fetchPriority="high"
                      decoding="async"
                      className="size-full object-cover"
                    />
                  </picture>
                </div>
                <div className="flex items-center justify-between gap-4 px-2 pt-3 pb-1 text-xs text-[#6E6A63]">
                  <span>Showroom Av. Juan de Molinares, Quito</span>
                  <Link
                    href="/proyectos"
                    className="font-semibold text-[#7A6336] hover:underline"
                  >
                    Ver obras realizadas →
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
