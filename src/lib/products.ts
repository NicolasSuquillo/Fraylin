import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { products, categories, productImages } from "@/db/schema";
import type { Product, Category } from "@/types";

type ProductWithRelations = typeof products.$inferSelect & {
  images: (typeof productImages.$inferSelect)[];
};

type MapProductOptions = {
  /** Incluye costo y notas internas (solo admin). */
  includeAdminFields?: boolean;
};

function mapProduct(
  row: ProductWithRelations,
  opts: MapProductOptions = {}
): Product {
  const product: Product = {
    id: row.id,
    category: row.categorySlug,
    name: row.name,
    priceCents: row.priceCents,
    transferPriceCents: row.transferPriceCents,
    stock: row.stock,
    description: row.description ?? undefined,
    featured: row.featured,
    freeShipping: row.freeShipping,
    freeInstallation: row.freeInstallation,
    installationCents: row.installationCents,
    installationTransferCents: row.installationTransferCents,
    showOnWeb: row.showOnWeb,
    showInCatalog: row.showInCatalog,
    specs: row.specs ?? undefined,
    images: row.images.map((image) => ({ src: image.src, alt: image.alt })),
  };

  if (opts.includeAdminFields) {
    product.costCents = row.costCents;
    product.internalNotes = row.internalNotes ?? undefined;
  }

  return product;
}

export async function getAllProducts(): Promise<Product[]> {
  const rows = await db.query.products.findMany({
    with: { images: { orderBy: (image, { asc }) => [asc(image.position)] } },
    orderBy: (product, { asc }) => [asc(product.createdAt), asc(product.id)],
  });
  return rows.map((row) => mapProduct(row, { includeAdminFields: true }));
}

/** Productos visibles en la home pública. */
export async function getWebProducts(): Promise<Product[]> {
  const rows = await db.query.products.findMany({
    where: eq(products.showOnWeb, true),
    with: { images: { orderBy: (image, { asc }) => [asc(image.position)] } },
    orderBy: (product, { asc }) => [asc(product.createdAt), asc(product.id)],
  });
  return rows.map((row) => mapProduct(row));
}

/** Productos del catálogo compartible / PDF. */
export async function getCatalogProducts(categorySlug?: string): Promise<Product[]> {
  const where = categorySlug
    ? and(eq(products.showInCatalog, true), eq(products.categorySlug, categorySlug))
    : eq(products.showInCatalog, true);

  const rows = await db.query.products.findMany({
    where,
    with: { images: { orderBy: (image, { asc }) => [asc(image.position)] } },
    orderBy: (product, { asc }) => [asc(product.createdAt), asc(product.id)],
  });
  return rows.map((row) => mapProduct(row));
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
    where: and(eq(products.categorySlug, slug), eq(products.showOnWeb, true)),
    with: { images: { orderBy: (image, { asc }) => [asc(image.position)] } },
    orderBy: (product, { asc }) => [asc(product.createdAt), asc(product.id)],
  });
  return rows.map((row) => mapProduct(row));
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const rows = await db.query.products.findMany({
    where: and(eq(products.featured, true), eq(products.showOnWeb, true)),
    with: { images: { orderBy: (image, { asc }) => [asc(image.position)] } },
    orderBy: (product, { asc }) => [asc(product.createdAt), asc(product.id)],
  });
  return rows.map((row) => mapProduct(row));
}
