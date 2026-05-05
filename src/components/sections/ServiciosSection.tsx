import SectionHeading from "@/components/ui/SectionHeading";
import {
  Grid2X2,
  Droplets,
  LayoutPanelLeft,
  Mountain,
  Wrench,
  Package,
  Truck,
  Hammer,
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
    icon: Wrench,
    title: "Instalación y Asesoría",
    description:
      "Servicio técnico especializado. Plomería, albañilería y asesoría personalizada.",
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
  {
    icon: Hammer,
    title: "Remodelaciones",
    description:
      "Transformamos tu hogar con acabados de calidad y mano de obra especializada.",
  },
];

export default function ServiciosSection() {
  return (
    <section id="servicios" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Nuestros Servicios"
          subtitle="Todo lo que necesitas para acabar tu obra con calidad y estilo"
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {servicios.map((servicio) => (
            <div
              key={servicio.title}
              className="group p-5 rounded-2xl border border-gray-100 hover:border-brand-light hover:shadow-lg transition-all duration-300 bg-neutral-light hover:bg-white"
            >
              <div className="w-12 h-12 bg-accent-cream rounded-xl flex items-center justify-center mb-3 group-hover:bg-brand-primary transition-colors">
                <servicio.icon
                  size={24}
                  className="text-brand-primary group-hover:text-white transition-colors"
                />
              </div>
              <h3
                className="text-sm font-bold text-neutral-dark mb-1.5 group-hover:text-brand-primary transition-colors"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {servicio.title}
              </h3>
              <p className="text-xs text-neutral-mid leading-relaxed">
                {servicio.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
