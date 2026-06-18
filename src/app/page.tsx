import { getAllProducts, getCategories } from "@/lib/products";
import { getGalleryItems } from "@/lib/gallery";
import { getApprovedReviews } from "@/lib/reviews";
import CartSync from "@/components/cart/CartSync";
import HeroSection from "@/components/sections/HeroSection";
import ServiciosSection from "@/components/sections/ServiciosSection";
import ProductsCatalog from "@/components/products/ProductsCatalog";
import GaleriaSection from "@/components/sections/GaleriaSection";
import TestimoniosSection from "@/components/sections/TestimoniosSection";
import NosotrosSection from "@/components/sections/NosotrosSection";
import ContactoSection from "@/components/sections/ContactoSection";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FloatingWhatsApp from "@/components/ui/FloatingWhatsApp";
import ScrollToTop from "@/components/ui/ScrollToTop";

export const revalidate = 3600;

export default async function Home() {
  const [products, categories, galleryItems, approvedReviews] = await Promise.all([
    getAllProducts(),
    getCategories(),
    getGalleryItems(),
    getApprovedReviews(),
  ]);
  const featuredProducts = products.filter((p) => p.featured);

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
      <CartSync products={products} />
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
        <TestimoniosSection reviews={approvedReviews} />
        <NosotrosSection />
        <ContactoSection />
      </main>
      <Footer />
      <FloatingWhatsApp />
    </>
  );
}
