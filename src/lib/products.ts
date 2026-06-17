import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { products, categories, productImages } from "@/db/schema";
import type { Product, Category } from "@/types";

type ProductWithRelations = typeof products.$inferSelect & {
  images: (typeof productImages.$inferSelect)[];
};

function mapProduct(row: ProductWithRelations): Product {
  return {
    id: row.id,
    category: row.categorySlug,
    name: row.name,
    priceCents: row.priceCents,
    stock: row.stock,
    description: row.description ?? undefined,
    featured: row.featured,
    freeShipping: row.freeShipping,
    freeInstallation: row.freeInstallation,
    installationCents: row.installationCents,
    images: row.images.map((image) => ({ src: image.src, alt: image.alt })),
  };
}

export async function getAllProducts(): Promise<Product[]> {
  const rows = await db.query.products.findMany({
    with: { images: { orderBy: (image, { asc }) => [asc(image.position)] } },
    orderBy: (product, { asc }) => [asc(product.createdAt), asc(product.id)],
  });
  return rows.map(mapProduct);
}

export async function getCategories(): Promise<Category[]> {
  const rows = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.position));
  return rows.map((row) => ({
    slug: row.slug,
    label: row.label,
    icon: row.icon,
    description: row.description ?? undefined,
  }));
}

export async function getProductsByCategory(slug: string): Promise<Product[]> {
  const rows = await db.query.products.findMany({
    where: eq(products.categorySlug, slug),
    with: { images: { orderBy: (image, { asc }) => [asc(image.position)] } },
    orderBy: (product, { asc }) => [asc(product.createdAt), asc(product.id)],
  });
  return rows.map(mapProduct);
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const rows = await db.query.products.findMany({
    where: eq(products.featured, true),
    with: { images: { orderBy: (image, { asc }) => [asc(image.position)] } },
    orderBy: (product, { asc }) => [asc(product.createdAt), asc(product.id)],
  });
  return rows.map(mapProduct);
}
