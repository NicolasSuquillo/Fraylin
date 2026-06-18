import type { MetadataRoute } from "next";
import { BUSINESS } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BUSINESS.name} — ${BUSINESS.tagline}`,
    short_name: BUSINESS.name,
    description: BUSINESS.description,
    start_url: "/",
    display: "standalone",
    background_color: "#faf8f4",
    theme_color: "#c9a84c",
    lang: "es-EC",
    icons: [
      {
        src: "/logotipo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
