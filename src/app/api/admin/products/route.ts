import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/admin-auth";
import { db } from "@/db";
import { products, productImages } from "@/db/schema";
import { getAllProducts, getCategories } from "@/lib/products";
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

  await db.transaction(async (tx) => {
    await tx.insert(products).values({
      id: product.id,
      categorySlug: product.category,
      name: product.name,
      description: product.description ?? null,
      displayPrice: product.price ?? null,
      priceCents: product.priceCents ?? null,
      stock: product.stock ?? null,
      featured: product.featured ?? false,
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

  revalidatePath("/");
  return NextResponse.json({ ok: true }, { status: 201 });
}
