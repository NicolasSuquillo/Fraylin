import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FloatingWhatsApp from "@/components/ui/FloatingWhatsApp";
import ScrollToTop from "@/components/ui/ScrollToTop";

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
    <html lang="es">
      <body>
        <ScrollToTop />
        <Header />
        <main>{children}</main>
        <Footer />
        <FloatingWhatsApp />
      </body>
    </html>
  );
}
