import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartSync from "@/components/cart/CartSync";
import ArchitecturalBackground from "@/components/ui/ArchitecturalBackground";
import ProductCard from "@/components/products/ProductCard";
import {
  getCategories,
  getPublicProductById,
  getProductsByCategory,
  getWebProducts,
} from "@/lib/products";
import { SITE_NAME } from "@/lib/site";
import ProductDetailClient from "./ProductDetailClient";

export const revalidate = 3600;

function safeProductId(slug: string): string {
  try {
    return decodeURIComponent(slug).trim();
  } catch {
    return slug.trim();
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublicProductById(safeProductId(slug));
  if (!product) {
    return { title: `Producto no encontrado | ${SITE_NAME}` };
  }
  return {
    title: product.name,
    description:
      product.description ??
      `${product.name} disponible en Fraylin Acabados, Quito.`,
  };
}

export default async function ProductoDetallePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const decodedId = safeProductId(slug);
  const [product, categories, webProducts] = await Promise.all([
    getPublicProductById(decodedId),
    getCategories(),
    getWebProducts(),
  ]);

  if (!product) {
    notFound();
  }

  const categoryLabel =
    categories.find((c) => c.slug === product.category)?.label ??
    product.category;
  const sameCategory = await getProductsByCategory(product.category);
  const relatedProducts = sameCategory
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="relative min-h-dvh bg-[#F4F1EA]">
      <ArchitecturalBackground />
      <CartSync products={webProducts} />
      <Header />
      <main
        id="contenido-principal"
        tabIndex={-1}
        className="relative z-10 mx-auto max-w-7xl px-4 pt-24 pb-16 outline-none sm:px-6 sm:pt-28 lg:px-8"
      >
        <ProductDetailClient
          product={product}
          categoryLabel={categoryLabel}
        />

        {relatedProducts.length > 0 && (
          <section className="mt-16 border-t border-[#E6E1D6] pt-12">
            <h2
              className="mb-6 text-2xl font-bold text-[#1F1D1A]"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Otros acabados en {categoryLabel}
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((rel) => (
                <ProductCard
                  key={rel.id}
                  product={rel}
                  categories={categories}
                />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
