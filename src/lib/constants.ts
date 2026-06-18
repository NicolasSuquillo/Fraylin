export const BUSINESS = {
  name: "Fraylin",
  tagline: "Acabados para la construcción",
  ruc: "1709460248001",
  description:
    "Empresa dedicada a la comercialización de materiales de alta calidad para el acabado de obras civiles y remodelaciones en Quito.",
  address: "Avenida Juan de Molinares E14-155, Quito, Ecuador",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Fraylin+Acabados+Juan+de+Molinares+Quito",
  mapsEmbedUrl:
    "https://maps.google.com/maps?q=Fraylin+Acabados+Juan+de+Molinares+Quito&z=17&ie=UTF8&iwloc=&output=embed",
  phones: ["098 4025 792", "098 4297 259"],
  whatsapp: [
    { number: "593984025792", label: "Línea 1" },
    { number: "593984297259", label: "Línea 2" },
  ],
  social: {
    facebook:
      "https://www.facebook.com/share/1AvW798Yn1/?mibextid=wwXIfr",
    instagram: "https://www.instagram.com/fraylin.acabados",
    tiktok: "https://www.tiktok.com/@fraylin.0013",
    linktree: "https://linktr.ee/fraylin",
  },
  hours: {
    weekdays: "Lunes a Viernes: 07:00 – 20:30",
    saturday: "Sábados: 07:00 – 20:30",
    sunday: "Domingos: Disponible",
    note: "Horario flexible — atención personalizada disponible todo el día.",
  },
} as const;

export const SHIPPING_ZONES = [
  { id: "comite-del-pueblo", label: "Comité del Pueblo y alrededores", cents: 0 },
  { id: "quito-norte-centro", label: "Quito norte/centro", cents: 300 },
  { id: "quito-sur-valles", label: "Quito sur/valles", cents: 500 },
  { id: "fuera-quito", label: "Fuera de Quito", cents: 1000 },
] as const;

export const INSTALLATION_CENTS = 1500;

export const SHIPPING_DESCRIPTION_DEFAULT =
  'El envío no está incluido en el precio de los productos. Nos ubicamos en el sector "Comité del Pueblo"; el costo de envío depende de tu zona.';

export const INSTALLATION_DESCRIPTION_DEFAULT =
  "Nuestro equipo instala el producto al momento de la entrega.";

export const TRANSFER_INSTRUCTIONS_DEFAULT =
  "Realiza la transferencia o el pago por Deuna a los datos indicados y envía el comprobante por este chat para confirmar tu pedido. Verificamos cada pago manualmente antes de procesar el envío.";

export function buildWhatsAppUrl(number: string, message: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
