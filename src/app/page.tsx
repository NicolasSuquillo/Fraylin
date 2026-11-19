import { getWebProducts, getCategories } from "@/lib/products";
import { getGalleryItems } from "@/lib/gallery";
import CartSync from "@/components/cart/CartSync";
import ArchitecturalBackground from "@/components/ui/ArchitecturalBackground";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/sections/HeroSection";
import AmbientesSection from "@/components/sections/AmbientesSection";
import DestacadosSection from "@/components/sections/DestacadosSection";
import NosotrosSection from "@/components/sections/NosotrosSection";
import ProjectsBridgeSection from "@/components/sections/ProjectsBridgeSection";
import ContactoSection from "@/components/sections/ContactoSection";
import FloatingWhatsApp from "@/components/ui/FloatingWhatsApp";
import ScrollToTop from "@/components/ui/ScrollToTop";

export const revalidate = 3600;

export default async function Home() {
  const [products, categories, galleryItems] = await Promise.all([
    getWebProducts(),
    getCategories(),
    getGalleryItems(),
  ]);
  const featuredProducts = products.filter((p) => p.featured);

  return (
    <div className="relative min-h-dvh bg-[#F4F1EA]">
      <ArchitecturalBackground />
      <ScrollToTop />
      <CartSync products={products} />
      <Header />
      <main id="contenido-principal" tabIndex={-1} className="relative z-10 outline-none">
        <HeroSection />
        <AmbientesSection categories={categories} />
        <DestacadosSection products={featuredProducts} categories={categories} />
        <NosotrosSection />
        <ProjectsBridgeSection items={galleryItems} />
        <ContactoSection />
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
