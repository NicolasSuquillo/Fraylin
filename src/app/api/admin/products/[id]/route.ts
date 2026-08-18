import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/admin-auth";
import { tryDeletePublicUploads } from "@/lib/delete-public-upload";
import { touchCatalogVersion } from "@/lib/cache-version";
import { db } from "@/db";
import { products, productImages } from "@/db/schema";
import { validateProductPayload, MAX_STOCK } from "@/lib/validate-product";
import type { Product } from "@/types";

function revalidateCatalogPaths() {
  revalidatePath("/");
  revalidatePath("/catalogo");
}

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
        priceCents: updated.priceCents ?? null,
        transferPriceCents: updated.transferPriceCents ?? null,
        stock: updated.stock ?? null,
        featured: updated.featured ?? false,
        freeShipping: updated.freeShipping ?? false,
        freeInstallation: updated.freeInstallation ?? false,
        installationCents: updated.installationCents ?? null,
        installationTransferCents: updated.installationTransferCents ?? null,
        showOnWeb: updated.showOnWeb ?? true,
        showInCatalog: updated.showInCatalog ?? true,
        costCents: updated.costCents ?? null,
        internalNotes: updated.internalNotes?.trim() || null,
        specs: updated.specs?.trim() || null,
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

  await touchCatalogVersion();
  revalidateCatalogPaths();
  return NextResponse.json({ ok: true });
}

/** Actualización rápida: visibilidad y/o stock sin reenviar el producto completo. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await req.json().catch(() => null)) as {
    showOnWeb?: boolean;
    showInCatalog?: boolean;
    stock?: number | null;
  } | null;

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const patch: {
    showOnWeb?: boolean;
    showInCatalog?: boolean;
    stock?: number | null;
    updatedAt: Date;
  } = { updatedAt: new Date() };

  if ("showOnWeb" in body) {
    if (typeof body.showOnWeb !== "boolean") {
      return NextResponse.json({ error: "showOnWeb inválido" }, { status: 400 });
    }
    patch.showOnWeb = body.showOnWeb;
  }
  if ("showInCatalog" in body) {
    if (typeof body.showInCatalog !== "boolean") {
      return NextResponse.json({ error: "showInCatalog inválido" }, { status: 400 });
    }
    patch.showInCatalog = body.showInCatalog;
  }
  if ("stock" in body) {
    if (
      body.stock != null &&
      (!Number.isInteger(body.stock) || body.stock < 0 || body.stock > MAX_STOCK)
    ) {
      return NextResponse.json({ error: "Stock inválido" }, { status: 400 });
    }
    patch.stock = body.stock ?? null;
  }

  if (
    patch.showOnWeb === undefined &&
    patch.showInCatalog === undefined &&
    !("stock" in body)
  ) {
    return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
  }

  const updated = await db
    .update(products)
    .set(patch)
    .where(eq(products.id, id))
    .returning({ id: products.id });

  if (updated.length === 0) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  await touchCatalogVersion();
  revalidateCatalogPaths();
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

  await touchCatalogVersion();
  revalidateCatalogPaths();
  return NextResponse.json({ ok: true });
}
