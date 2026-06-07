import { ArrowRight, ChevronDown, LayoutGrid } from "lucide-react";
import { BUSINESS, buildWhatsAppUrl } from "@/lib/constants";
import Reveal from "@/components/ui/Reveal";

function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-accent-cream">
      <picture className="absolute inset-0 block h-full w-full">
        <source media="(max-width: 767px)" srcSet="/fondo-mobile.webp" type="image/webp" />
        <source srcSet="/fondo.webp" type="image/webp" />
        <img
          src="/fondo.webp"
          alt=""
          aria-hidden
          fetchPriority="high"
          decoding="async"
          className="h-full w-full object-cover scale-110 blur-[2px]"
        />
      </picture>
    </div>
  );
}

export default function HeroSection() {  const waMessage = "Hola Fraylin, me gustaría solicitar una cotización.";
  const waUrl = buildWhatsAppUrl(BUSINESS.whatsapp[0].number, waMessage);

  return (
    <section
      id="inicio"
      className="relative min-h-screen flex items-start justify-center overflow-hidden"
    >
      <HeroBackground />      <div className="absolute inset-0 bg-gradient-to-b from-accent-cream/75 via-accent-cream/45 to-accent-cream/65" />

      <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto w-full pt-32 md:pt-40 lg:pt-44 pb-20 md:pb-24">
        <Reveal immediate delay={0}>
          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-neutral-dark mb-4 leading-tight tracking-wider drop-shadow-sm"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Acabados de
            <span className="block text-brand-dark">alta calidad</span>
            para embellecer tu hogar
          </h1>
        </Reveal>

        <Reveal immediate delay={0.08}>
          <div className="w-24 h-px bg-brand-primary mx-auto my-8" />
        </Reveal>

        <Reveal immediate delay={0.14}>
          <p className="text-text-secondary text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            Cerámica, porcelanato, grifería, muebles de baño, piedra decorativa y
            más. Asesoría e instalación profesional en Quito.
          </p>
        </Reveal>

        <Reveal immediate delay={0.2} className="flex flex-col sm:flex-row gap-4 sm:gap-5 justify-center items-stretch sm:items-center">
          <a
            href="#productos"
            className="group relative inline-flex min-h-[3.25rem] items-center justify-center gap-2.5 overflow-hidden rounded-2xl border border-brand-dark/20 bg-brand-primary px-8 py-3.5 text-base font-semibold text-neutral-dark shadow-[0_10px_40px_-12px_rgba(201,168,76,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-dark hover:text-accent-cream hover:shadow-[0_16px_48px_-14px_rgba(160,120,48,0.45)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary active:translate-y-0 sm:text-lg"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-dark/10 text-neutral-dark transition-colors group-hover:bg-accent-cream/15 group-hover:text-accent-cream">
              <LayoutGrid className="h-[18px] w-[18px] sm:h-5 sm:w-5" strokeWidth={2.25} aria-hidden />
            </span>
            <span className="tracking-tight">Ver catálogo</span>
            <ArrowRight
              className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5"
              aria-hidden
            />
          </a>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex min-h-[3.25rem] items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-br from-[#25D366] via-[#20bd5a] to-emerald-700 px-8 py-3.5 text-base font-semibold text-white shadow-[0_10px_40px_-12px_rgba(16,120,72,0.55)] ring-1 ring-white/15 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_48px_-14px_rgba(16,120,72,0.55)] hover:ring-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 active:translate-y-0 sm:text-lg"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            <span
              aria-hidden
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 transition-colors group-hover:bg-white/25"
            >
              <svg className="h-[18px] w-[18px] text-white sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </span>
            <span className="tracking-tight">Cotizar por WhatsApp</span>
            <ArrowRight
              className="h-5 w-5 shrink-0 text-white/85 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-white"
              aria-hidden
            />
          </a>
        </Reveal>

        <Reveal immediate delay={0.28} className="flex flex-wrap justify-center gap-3 sm:gap-4 mt-10 sm:mt-12">
          {[
            "Marcas nacionales e importadas",
            "Instalación profesional",
            "Servicio a domicilio",
            "Atención personalizada",
          ].map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3.5 py-1.5 text-xs sm:text-sm font-medium text-text-secondary shadow-sm ring-1 ring-black/[0.06] backdrop-blur-sm"
            >
              <span className="text-brand-dark" aria-hidden>
                ✓
              </span>
              {item}
            </span>
          ))}
        </Reveal>
      </div>

      <Reveal immediate delay={0.36} className="absolute bottom-6 md:bottom-8 left-1/2 z-10 -translate-x-1/2">
        <a
          href="#servicios"
          className="text-text-secondary/60 hover:text-brand-dark transition-colors animate-bounce inline-flex"
          aria-label="Bajar a servicios"
        >
          <ChevronDown size={32} />
        </a>
      </Reveal>
    </section>
  );
}
