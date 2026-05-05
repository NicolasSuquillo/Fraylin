import { getAllProducts, getCategories } from "@/lib/products";
import HeroSection from "@/components/sections/HeroSection";
import ServiciosSection from "@/components/sections/ServiciosSection";
import ProductosSection from "@/components/sections/ProductosSection";
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

  return (
    <>
      <ScrollToTop />
      <Header />
      <main>
        <HeroSection />
        <ServiciosSection />
        <ProductosSection products={products} categories={categories} />
        <GaleriaSection />
        <NosotrosSection />
        <ContactoSection />
      </main>
      <Footer />
      <FloatingWhatsApp />
    </>
  );
}
