import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/admin-auth";
import { db } from "@/db";
import { products, productImages, categories } from "@/db/schema";
import { getAllProducts, getCategories } from "@/lib/products";
import { touchCatalogVersion } from "@/lib/cache-version";
import { validateProductPayload } from "@/lib/validate-product";
import type { Product } from "@/types";

export async function GET() {
  if (!(await getSession())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const [allProducts, categories] = await Promise.all([getAllProducts(), getCategories()]);
  return NextResponse.json({ products: allProducts, categories });
}

export async function POST(req: NextRequest) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const product: Product = await req.json().catch(() => null);
  const invalid = validateProductPayload(product, { requireId: true });
  if (invalid) {
    return NextResponse.json({ error: invalid }, { status: 400 });
  }

  const existing = await db.query.products.findFirst({
    where: eq(products.id, product.id),
  });
  if (existing) {
    return NextResponse.json({ error: "ID ya existe" }, { status: 409 });
  }

  // Validar la categoría contra las existentes para devolver un 400 claro en vez
  // de un 500 por violación de la FK (categorySlug → categories.slug).
  const categoryExists = await db.query.categories.findFirst({
    where: eq(categories.slug, product.category),
  });
  if (!categoryExists) {
    return NextResponse.json({ error: "La categoría no existe" }, { status: 400 });
  }

  try {
    await db.transaction(async (tx) => {
      await tx.insert(products).values({
        id: product.id,
        categorySlug: product.category,
        name: product.name,
        description: product.description ?? null,
        priceCents: product.priceCents ?? null,
        transferPriceCents: product.transferPriceCents ?? null,
        stock: product.stock ?? null,
        featured: product.featured ?? false,
        freeShipping: product.freeShipping ?? false,
        freeInstallation: product.freeInstallation ?? false,
        installationCents: product.installationCents ?? null,
        installationTransferCents: product.installationTransferCents ?? null,
      });

      if (product.images.length > 0) {
        await tx.insert(productImages).values(
          product.images.map((image, index) => ({
            productId: product.id,
            src: image.src,
            alt: image.alt,
            position: index,
          }))
        );
      }
    });
  } catch (err) {
    console.error("Error al crear producto:", err);
    return NextResponse.json(
      { error: "No se pudo crear el producto. Revisa los datos e intenta de nuevo." },
      { status: 400 }
    );
  }

  await touchCatalogVersion();
  revalidatePath("/");
  return NextResponse.json({ ok: true }, { status: 201 });
}
