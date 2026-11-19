import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ArchitecturalBackground from "@/components/ui/ArchitecturalBackground";
import { getGalleryItems } from "@/lib/gallery";
import { getCategories } from "@/lib/products";
import { SITE_NAME } from "@/lib/site";
import ProyectosClient from "./ProyectosClient";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: `Proyectos y Ambientes | ${SITE_NAME}`,
  description:
    "Galería editorial de obras y ambientes terminados con acabados de Fraylin en Quito.",
};

export default async function ProyectosPage() {
  const [items, categories] = await Promise.all([
    getGalleryItems(),
    getCategories(),
  ]);

  return (
    <div className="relative min-h-dvh bg-[#F4F1EA]">
      <ArchitecturalBackground />
      <Header />
      <main
        id="contenido-principal"
        tabIndex={-1}
        className="relative z-10 mx-auto max-w-7xl px-4 pt-24 pb-16 outline-none sm:px-6 sm:pt-28 lg:px-8"
      >
        <ProyectosClient items={items} categories={categories} />
      </main>
      <Footer />
    </div>
  );
}
