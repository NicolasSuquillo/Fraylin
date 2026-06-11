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

export const revalidate = 3600;

export default async function Home() {
  const [products, categories, featuredProducts, galleryItems] = await Promise.all([
    getAllProducts(),
    getCategories(),
    getFeaturedProducts(),
    getGalleryItems(),
  ]);

  return (
    <>
      <link
        rel="preload"
        as="image"
        href="/fondo-mobile.webp"
        type="image/webp"
        media="(max-width: 767px)"
      />
      <link
        rel="preload"
        as="image"
        href="/fondo.webp"
        type="image/webp"
        media="(min-width: 768px)"
      />
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
