import { ArrowRight, ChevronDown, LayoutGrid } from "lucide-react";
import { BUSINESS, buildWhatsAppUrl } from "@/lib/constants";
import Reveal from "@/components/ui/Reveal";
import WhatsAppButton from "@/components/ui/WhatsAppButton";

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
            <span className="block text-brand-dark">Fraylin</span>
            Acabados de alta calidad
            <span className="block">para embellecer tu hogar</span>
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
          <WhatsAppButton href={waUrl} variant="hero" label="Cotizar por WhatsApp" />
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
