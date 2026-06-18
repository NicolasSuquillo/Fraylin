const rawSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://fraylinacabados.com";

export const SITE_URL = rawSiteUrl;
export const SITE_NAME = "Fraylin";
export const SITE_TITLE =
  "Fraylin | Acabados para la Construcción en Quito, Ecuador";
export const SITE_DESCRIPTION =
  "Fraylin — tienda de acabados para la construcción en Quito. Cerámica, porcelanato, grifería, muebles de baño y piedra decorativa. Asesoría e instalación a domicilio.";
