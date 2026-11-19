import { ShieldCheck, Ruler, Compass } from "lucide-react";
import { BUSINESS } from "@/lib/constants";

const pillars = [
  {
    icon: Ruler,
    metric: "Precisión",
    title: "Selección técnica por uso",
    description:
      "Cada formato y superficie se especifica según tránsito, absorción y exposición interior o exterior.",
  },
  {
    icon: ShieldCheck,
    metric: "Durabilidad",
    title: "Marcas garantizadas",
    description:
      "Trabajamos con fabricantes nacionales e importados que cumplen estándares de resistencia y acabado.",
  },
  {
    icon: Compass,
    metric: "Asesoría",
    title: "Acompañamiento en obra",
    description:
      "Cálculo de metraje, merma por cortes e instalación profesional en Quito y valles.",
  },
];

export default function NosotrosSection() {
  return (
    <section id="manifiesto" className="relative z-10 py-14 sm:py-16 lg:py-20">
      <div id="nosotros" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
          <div className="space-y-4 lg:col-span-5">
            <p className="text-xs font-bold tracking-[0.16em] text-[#7A6336] uppercase">
              Manifiesto de Materialidad
            </p>
            <h2
              className="text-3xl font-bold tracking-tight text-[#1F1D1A] sm:text-4xl"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Calidad arquitectónica en cada detalle de obra
            </h2>
            <p className="text-sm leading-relaxed text-[#6E6A63] sm:text-base">
              {BUSINESS.description} Centralizamos asesoría técnica, cálculo de
              metraje, despacho programado e instalación profesional para que cada
              ambiente conserve su estética y desempeño a largo plazo.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-7">
            {pillars.map((pillar) => (
              <div
                key={pillar.metric}
                className="flex flex-col justify-between rounded-2xl border border-[#E6E1D6] bg-white p-5 transition-all duration-200 hover:border-[#C9B079]"
              >
                <div className="space-y-3">
                  <div className="inline-flex size-10 items-center justify-center rounded-xl bg-[#F2EFE9] text-[#7A6336]">
                    <pillar.icon className="size-5" aria-hidden="true" />
                  </div>
                  <p className="text-xs font-bold tracking-[0.14em] text-[#7A6336] uppercase">
                    {pillar.metric}
                  </p>
                  <h3 className="font-sans text-base font-semibold text-[#1F1D1A]">
                    {pillar.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-[#6E6A63]">
                    {pillar.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
