import { getAllProducts, getCategories, getFeaturedProducts } from "@/lib/products";
import { getGalleryItems } from "@/lib/gallery";
import HeroSection from "@/components/sections/HeroSection";
import ServiciosSection from "@/components/sections/ServiciosSection";
import ProductsCatalog from "@/components/products/ProductsCatalog";
import GaleriaSection from "@/components/sections/GaleriaSection";
import NosotrosSection from "@/components/sections/NosotrosSection";
import ContactoSection from "@/components/sections/ContactoSection";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FloatingWhatsApp from "@/components/ui/FloatingWhatsApp";
import ScrollToTop from "@/components/ui/ScrollToTop";

export default function Home() {
  const products = getAllProducts();
  const categories = getCategories();
  const featuredProducts = getFeaturedProducts();
  const galleryItems = getGalleryItems();

  return (
    <>
      <ScrollToTop />
      <Header />
      <main>
        <HeroSection />
        <ServiciosSection />
        <ProductsCatalog
          products={products}
          categories={categories}
          featuredProducts={featuredProducts}
        />
        <GaleriaSection items={galleryItems} />
        <NosotrosSection />
        <ContactoSection />
      </main>
      <Footer />
      <FloatingWhatsApp />
    </>
  );
}
