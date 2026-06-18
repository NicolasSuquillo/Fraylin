import { BUSINESS } from "@/lib/constants";
import { SITE_URL } from "@/lib/site";

function phoneToE164(display: string): string {
  const digits = display.replace(/\D/g, "");
  if (digits.startsWith("593")) return `+${digits}`;
  if (digits.startsWith("0")) return `+593${digits.slice(1)}`;
  return `+593${digits}`;
}

export default function LocalBusinessJsonLd() {
  const json = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: BUSINESS.name,
        alternateName: [
          "Fraylin Acabados",
          "Fraylin Acabados para la Construcción",
        ],
        description: BUSINESS.description,
        inLanguage: "es-EC",
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": ["LocalBusiness", "HomeAndConstructionBusiness", "Store"],
        "@id": `${SITE_URL}/#organization`,
        name: BUSINESS.name,
        alternateName: "Fraylin Acabados",
        url: SITE_URL,
        logo: `${SITE_URL}/logotipo.png`,
        image: `${SITE_URL}/logotipo.png`,
        description: BUSINESS.description,
        telephone: BUSINESS.phones.map(phoneToE164),
        address: {
          "@type": "PostalAddress",
          streetAddress: "Avenida Juan de Molinares E14-155",
          addressLocality: "Quito",
          addressRegion: "Pichincha",
          addressCountry: "EC",
        },
        sameAs: [
          BUSINESS.social.facebook,
          BUSINESS.social.instagram,
          BUSINESS.social.tiktok,
          BUSINESS.social.linktree,
        ],
        openingHoursSpecification: [
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
            ],
            opens: "07:00",
            closes: "20:30",
          },
        ],
        priceRange: "$$",
        areaServed: {
          "@type": "City",
          name: "Quito",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
