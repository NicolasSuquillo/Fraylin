import type { Metadata } from "next";
import { getCatalogProducts, getCategories } from "@/lib/products";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import CatalogClient from "./CatalogClient";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: `Catálogo | ${SITE_NAME}`,
  description:
    "Catálogo de productos Fraylin con precios de transferencia y tarjeta.",
  alternates: { canonical: "/catalogo" },
  openGraph: {
    title: `Catálogo | ${SITE_NAME}`,
    url: `${SITE_URL}/catalogo`,
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const [products, categories] = await Promise.all([
    getCatalogProducts(),
    getCategories(),
  ]);

  const initialCategory =
    category && categories.some((c) => c.slug === category) ? category : "";

  return (
    <CatalogClient
      products={products}
      categories={categories}
      initialCategory={initialCategory}
    />
  );
}
