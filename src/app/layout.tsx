import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import "./globals.css";

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-playfair",
  display: "swap",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export const metadata: Metadata = {
  title: "Fraylin — Acabados para la Construcción | Quito, Ecuador",
  description:
    "Tienda de acabados para la construcción en Quito. Cerámica, porcelanato, grifería, muebles de baño, piedra decorativa. Asesoría e instalación a domicilio.",
  keywords:
    "acabados construcción Quito, cerámica, porcelanato, grifería, sanitarios, muebles baño, piedra decorativa, Fraylin",
  openGraph: {
    title: "Fraylin — Acabados para la Construcción",
    description:
      "Materiales de alta calidad para el acabado de obras civiles y remodelaciones en Quito, Ecuador.",
    locale: "es_EC",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={playfairDisplay.variable}>
      <body>{children}</body>
    </html>
  );
}
