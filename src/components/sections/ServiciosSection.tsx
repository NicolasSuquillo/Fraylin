import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/ui/Reveal";
import {
  Grid2X2,
  Droplets,
  LayoutPanelLeft,
  Mountain,
  Package,
  Truck,
} from "lucide-react";

const servicios = [
  {
    icon: Grid2X2,
    title: "Pisos y Recubrimientos",
    description:
      "Cerámica y porcelanato de alta calidad. Instalación profesional con acabados perfectos.",
  },
  {
    icon: Droplets,
    title: "Grifería y Sanitarios",
    description:
      "Griferías, lavabos, inodoros y accesorios de baño de marcas reconocidas.",
  },
  {
    icon: LayoutPanelLeft,
    title: "Muebles de Baño y Cocina",
    description:
      "Vanitorios y muebles funcionales con diseño moderno para tu hogar.",
  },
  {
    icon: Mountain,
    title: "Piedra Decorativa",
    description:
      "Fachaletas y piedra natural para fachadas e interiores con acabado rústico elegante.",
  },
  {
    icon: Package,
    title: "Materiales y Ferretería",
    description:
      "Pegantes, adhesivos, herramientas y materiales para la construcción y remodelación.",
  },
  {
    icon: Truck,
    title: "Servicio a Domicilio",
    description:
      "Entrega y atención en tu obra o domicilio en Quito. Rápido y confiable.",
  },
];

export default function ServiciosSection() {
  return (
    <section id="servicios" className="py-20 bg-accent-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal delay={0}>
          <SectionHeading
            title="Nuestros Servicios"
            subtitle="Todo lo que necesitas para acabar tu obra con calidad y estilo"
          />
        </Reveal>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {servicios.map((servicio, i) => (
            <Reveal key={servicio.title} delay={i * 0.07}>
            <div
              className="group p-5 rounded-2xl border border-brand-primary/20 hover:border-brand-primary transition-all duration-300 bg-surface-primary hover:shadow-[0_8px_32px_-8px_rgba(201,168,76,0.2)]"
            >
              <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-brand-primary transition-colors">
                <servicio.icon
                  size={24}
                  className="text-brand-primary group-hover:text-neutral-dark transition-colors"
                />
              </div>
              <h3
                className="text-sm font-bold text-text-primary mb-1.5 group-hover:text-brand-primary transition-colors"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {servicio.title}
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                {servicio.description}
              </p>
            </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
