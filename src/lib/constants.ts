export const BUSINESS = {
  name: "Fraylin",
  tagline: "Acabados para la construcción",
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

export function buildWhatsAppUrl(number: string, message: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
