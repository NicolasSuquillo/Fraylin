import type { NextConfig } from "next";

const appUrl = process.env.NEXTAUTH_URL ?? "";
const externalHost = appUrl ? new URL(appUrl).host : undefined;

const nextConfig: NextConfig = {
  ...(externalHost ? { allowedDevOrigins: [externalHost] } : {}),
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
