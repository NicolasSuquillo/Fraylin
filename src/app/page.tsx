import { getAllProducts, getCategories } from "@/lib/products";
import HeroSection from "@/components/sections/HeroSection";
import ServiciosSection from "@/components/sections/ServiciosSection";
import ProductosSection from "@/components/sections/ProductosSection";
import GaleriaSection from "@/components/sections/GaleriaSection";
import NosotrosSection from "@/components/sections/NosotrosSection";
import ContactoSection from "@/components/sections/ContactoSection";

export default function Home() {
  const products = getAllProducts();
  const categories = getCategories();

  return (
    <>
      <HeroSection />
      <ServiciosSection />
      <ProductosSection products={products} categories={categories} />
      <GaleriaSection />
      <NosotrosSection />
      <ContactoSection />
    </>
  );
}
