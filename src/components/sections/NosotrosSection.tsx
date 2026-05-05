import { Shield, Star, MapPin } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import { BUSINESS } from "@/lib/constants";

const stats = [
  { icon: Star, value: "100%", label: "Clientes satisfechos" },
  { icon: Shield, value: "Calidad", label: "Marcas garantizadas" },
  { icon: MapPin, value: "Quito", label: "Servicio a domicilio" },
];

export default function NosotrosSection() {
  return (
    <section id="nosotros" className="py-20 bg-accent-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Sobre Nosotros"
          subtitle="Conoce quiénes somos y por qué somos tu mejor opción"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h3
              className="text-2xl font-bold text-neutral-dark mb-4"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Tu aliado en acabados de construcción
            </h3>
            <p className="text-neutral-mid leading-relaxed mb-4">
              {BUSINESS.description} Ofrecemos una amplia variedad de productos —
              desde cerámica y porcelanato hasta grifería, muebles de baño, piedra
              decorativa y ferretería — todo en un solo lugar.
            </p>
            <p className="text-neutral-mid leading-relaxed mb-6">
              Brindamos asesoría personalizada y servicio de instalación para que
              tu proyecto quede perfecto. Nos encontramos en{" "}
              <strong className="text-neutral-dark">{BUSINESS.address}</strong>, con
              horario amplio y disponibilidad flexible para atenderte cuando lo
              necesites.
            </p>

            <div className="bg-white rounded-2xl p-4 border border-brand-light/30">
              <p className="text-sm font-semibold text-neutral-dark mb-2">
                🕐 Horarios de atención
              </p>
              <p className="text-sm text-neutral-mid">{BUSINESS.hours.weekdays}</p>
              <p className="text-sm text-neutral-mid">{BUSINESS.hours.saturday}</p>
              <p className="text-xs text-brand-primary mt-2 italic">
                {BUSINESS.hours.note}
              </p>
            </div>
          </div>

          <div>
            <div className="grid grid-cols-3 gap-4 mb-8">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white rounded-2xl p-5 text-center shadow-sm"
                >
                  <div className="w-10 h-10 bg-accent-cream rounded-xl flex items-center justify-center mx-auto mb-3">
                    <stat.icon size={22} className="text-brand-primary" />
                  </div>
                  <p
                    className="text-xl font-black text-brand-primary"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {stat.value}
                  </p>
                  <p className="text-xs text-neutral-mid mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-brand-primary rounded-2xl p-6 text-white">
              <h4
                className="font-bold text-lg mb-2"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                ¿Por qué elegirnos?
              </h4>
              <ul className="space-y-2 text-sm text-white/90">
                <li className="flex items-center gap-2">
                  <span className="text-accent-cream">✓</span> Productos de marcas
                  nacionales e importadas
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent-cream">✓</span> Asesoría técnica sin
                  costo adicional
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent-cream">✓</span> Instalación
                  profesional a domicilio
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent-cream">✓</span> Atención personalizada
                  y trato directo
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent-cream">✓</span> Precios competitivos
                  en todo el catálogo
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
