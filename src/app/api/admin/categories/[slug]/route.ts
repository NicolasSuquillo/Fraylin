import { NextRequest, NextResponse } from "next/server";
import { eq, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/admin-auth";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import type { Category } from "@/types";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { slug } = await params;
  const updated: Category = await req.json().catch(() => null);

  if (!updated || typeof updated !== "object" || !updated.label?.trim()) {
    return NextResponse.json({ error: "Falta el nombre de la categoría" }, { status: 400 });
  }

  const existing = await db.query.categories.findFirst({
    where: eq(categories.slug, slug),
  });
  if (!existing) {
    return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });
  }

  // El slug es la clave que referencian los productos: no se renombra desde aquí
  await db
    .update(categories)
    .set({
      label: updated.label.trim(),
      icon: updated.icon,
      description: updated.description ?? null,
    })
    .where(eq(categories.slug, slug));

  revalidatePath("/");
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { slug } = await params;

  const [{ value: productCount }] = await db
    .select({ value: count() })
    .from(products)
    .where(eq(products.categorySlug, slug));

  if (productCount > 0) {
    return NextResponse.json(
      { error: "No se puede eliminar: hay productos en esta categoría" },
      { status: 409 }
    );
  }

  await db.delete(categories).where(eq(categories.slug, slug));

  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
