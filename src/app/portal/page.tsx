import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ArchitecturalBackground from "@/components/ui/ArchitecturalBackground";
import { buildPortalUrl, SITE_NAME } from "@/lib/site";
import PortalBridgeClient from "./PortalBridgeClient";

export const metadata: Metadata = {
  title: `Portal Clientes | ${SITE_NAME}`,
  description:
    "Accede al Portal Clientes de Fraylin Acabados o rastrea tu pedido por código en tiempo real.",
};

export default function PortalPage() {
  const portalLoginUrl = buildPortalUrl("/login") ?? buildPortalUrl();

  return (
    <div className="relative flex min-h-dvh flex-col bg-[#F4F1EA]">
      <ArchitecturalBackground />
      <Header />
      <main
        id="contenido-principal"
        tabIndex={-1}
        className="relative z-10 flex flex-1 items-center justify-center px-4 pt-28 pb-16 outline-none"
      >
        <PortalBridgeClient portalLoginUrl={portalLoginUrl} />
      </main>
      <Footer />
    </div>
  );
}
