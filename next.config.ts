import type { NextConfig } from "next";

const appUrl = process.env.NEXTAUTH_URL ?? "";
const externalHost = appUrl ? new URL(appUrl).host : undefined;

const nextConfig: NextConfig = {
  ...(externalHost ? { allowedDevOrigins: [externalHost] } : {}),
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

export default nextConfig;
