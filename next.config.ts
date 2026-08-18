import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const appUrl = process.env.NEXTAUTH_URL ?? "";
const externalHost = appUrl ? new URL(appUrl).host : undefined;

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  cacheStartUrl: true,
  dynamicStartUrl: true,
  dynamicStartUrlRedirect: "/admin-login",
  publicExcludes: [
    "!products/**/*",
    "!gallery/**/*",
    "!fondo.png",
    "!fondo.webp",
    "!fondo-mobile.webp",
  ],
});

const nextConfig: NextConfig = {
  ...(externalHost ? { allowedDevOrigins: [externalHost] } : {}),
  // next-pwa inyecta un plugin de webpack; esto silencia el aviso de Turbopack en `next dev`.
  turbopack: {},
  experimental: {
    staleTimes: {
      // Mínimo permitido por Next 16; mantiene corto el caché del router
      // cliente para que los cambios del admin se reflejen pronto en "/".
      static: 30,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default withPWA(nextConfig);
