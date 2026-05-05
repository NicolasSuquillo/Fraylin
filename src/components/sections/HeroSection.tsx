import { MessageCircle, ChevronDown } from "lucide-react";
import { BUSINESS, buildWhatsAppUrl } from "@/lib/constants";

export default function HeroSection() {
  const waMessage = "Hola Fraylin, me gustaría solicitar una cotización.";
  const waUrl = buildWhatsAppUrl(BUSINESS.whatsapp[0].number, waMessage);

  return (
    <section
      id="inicio"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Base: laminado / madera maciza — tonos roble–nogal */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 130% 85% at 50% -15%, rgba(255, 232, 205, 0.22) 0%, transparent 52%),
            linear-gradient(
              165deg,
              #7d634f 0%,
              #6a5243 22%,
              #8b7260 42%,
              #5c4639 68%,
              #4a382e 100%
            )
          `,
        }}
      />
      {/* Tablillas horizontales (piso flotante), juntas y veta fina */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: 0.92,
          backgroundImage: [
            // Brillo suave tipo barniz en el borde superior de cada tabla
            "repeating-linear-gradient(180deg, rgba(255,240,220,0.07) 0px, transparent 4px, transparent 76px)",
            // Juntas entre tablas (cada ~76px, como vista cenital del piso)
            "repeating-linear-gradient(180deg, transparent 0px, transparent 73px, rgba(22,14,10,0.6) 73px, rgba(42,28,20,0.35) 76px)",
            // Variación de tonalidad entre “piezas” (anchos alternados)
            "repeating-linear-gradient(90deg, rgba(55,38,28,0.18) 0px, rgba(110,88,72,0.06) 210px, rgba(65,46,36,0.2) 430px, rgba(95,74,60,0.08) 680px)",
            // Veta longitudinal muy fina (textura madera)
            "repeating-linear-gradient(92deg, transparent 0px, transparent 2px, rgba(35,24,18,0.14) 2px, rgba(35,24,18,0.14) 3px, transparent 4px, transparent 11px)",
          ].join(","),
        }}
      />
      {/* Lavado cálido para legibilidad del texto blanco */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/35"
        aria-hidden
      />

      <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto pt-20">
        <h1
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Acabados de
          <span className="block text-accent-cream">alta calidad</span>
          para tu hogar y obra
        </h1>

        <p className="text-white/85 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
          Cerámica, porcelanato, grifería, muebles de baño, piedra decorativa y
          más. Asesoría e instalación profesional en Quito.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#productos"
            className="px-8 py-4 bg-white text-brand-primary font-bold rounded-2xl hover:bg-accent-cream transition-colors text-lg shadow-lg hover:shadow-xl"
          >
            Ver Catálogo
          </a>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl transition-colors text-lg flex items-center justify-center gap-2 shadow-lg"
          >
            <MessageCircle size={22} />
            Cotizar por WhatsApp
          </a>
        </div>

        <div className="flex flex-wrap justify-center gap-6 mt-14 text-white/70 text-sm">
          <span className="flex items-center gap-1.5">✓ Marcas nacionales e importadas</span>
          <span className="flex items-center gap-1.5">✓ Instalación profesional</span>
          <span className="flex items-center gap-1.5">✓ Servicio a domicilio</span>
          <span className="flex items-center gap-1.5">✓ Atención personalizada</span>
        </div>
      </div>

      <a
        href="#servicios"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 hover:text-white transition-colors animate-bounce"
        aria-label="Bajar a servicios"
      >
        <ChevronDown size={32} />
      </a>
    </section>
  );
}
