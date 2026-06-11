import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/admin-auth";
import { tryDeletePublicUploads } from "@/lib/delete-public-upload";
import { db } from "@/db";
import { products, productImages } from "@/db/schema";
import { validateProductPayload } from "@/lib/validate-product";
import type { Product } from "@/types";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const updated: Product = await req.json().catch(() => null);
  const invalid = validateProductPayload(updated);
  if (invalid) {
    return NextResponse.json({ error: invalid }, { status: 400 });
  }

  const previous = await db.query.products.findFirst({
    where: eq(products.id, id),
    with: { images: true },
  });

  if (!previous) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  await db.transaction(async (tx) => {
    await tx
      .update(products)
      .set({
        categorySlug: updated.category,
        name: updated.name,
        description: updated.description ?? null,
        displayPrice: updated.price ?? null,
        priceCents: updated.priceCents ?? null,
        stock: updated.stock ?? null,
        featured: updated.featured ?? false,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id));

    await tx.delete(productImages).where(eq(productImages.productId, id));

    if (updated.images.length > 0) {
      await tx.insert(productImages).values(
        updated.images.map((image, index) => ({
          productId: id,
          src: image.src,
          alt: image.alt,
          position: index,
        }))
      );
    }
  });

  const prevSrcs = new Set(previous.images.map((i) => i.src.trim()));
  const nextSrcs = new Set(updated.images.map((i) => i.src.trim()));
  const orphaned = [...prevSrcs].filter((s) => s && !nextSrcs.has(s));
  await tryDeletePublicUploads(orphaned);

  revalidatePath("/");
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const removed = await db.query.products.findFirst({
    where: eq(products.id, id),
    with: { images: true },
  });

  if (!removed) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  await db.delete(products).where(eq(products.id, id));

  await tryDeletePublicUploads(removed.images.map((i) => i.src.trim()));

  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
