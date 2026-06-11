import { NextRequest, NextResponse } from "next/server";
import { eq, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/admin-auth";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { getCategories } from "@/lib/products";
import type { Category } from "@/types";

export async function GET() {
  if (!(await getSession())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return NextResponse.json(await getCategories());
}

export async function POST(req: NextRequest) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const category: Category = await req.json().catch(() => null);
  if (!category || typeof category !== "object") {
    return NextResponse.json({ error: "Cuerpo de la petición inválido" }, { status: 400 });
  }
  if (!category.label?.trim()) {
    return NextResponse.json({ error: "Falta el nombre de la categoría" }, { status: 400 });
  }
  if (!category.slug?.trim() || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(category.slug)) {
    return NextResponse.json(
      { error: "Slug inválido: usa solo minúsculas, números y guiones (ej: pisos-exteriores)" },
      { status: 400 }
    );
  }

  const existing = await db.query.categories.findFirst({
    where: eq(categories.slug, category.slug),
  });
  if (existing) {
    return NextResponse.json({ error: "Slug ya existe" }, { status: 409 });
  }

  const [{ value: total }] = await db.select({ value: count() }).from(categories);

  await db.insert(categories).values({
    slug: category.slug,
    label: category.label,
    icon: category.icon,
    description: category.description ?? null,
    position: total,
  });

  revalidatePath("/");
  return NextResponse.json({ ok: true }, { status: 201 });
}
